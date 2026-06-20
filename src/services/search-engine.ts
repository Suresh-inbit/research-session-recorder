import Fuse from 'fuse.js';
import type { SearchResult, EntityType } from '../shared/types';
import { SEARCH_THRESHOLD } from '../shared/constants';

export interface SearchableItem {
  id: string;
  type: EntityType;
  title: string;
  content: string;
  url?: string;
  timestamp: number;
}

export class SearchEngine {
  private fuse: Fuse<SearchableItem> | null = null;

  constructor(items: SearchableItem[]) {
    this.index(items);
  }

  public index(items: SearchableItem[]) {
    this.fuse = new Fuse(items, {
      keys: ['title', 'content', 'url'],
      threshold: SEARCH_THRESHOLD,
      includeScore: true,
      ignoreLocation: true,
    });
  }

  public search(query: string): SearchResult[] {
    if (!this.fuse || !query.trim()) return [];

    const results = this.fuse.search(query);
    return results.map((res) => {
      const { item, score } = res;
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        snippet: item.content.length > 150 ? item.content.slice(0, 150) + '...' : item.content,
        url: item.url,
        timestamp: item.timestamp,
        score: score || 0,
      };
    });
  }
}
