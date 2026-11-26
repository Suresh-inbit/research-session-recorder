import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installChromeMock, settle } from '../test/chrome-mock';
import { db } from '../db/database';

type Mock = ReturnType<typeof installChromeMock>;
type TT = typeof import('./time-tracker');

const PAPER = 'https://arxiv.org/abs/2401.00001';
const REPO = 'https://github.com/a/b';
const T0 = new Date(2025, 5, 15, 9, 0, 0).getTime();

let mock: Mock;

/** Boot a fresh "service worker": new module instances + listeners registered. */
async function boot(): Promise<TT> {
  vi.resetModules();
  const tt = await import('./time-tracker');
  tt.initTimeTracker();
  await settle();
  return tt;
}

const advance = (ms: number) => vi.setSystemTime(Date.now() + ms);
const activeSeconds = async (url: string) => (await db.pages.filter((p) => p.url === url).first())?.activeTimeSeconds ?? -1;

beforeEach(async () => {
  mock = installChromeMock();
  mock.tabs.set(1, { id: 1, windowId: 1, url: PAPER, title: 'Paper', active: true });
  await db.delete();
  await db.open();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
});

afterEach(() => vi.useRealTimers());

describe('time tracker', () => {
  it('records the active tab on start and accrues time on tick', async () => {
    const tt = await boot();
    expect(await db.pages.count()).toBe(1);

    advance(30_000);
    await tt.tick();
    expect(await activeSeconds(PAPER)).toBeCloseTo(30, 0);
  });

  it('does not accrue while the user is idle, and resumes afterwards', async () => {
    const tt = await boot();
    advance(10_000);
    mock.events.idleChanged.emit('idle');
    await settle();
    expect(await activeSeconds(PAPER)).toBeCloseTo(10, 0); // flushed up to the idle moment

    advance(60_000);
    await tt.tick();
    expect(await activeSeconds(PAPER)).toBeCloseTo(10, 0); // idle minute not credited

    mock.events.idleChanged.emit('active');
    await settle();
    advance(20_000);
    await tt.tick();
    expect(await activeSeconds(PAPER)).toBeCloseTo(30, 0);
  });

  it('does not accrue while the window is unfocused', async () => {
    const tt = await boot();
    mock.events.windowFocus.emit(-1);
    await settle();
    advance(45_000);
    await tt.tick();
    expect(await activeSeconds(PAPER)).toBeCloseTo(0, 0);
  });

  it('switches pages on tab activation and credits each page separately', async () => {
    const tt = await boot();
    mock.tabs.set(2, { id: 2, windowId: 1, url: REPO, title: 'Repo', active: false });

    advance(20_000);
    mock.tabs.get(1)!.active = false;
    mock.tabs.get(2)!.active = true;
    mock.events.tabActivated.emit({ tabId: 2, windowId: 1 });
    await settle();
    advance(15_000);
    await tt.tick();

    expect(await activeSeconds(PAPER)).toBeCloseTo(20, 0);
    expect(await activeSeconds(REPO)).toBeCloseTo(15, 0);
  });

  it('ignores tab switches in a window the user is not looking at', async () => {
    const tt = await boot();
    mock.tabs.set(3, { id: 3, windowId: 2, url: REPO, title: 'Repo', active: true });
    mock.events.tabActivated.emit({ tabId: 3, windowId: 2 });
    await settle();
    advance(10_000);
    await tt.tick();
    expect(await activeSeconds(PAPER)).toBeCloseTo(10, 0);
    expect(await db.pages.filter((p) => p.url === REPO).count()).toBe(0);
  });

  it('caps a single gap so a suspended worker/laptop is not credited for hours', async () => {
    const tt = await boot();
    advance(3 * 60 * 60_000);
    await tt.tick();
    expect(await activeSeconds(PAPER)).toBe(tt.MAX_GAP_MS / 1000);
  });

  it('never tracks incognito tabs or excluded sites', async () => {
    mock.tabs.clear();
    mock.tabs.set(1, { id: 1, windowId: 1, url: PAPER, active: true, incognito: true });
    await boot();
    expect(await db.pages.count()).toBe(0);

    mock.tabs.set(2, { id: 2, windowId: 1, url: 'https://mail.google.com/', active: false });
    mock.events.tabActivated.emit({ tabId: 2, windowId: 1 });
    await settle();
    expect(await db.pages.count()).toBe(0);
  });

  it('stops crediting the old page while a navigation is loading, then tracks the new one', async () => {
    const tt = await boot();
    advance(10_000);
    mock.events.tabUpdated.emit(1, { status: 'loading' }, { status: 'loading' });
    await settle();
    advance(5_000); // page is loading: not credited
    mock.tabs.get(1)!.url = REPO;
    mock.events.tabUpdated.emit(1, { status: 'complete' }, { status: 'complete' });
    await settle();
    advance(8_000);
    await tt.tick();

    expect(await activeSeconds(PAPER)).toBeCloseTo(10, 0);
    expect(await activeSeconds(REPO)).toBeCloseTo(8, 0);
    expect(await db.relationships.count()).toBe(1); // PAPER → REPO navigation
  });

  it('survives a service-worker restart without re-counting or losing the active page', async () => {
    const first = await boot();
    advance(20_000);
    await first.tick();
    const pagesBefore = await db.pages.count();

    advance(10_000);
    const restarted = await boot(); // new module instance, state restored from storage.session
    advance(10_000);
    await restarted.tick();

    expect(await db.pages.count()).toBe(pagesBefore);
    expect(await activeSeconds(PAPER)).toBeCloseTo(40, 0);
  });
});
