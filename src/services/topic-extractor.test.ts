import { describe, it, expect } from 'vitest';
import { extractKeywords, extractTopics } from './topic-extractor';

describe('extractKeywords', () => {
  it('ranks by frequency and drops stop words', () => {
    const kw = extractKeywords('Transformers and attention: attention is all about the attention heads; transformers rule', 3);
    expect(kw[0]).toBe('attention');
    expect(kw).toContain('transformers');
    expect(kw).not.toContain('the');
  });
  it('returns [] for empty text', () => {
    expect(extractKeywords('')).toEqual([]);
  });
});

describe('extractTopics', () => {
  it('finds repeated bigrams as topics', () => {
    const topics = extractTopics('gaussian splatting is fast. gaussian splatting scales. neural rendering helps');
    expect(topics[0].topic).toBe('Gaussian Splatting');
  });
  it('returns [] for empty text', () => {
    expect(extractTopics('')).toEqual([]);
  });
});
