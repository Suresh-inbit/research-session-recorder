// ============================================================
// Topic Repository
// ============================================================

import { db } from '../database';
import type { Topic } from '../../shared/types';
import { generateId } from '../../shared/utils';

export const topicRepo = {
  async create(name: string, parentId?: string): Promise<Topic> {
    const existing = await db.topics.where('name').equals(name).first();
    if (existing) {
      await db.topics.update(existing.id, {
        frequency: existing.frequency + 1,
        lastSeen: Date.now(),
      });
      return { ...existing, frequency: existing.frequency + 1, lastSeen: Date.now() };
    }

    const topic: Topic = {
      id: generateId(),
      name,
      frequency: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      parentId,
    };
    await db.topics.add(topic);
    return topic;
  },

  async getById(id: string): Promise<Topic | undefined> {
    return db.topics.get(id);
  },

  async getByName(name: string): Promise<Topic | undefined> {
    return db.topics.where('name').equals(name).first();
  },

  async getAll(): Promise<Topic[]> {
    return db.topics.orderBy('frequency').reverse().toArray();
  },

  async getTop(limit = 10): Promise<Topic[]> {
    return db.topics.orderBy('frequency').reverse().limit(limit).toArray();
  },

  async getRecent(limit = 10): Promise<Topic[]> {
    return db.topics.orderBy('lastSeen').reverse().limit(limit).toArray();
  },

  async incrementFrequency(id: string): Promise<void> {
    const topic = await db.topics.get(id);
    if (!topic) return;
    await db.topics.update(id, {
      frequency: topic.frequency + 1,
      lastSeen: Date.now(),
    });
  },

  async update(id: string, changes: Partial<Topic>): Promise<void> {
    await db.topics.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.topics.delete(id);
  },

  async bulkCreate(names: string[]): Promise<Topic[]> {
    const results: Topic[] = [];
    for (const name of names) {
      const topic = await this.create(name);
      results.push(topic);
    }
    return results;
  },
};
