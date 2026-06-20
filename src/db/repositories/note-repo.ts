// ============================================================
// Note Repository
// ============================================================

import { db } from '../database';
import type { Note } from '../../shared/types';
import { generateId } from '../../shared/utils';

export const noteRepo = {
  async create(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const note: Note = {
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...data,
    };
    await db.notes.add(note);
    return note;
  },

  async getById(id: string): Promise<Note | undefined> {
    return db.notes.get(id);
  },

  async getBySession(sessionId: string): Promise<Note[]> {
    return db.notes
      .where('sessionId')
      .equals(sessionId)
      .reverse()
      .toArray();
  },

  async getByPage(pageId: string): Promise<Note[]> {
    return db.notes
      .where('pageId')
      .equals(pageId)
      .toArray();
  },

  async getAll(limit = 100): Promise<Note[]> {
    return db.notes.orderBy('createdAt').reverse().limit(limit).toArray();
  },

  async getByDateRange(startDate: number, endDate: number): Promise<Note[]> {
    return db.notes
      .where('createdAt')
      .between(startDate, endDate)
      .reverse()
      .toArray();
  },

  async getByTag(tag: string): Promise<Note[]> {
    return db.notes
      .where('tags')
      .equals(tag)
      .toArray();
  },

  async update(id: string, changes: Partial<Note>): Promise<void> {
    await db.notes.update(id, {
      ...changes,
      updatedAt: Date.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.notes.delete(id);
  },

  async count(startDate?: number): Promise<number> {
    if (startDate) {
      return db.notes.where('createdAt').aboveOrEqual(startDate).count();
    }
    return db.notes.count();
  },

  async search(query: string): Promise<Note[]> {
    const lowerQuery = query.toLowerCase();
    return db.notes
      .filter((note) => note.content.toLowerCase().includes(lowerQuery))
      .toArray();
  },
};
