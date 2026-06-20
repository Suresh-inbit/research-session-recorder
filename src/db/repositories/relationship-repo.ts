// ============================================================
// Relationship Repository
// ============================================================

import { db } from '../database';
import type { Relationship, EntityType, RelationType } from '../../shared/types';
import { generateId } from '../../shared/utils';

export const relationshipRepo = {
  async create(
    sourceId: string,
    sourceType: EntityType,
    targetId: string,
    targetType: EntityType,
    relationType: RelationType
  ): Promise<Relationship> {
    // Check for existing relationship
    const existing = await db.relationships
      .where('sourceId')
      .equals(sourceId)
      .filter((r) => r.targetId === targetId && r.relationType === relationType)
      .first();

    if (existing) return existing;

    const relationship: Relationship = {
      id: generateId(),
      sourceId,
      sourceType,
      targetId,
      targetType,
      relationType,
      createdAt: Date.now(),
    };
    await db.relationships.add(relationship);
    return relationship;
  },

  async getBySource(sourceId: string): Promise<Relationship[]> {
    return db.relationships.where('sourceId').equals(sourceId).toArray();
  },

  async getByTarget(targetId: string): Promise<Relationship[]> {
    return db.relationships.where('targetId').equals(targetId).toArray();
  },

  async getConnections(entityId: string): Promise<Relationship[]> {
    const asSource = await db.relationships.where('sourceId').equals(entityId).toArray();
    const asTarget = await db.relationships.where('targetId').equals(entityId).toArray();
    return [...asSource, ...asTarget];
  },

  async getAll(): Promise<Relationship[]> {
    return db.relationships.toArray();
  },

  async delete(id: string): Promise<void> {
    await db.relationships.delete(id);
  },

  async deleteByEntity(entityId: string): Promise<void> {
    await db.relationships.where('sourceId').equals(entityId).delete();
    await db.relationships.where('targetId').equals(entityId).delete();
  },
};
