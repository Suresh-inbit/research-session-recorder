import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { ResearchDatabase, repairInflatedActiveTimeNow } from './database';
import { sessionRepo } from './repositories/session-repo';
import { pageRepo } from './repositories/page-repo';
import { db } from './database';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('sessionRepo.getActive', () => {
  it('finds the active session (regression: boolean index never matched)', async () => {
    const ended = await sessionRepo.create();
    await sessionRepo.endSession(ended.id);
    const active = await sessionRepo.create();
    expect((await sessionRepo.getActive())?.id).toBe(active.id);
  });

  it('returns undefined when nothing is active', async () => {
    const s = await sessionRepo.create();
    await sessionRepo.endSession(s.id);
    expect(await sessionRepo.getActive()).toBeUndefined();
  });

  it('endSession honours an explicit end time and never ends before the start', async () => {
    const s = await sessionRepo.create({ startTime: 1_000_000 });
    await sessionRepo.endSession(s.id, 1_000_000 + 60_000);
    const ended = await sessionRepo.getById(s.id);
    expect(ended).toMatchObject({ isActive: false, endTime: 1_060_000, duration: 60 });

    const t = await sessionRepo.create({ startTime: 5_000_000 });
    await sessionRepo.endSession(t.id, 1);
    expect((await sessionRepo.getById(t.id))?.endTime).toBe(5_000_000);
  });
});

describe('pageRepo.incrementActiveTime', () => {
  it('does not lose concurrent increments', async () => {
    const page = await pageRepo.create({
      sessionId: 's', url: 'https://a.com', title: 'A', type: 'unknown', typeConfidence: 0.5,
      activeTimeSeconds: 0, visitedAt: 1, lastActiveAt: 1,
    });
    await Promise.all(Array.from({ length: 20 }, () => pageRepo.incrementActiveTime(page.id, 5)));
    expect((await pageRepo.getById(page.id))?.activeTimeSeconds).toBe(100);
  });
});

describe('pageRepo.resetActiveTime', () => {
  it('zeroes active time on every page and keeps the pages', async () => {
    const make = (url: string, activeTimeSeconds: number) =>
      pageRepo.create({
        sessionId: 's', url, title: url, type: 'unknown', typeConfidence: 0.5,
        activeTimeSeconds, visitedAt: 1, lastActiveAt: 1,
      });
    const a = await make('https://a.com', 500);
    const b = await make('https://b.com', 0);
    const c = await make('https://c.com', 90);

    expect(await pageRepo.resetActiveTime()).toBe(2); // only pages that had time
    for (const p of [a, b, c]) expect((await pageRepo.getById(p.id))?.activeTimeSeconds).toBe(0);
    expect(await db.pages.count()).toBe(3);
  });
});

describe('repairInflatedActiveTimeNow', () => {
  it('fixes inflated pages on demand, leaves good ones, and reports the count', async () => {
    const s = await sessionRepo.create({ startTime: 0 });
    await sessionRepo.endSession(s.id, 3_600_000);
    const make = (url: string, activeTimeSeconds: number) =>
      pageRepo.create({
        sessionId: s.id, url, title: url, type: 'unknown', typeConfidence: 0.5,
        activeTimeSeconds, visitedAt: 0, lastActiveAt: 600_000,
      });
    const bad = await make('https://bad.com', 300 * 3600);
    const ok = await make('https://ok.com', 120);

    expect(await repairInflatedActiveTimeNow()).toBe(1);
    expect((await pageRepo.getById(bad.id))?.activeTimeSeconds).toBeLessThanOrEqual(660);
    expect((await pageRepo.getById(ok.id))?.activeTimeSeconds).toBe(120);
    expect(await repairInflatedActiveTimeNow()).toBe(0); // idempotent
  });
});

describe('v1 → v2 migration', () => {
  it('closes sessions that were left active at their last page activity', async () => {
    const name = 'MigrationTestDB';
    await Dexie.delete(name);

    // Build a v1 database the way the old version of the extension did.
    const v1 = new Dexie(name);
    v1.version(1).stores({
      sessions: 'id, startTime, endTime, isActive',
      pages: 'id, sessionId, url, type, visitedAt, lastActiveAt, [sessionId+type]',
      notes: 'id, pageId, sessionId, createdAt, updatedAt, *tags',
      highlights: 'id, pageId, sessionId, createdAt',
      questions: 'id, pageId, sessionId, type, status, createdAt',
      topics: 'id, name, frequency, lastSeen',
      relationships: 'id, sourceId, targetId, sourceType, targetType, relationType',
      dailyReports: 'id, date, createdAt',
      timelineEvents: 'id, sessionId, timestamp, type, entityType',
    });
    await v1.table('sessions').bulkAdd([
      { id: 'orphan', startTime: 1_000, duration: 0, isActive: true, pageCount: 0 },
      { id: 'done', startTime: 500, endTime: 900, duration: 0, isActive: false },
    ]);
    await v1.table('pages').add({ id: 'p1', sessionId: 'orphan', url: 'u', lastActiveAt: 61_000, visitedAt: 2_000 });
    v1.close();

    const upgraded = new ResearchDatabase(name);
    await upgraded.open();
    const orphan = await upgraded.sessions.get('orphan');
    expect(orphan).toMatchObject({ isActive: false, endTime: 61_000, duration: 60, pageCount: 1 });
    expect((await upgraded.sessions.get('done'))?.endTime).toBe(900);
    upgraded.close();
    await Dexie.delete(name);
  });
});

describe('v2 → v3 migration', () => {
  it('clamps page times that exceed what real time allows, and keeps sane ones', async () => {
    const name = 'RepairMigrationTestDB';
    await Dexie.delete(name);

    const v2 = new Dexie(name);
    v2.version(1).stores({
      sessions: 'id, startTime, endTime, isActive',
      pages: 'id, sessionId, url, type, visitedAt, lastActiveAt, [sessionId+type]',
      notes: 'id, pageId, sessionId, createdAt, updatedAt, *tags',
      highlights: 'id, pageId, sessionId, createdAt',
      questions: 'id, pageId, sessionId, type, status, createdAt',
      topics: 'id, name, frequency, lastSeen',
      relationships: 'id, sourceId, targetId, sourceType, targetType, relationType',
      dailyReports: 'id, date, createdAt',
      timelineEvents: 'id, sessionId, timestamp, type, entityType',
    });
    v2.version(2).stores({ sessions: 'id, startTime, endTime' });
    await v2.table('sessions').add({ id: 's', startTime: 0, endTime: 3_600_000, duration: 3600, pageCount: 2 });
    await v2.table('pages').bulkAdd([
      { id: 'bad', sessionId: 's', url: 'a', visitedAt: 0, lastActiveAt: 600_000, activeTimeSeconds: 300 * 3600 },
      { id: 'ok', sessionId: 's', url: 'b', visitedAt: 0, lastActiveAt: 600_000, activeTimeSeconds: 120 },
    ]);
    v2.close();

    const upgraded = new ResearchDatabase(name);
    await upgraded.open();
    expect((await upgraded.pages.get('ok'))?.activeTimeSeconds).toBe(120);
    const bad = (await upgraded.pages.get('bad'))?.activeTimeSeconds ?? Infinity;
    expect(bad).toBeLessThanOrEqual(660);
    expect(bad).toBeGreaterThan(0);
    upgraded.close();
    await Dexie.delete(name);
  });
});
