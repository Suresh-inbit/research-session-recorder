// ============================================================
// Page Repository
// ============================================================

import { db } from '../database';
import type { Page, PageType } from '../../shared/types';
import { generateId } from '../../shared/utils';

export const pageRepo = {
  async create(data: Omit<Page, 'id'>): Promise<Page> {
    const page: Page = {
      id: generateId(),
      ...data,
    };
    await db.pages.add(page);
    return page;
  },

  async getById(id: string): Promise<Page | undefined> {
    return db.pages.get(id);
  },

  async getByUrl(url: string, sessionId?: string): Promise<Page | undefined> {
    if (sessionId) {
      return db.pages
        .where('sessionId')
        .equals(sessionId)
        .filter((p) => p.url === url)
        .first();
    }
    return db.pages.where('url').equals(url).first();
  },

  async getBySession(sessionId: string): Promise<Page[]> {
    return db.pages
      .where('sessionId')
      .equals(sessionId)
      .toArray();
  },

  async getByType(type: PageType, limit = 50): Promise<Page[]> {
    return db.pages
      .where('type')
      .equals(type)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getByDateRange(startDate: number, endDate: number): Promise<Page[]> {
    return db.pages
      .where('visitedAt')
      .between(startDate, endDate)
      .toArray();
  },

  async update(id: string, changes: Partial<Page>): Promise<void> {
    await db.pages.update(id, changes);
  },

  async incrementActiveTime(id: string, seconds: number): Promise<void> {
    // modify() runs read+write in one transaction, so concurrent increments don't lose updates.
    await db.pages
      .where('id')
      .equals(id)
      .modify((page) => {
        page.activeTimeSeconds += seconds;
        page.lastActiveAt = Date.now();
      });
  },

  async getTopByActiveTime(limit = 10, type?: PageType): Promise<Page[]> {
    // `activeTimeSeconds` is not indexed, so sort in memory.
    const pages = type
      ? await db.pages.where('type').equals(type).toArray()
      : await db.pages.toArray();
    return pages.sort((a, b) => b.activeTimeSeconds - a.activeTimeSeconds).slice(0, limit);
  },

  async getVisitedToday(startOfDay: number): Promise<Page[]> {
    return db.pages
      .where('visitedAt')
      .aboveOrEqual(startOfDay)
      .toArray();
  },

  async countByType(type: PageType, startDate?: number): Promise<number> {
    if (startDate) {
      return db.pages
        .where('type')
        .equals(type)
        .filter((p) => p.visitedAt >= startDate)
        .count();
    }
    return db.pages.where('type').equals(type).count();
  },

  async getAll(limit = 100): Promise<Page[]> {
    return db.pages.orderBy('visitedAt').reverse().limit(limit).toArray();
  },

  async delete(id: string): Promise<void> {
    await db.pages.delete(id);
  },
};
