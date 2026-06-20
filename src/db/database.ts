// ============================================================
// Dexie Database Singleton
// ============================================================

import Dexie, { type Table } from 'dexie';
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

  constructor() {
    super(DB_NAME);

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
  }
}

// Singleton instance
export const db = new ResearchDatabase();
