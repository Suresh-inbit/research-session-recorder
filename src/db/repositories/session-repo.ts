// ============================================================
// Session Repository
// ============================================================

import { db } from '../database';
import type { Session } from '../../shared/types';
import { generateId } from '../../shared/utils';

export const sessionRepo = {
  async create(data: Partial<Session> = {}): Promise<Session> {
    const session: Session = {
      id: generateId(),
      startTime: Date.now(),
      duration: 0,
      pageCount: 0,
      noteCount: 0,
      highlightCount: 0,
      questionCount: 0,
      topics: [],
      isActive: true,
      ...data,
    };
    await db.sessions.add(session);
    return session;
  },

  async getById(id: string): Promise<Session | undefined> {
    return db.sessions.get(id);
  },

  async getActive(): Promise<Session | undefined> {
    // Booleans are not valid IndexedDB keys, so this can't use an index.
    // Newest-first means we stop at the first (normally only) active session.
    return db.sessions
      .orderBy('startTime')
      .reverse()
      .filter((s) => s.isActive)
      .first();
  },

  async getAll(limit = 50, offset = 0): Promise<Session[]> {
    return db.sessions
      .orderBy('startTime')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getByDateRange(startDate: number, endDate: number): Promise<Session[]> {
    return db.sessions
      .where('startTime')
      .between(startDate, endDate)
      .toArray();
  },

  async update(id: string, changes: Partial<Session>): Promise<void> {
    await db.sessions.update(id, changes);
  },

  async endSession(id: string, endTime: number = Date.now()): Promise<void> {
    const session = await db.sessions.get(id);
    if (!session) return;

    endTime = Math.max(endTime, session.startTime);
    const duration = Math.floor((endTime - session.startTime) / 1000);

    // Count related entities
    const pageCount = await db.pages.where('sessionId').equals(id).count();
    const noteCount = await db.notes.where('sessionId').equals(id).count();
    const highlightCount = await db.highlights.where('sessionId').equals(id).count();
    const questionCount = await db.questions.where('sessionId').equals(id).count();

    await db.sessions.update(id, {
      endTime,
      duration,
      pageCount,
      noteCount,
      highlightCount,
      questionCount,
      isActive: false,
    });
  },

  async delete(id: string): Promise<void> {
    await db.sessions.delete(id);
  },

  async count(): Promise<number> {
    return db.sessions.count();
  },

  async getRecentSessions(days: number = 7): Promise<Session[]> {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return db.sessions
      .where('startTime')
      .above(cutoff)
      .reverse()
      .toArray();
  },
};
