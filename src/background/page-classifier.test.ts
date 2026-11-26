import { describe, it, expect } from 'vitest';
import { classifyPage, cleanPageTitle, isResearchPage } from './page-classifier';

describe('classifyPage', () => {
  it.each([
    ['https://arxiv.org/abs/2401.00001', 'paper'],
    ['https://github.com/facebook/react', 'repository'],
    ['https://github.com/facebook/react/issues/1', 'repository'],
    ['https://www.youtube.com/watch?v=abc', 'video'],
    ['https://huggingface.co/datasets/squad', 'dataset'],
    ['https://stackoverflow.com/questions/1/x', 'forum'],
    ['https://pytorch.org/docs/stable/nn.html', 'documentation'],
  ])('%s → %s', (url, type) => {
    expect(classifyPage(url).type).toBe(type);
  });

  it('falls back to unknown with 0.5 confidence', () => {
    expect(classifyPage('https://example.org/')).toEqual({ type: 'unknown', confidence: 0.5 });
  });

  it('never classifies excluded URLs', () => {
    expect(classifyPage('https://mail.google.com/').confidence).toBe(0);
    expect(isResearchPage('https://mail.google.com/')).toBe(false);
  });
});

describe('cleanPageTitle', () => {
  it('strips known site suffixes', () => {
    expect(cleanPageTitle('Cool video - YouTube', 'https://youtube.com/watch?v=1')).toBe('Cool video');
    expect(cleanPageTitle('facebook/react · GitHub', 'https://github.com/facebook/react')).toBe('facebook/react');
  });
  it('does not mangle ordinary titles containing " : "', () => {
    expect(cleanPageTitle('Attention : is all you need', 'https://x.org')).toBe('Attention : is all you need');
  });
  it('falls back to the URL for empty titles', () => {
    expect(cleanPageTitle('', 'https://x.org')).toBe('https://x.org');
  });
});
