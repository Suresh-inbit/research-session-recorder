// ============================================================
// Daily Report Repository
// ============================================================

import { db } from '../database';
import type { DailyReport } from '../../shared/types';
import { generateId } from '../../shared/utils';

export const reportRepo = {
  async create(data: Omit<DailyReport, 'id' | 'createdAt'>): Promise<DailyReport> {
    const report: DailyReport = {
      id: generateId(),
      createdAt: Date.now(),
      ...data,
    };
    await db.dailyReports.add(report);
    return report;
  },

  async getByDate(date: string): Promise<DailyReport | undefined> {
    return db.dailyReports.where('date').equals(date).first();
  },

  async getAll(): Promise<DailyReport[]> {
    return db.dailyReports.orderBy('date').reverse().toArray();
  },

  async getRecent(limit = 7): Promise<DailyReport[]> {
    return db.dailyReports.orderBy('date').reverse().limit(limit).toArray();
  },

  async update(id: string, changes: Partial<DailyReport>): Promise<void> {
    await db.dailyReports.update(id, changes);
  },

  async upsert(date: string, data: Omit<DailyReport, 'id' | 'createdAt' | 'date'>): Promise<DailyReport> {
    const existing = await this.getByDate(date);
    if (existing) {
      await this.update(existing.id, { ...data });
      return { ...existing, ...data };
    }
    return this.create({ date, ...data });
  },

  async delete(id: string): Promise<void> {
    await db.dailyReports.delete(id);
  },
};
