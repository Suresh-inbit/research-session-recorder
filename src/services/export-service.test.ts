import { describe, it, expect } from 'vitest';
import { csvCell, wikiLink, mdLabel, mdUrl } from './export-service';

describe('csvCell', () => {
  it('quotes and escapes quotes', () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });
  it('neutralises spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"');
    for (const lead of ['+', '-', '@']) expect(csvCell(`${lead}1`)).toBe(`"'${lead}1"`);
  });
  it('handles undefined, numbers and newlines', () => {
    expect(csvCell(undefined)).toBe('""');
    expect(csvCell(5)).toBe('"5"');
    expect(csvCell('a\nb')).toBe('"a\nb"');
  });
});

describe('wikiLink', () => {
  it('removes characters that break Obsidian links', () => {
    expect(wikiLink('A [weird] | title # with / chars')).toBe('[[A weird title with chars]]');
  });
  it('falls back for empty titles', () => {
    expect(wikiLink('')).toBe('[[Untitled]]');
    expect(wikiLink(undefined)).toBe('[[Untitled]]');
  });
});

describe('markdown link helpers', () => {
  it('escapes brackets in labels', () => {
    expect(mdLabel('a [b]')).toBe('a \\[b\\]');
  });
  it('encodes parentheses and spaces in URLs', () => {
    expect(mdUrl('https://en.wikipedia.org/wiki/Foo_(bar)')).toBe('https://en.wikipedia.org/wiki/Foo_%28bar%29');
    expect(mdUrl(undefined)).toBe('');
  });
});
