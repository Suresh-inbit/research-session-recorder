// ============================================================
// Dexie Database Singleton
// ============================================================

import Dexie, { type Table, type Transaction } from 'dexie';
import type {
  Session,
  Page,
  Note,
  Highlight,
  Question,
  Topic,
  Relationship,
  DailyReport,
  TimelineEvent,
} from '../shared/types';
import { DB_NAME } from '../shared/constants';

export class ResearchDatabase extends Dexie {
  sessions!: Table<Session, string>;
  pages!: Table<Page, string>;
  notes!: Table<Note, string>;
  highlights!: Table<Highlight, string>;
  questions!: Table<Question, string>;
  topics!: Table<Topic, string>;
  relationships!: Table<Relationship, string>;
  dailyReports!: Table<DailyReport, string>;
  timelineEvents!: Table<TimelineEvent, string>;

  constructor(name: string = DB_NAME) {
    super(name);

    this.version(1).stores({
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

    // v2: `isActive` is a boolean, and IndexedDB cannot index booleans, so the old
    // `isActive` index was always empty and "get the active session" never found
    // anything. Drop the index and close every session that was left dangling.
    this.version(2)
      .stores({ sessions: 'id, startTime, endTime' })
      .upgrade(closeOrphanedSessions);
  }
}

/** Close sessions still flagged active, ending them at their last known page activity. */
export async function closeOrphanedSessions(tx: Transaction): Promise<void> {
  const sessions = tx.table<Session, string>('sessions');
  const pages = tx.table<Page, string>('pages');

  const orphans = await sessions.filter((s) => s.isActive === true).toArray();
  for (const s of orphans) {
    const sessionPages = await pages.where('sessionId').equals(s.id).toArray();
    const endTime = sessionPages.reduce((max, p) => Math.max(max, p.lastActiveAt ?? 0), s.startTime);
    await sessions.update(s.id, {
      endTime,
      duration: Math.max(0, Math.floor((endTime - s.startTime) / 1000)),
      pageCount: sessionPages.length,
      isActive: false,
    });
  }
}

// Singleton instance
export const db = new ResearchDatabase();
