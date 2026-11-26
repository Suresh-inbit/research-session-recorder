// ============================================================
// Question Repository
// ============================================================

import { db } from '../database';
import type { Question, QuestionStatus, QuestionType } from '../../shared/types';
import { generateId } from '../../shared/utils';

export const questionRepo = {
  async create(data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
    const question: Question = {
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...data,
    };
    await db.questions.add(question);
    return question;
  },

  async getById(id: string): Promise<Question | undefined> {
    return db.questions.get(id);
  },

  async getBySession(sessionId: string): Promise<Question[]> {
    return db.questions
      .where('sessionId')
      .equals(sessionId)
      .reverse()
      .toArray();
  },

  async getByStatus(status: QuestionStatus): Promise<Question[]> {
    return db.questions
      .where('status')
      .equals(status)
      .reverse()
      .toArray();
  },

  async getByType(type: QuestionType): Promise<Question[]> {
    return db.questions
      .where('type')
      .equals(type)
      .reverse()
      .toArray();
  },

  async getAll(limit = 100): Promise<Question[]> {
    return db.questions.orderBy('createdAt').reverse().limit(limit).toArray();
  },

  async getOpen(): Promise<Question[]> {
    return db.questions
      .where('status')
      .equals('open')
      .reverse()
      .toArray();
  },

  async update(id: string, changes: Partial<Question>): Promise<void> {
    await db.questions.update(id, {
      ...changes,
      updatedAt: Date.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.questions.delete(id);
  },

  async getByDateRange(startDate: number, endDate: number): Promise<Question[]> {
    return db.questions
      .where('createdAt')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async count(startDate?: number): Promise<number> {
    if (startDate) {
      return db.questions.where('createdAt').aboveOrEqual(startDate).count();
    }
    return db.questions.count();
  },
};
