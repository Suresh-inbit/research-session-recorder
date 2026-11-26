import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { ResearchDatabase } from './database';
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
