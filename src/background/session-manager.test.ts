import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installChromeMock } from '../test/chrome-mock';
import { db } from '../db/database';

type SM = typeof import('./session-manager');

/** Fresh copy of the module = a freshly restarted service worker (module state is gone). */
async function freshWorker(): Promise<SM> {
  vi.resetModules();
  return import('./session-manager');
}

const URL_A = 'https://arxiv.org/abs/2401.00001';
const URL_B = 'https://github.com/a/b';

beforeEach(async () => {
  installChromeMock();
  await db.delete();
  await db.open();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2025, 5, 15, 9, 0, 0));
});

afterEach(() => vi.useRealTimers());

describe('session manager', () => {
  it('does not create duplicate pages for concurrent visits to the same URL', async () => {
    const sm = await freshWorker();
    await Promise.all(Array.from({ length: 6 }, () => sm.handlePageVisit(URL_A, 'Paper')));
    expect(await db.pages.count()).toBe(1);
    expect(await db.sessions.count()).toBe(1);
  });

  it('records parent → child navigation once', async () => {
    const sm = await freshWorker();
    await sm.handlePageVisit(URL_A, 'Paper');
    await sm.handlePageVisit(URL_B, 'Repo', URL_A);
    await sm.handlePageVisit(URL_B, 'Repo', URL_A);
    expect(await db.relationships.count()).toBe(1);
  });

  it('skips excluded and user-blocked URLs', async () => {
    const { local } = installChromeMock();
    local.settings = { blockedDomains: ['blocked.example'] };
    const sm = await freshWorker();
    expect(await sm.handlePageVisit('https://mail.google.com/', 'Mail')).toBeNull();
    expect(await sm.handlePageVisit('https://blocked.example/x', 'X')).toBeNull();
    expect(await db.pages.count()).toBe(0);
    expect(await db.sessions.count()).toBe(0);
  });

  it('resumes the same session after a worker restart (regression: always started a new one)', async () => {
    const first = await freshWorker();
    const page = await first.handlePageVisit(URL_A, 'Paper');
    vi.setSystemTime(Date.now() + 60_000);

    const restarted = await freshWorker();
    expect((await restarted.getCurrentSession())?.id).toBe(page!.sessionId);
    const again = await restarted.handlePageVisit(URL_B, 'Repo');
    expect(again!.sessionId).toBe(page!.sessionId);
    expect(await db.sessions.count()).toBe(1);
  });

  it('ends an idle session at its last activity, not at "now"', async () => {
    const sm = await freshWorker();
    const page = await sm.handlePageVisit(URL_A, 'Paper');
    const lastActivity = Date.now();

    vi.setSystemTime(lastActivity + sm.IDLE_TIMEOUT_MS + 5 * 60_000);
    await sm.checkIdleTimeout();

    expect(sm.getCurrentSessionId()).toBeNull();
    const session = await db.sessions.get(page!.sessionId);
    expect(session).toMatchObject({ isActive: false, endTime: lastActivity });
  });

  it('keeps a session alive while activity continues', async () => {
    const sm = await freshWorker();
    await sm.handlePageVisit(URL_A, 'Paper');
    for (let i = 0; i < 4; i++) {
      vi.setSystemTime(Date.now() + 10 * 60_000);
      sm.notifyActivity();
      await sm.checkIdleTimeout();
    }
    expect(sm.getCurrentSessionId()).not.toBeNull();
  });

  it('closes a stale session found on restart instead of resuming it', async () => {
    const first = await freshWorker();
    const page = await first.handlePageVisit(URL_A, 'Paper');
    const lastActivity = Date.now();

    vi.setSystemTime(lastActivity + 3 * 60 * 60_000);
    const restarted = await freshWorker();
    expect(await restarted.getCurrentSession()).toBeNull();
    expect((await db.sessions.get(page!.sessionId))?.endTime).toBe(lastActivity);
  });

  it('starts a new session for a visit after the idle window', async () => {
    const sm = await freshWorker();
    const a = await sm.handlePageVisit(URL_A, 'Paper');
    vi.setSystemTime(Date.now() + sm.IDLE_TIMEOUT_MS + 1000);
    const b = await sm.handlePageVisit(URL_B, 'Repo');
    expect(b!.sessionId).not.toBe(a!.sessionId);
    expect(await db.sessions.count()).toBe(2);
  });
});
