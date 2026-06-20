// ============================================================
// Highlight Repository
// ============================================================

import { db } from '../database';
import type { Highlight } from '../../shared/types';
import { generateId } from '../../shared/utils';

export const highlightRepo = {
  async create(data: Omit<Highlight, 'id' | 'createdAt'>): Promise<Highlight> {
    const highlight: Highlight = {
      id: generateId(),
      createdAt: Date.now(),
      ...data,
    };
    await db.highlights.add(highlight);
    return highlight;
  },

  async getById(id: string): Promise<Highlight | undefined> {
    return db.highlights.get(id);
  },

  async getBySession(sessionId: string): Promise<Highlight[]> {
    return db.highlights
      .where('sessionId')
      .equals(sessionId)
      .reverse()
      .toArray();
  },

  async getByPage(pageId: string): Promise<Highlight[]> {
    return db.highlights
      .where('pageId')
      .equals(pageId)
      .toArray();
  },

  async getAll(limit = 100): Promise<Highlight[]> {
    return db.highlights.orderBy('createdAt').reverse().limit(limit).toArray();
  },

  async getByDateRange(startDate: number, endDate: number): Promise<Highlight[]> {
    return db.highlights
      .where('createdAt')
      .between(startDate, endDate)
      .reverse()
      .toArray();
  },

  async delete(id: string): Promise<void> {
    await db.highlights.delete(id);
  },

  async count(startDate?: number): Promise<number> {
    if (startDate) {
      return db.highlights.where('createdAt').aboveOrEqual(startDate).count();
    }
    return db.highlights.count();
  },
};
