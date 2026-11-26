import { describe, it, expect } from 'vitest';
import { bucketPoints, niceMax } from './ActivityChart';
import { tint } from '../shared/color';

describe('niceMax', () => {
  it('rounds up to four even gridline steps', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(4.9)).toBe(6); // 1.5 / 3 / 4.5 / 6, not 1.3 / 2.5 / 3.8
    expect(niceMax(8)).toBe(8);
    expect(niceMax(21)).toBe(40);
  });
  it('never returns less than the data', () => {
    for (const v of [0.1, 0.9, 3.3, 7.7, 12, 99, 250]) expect(niceMax(v)).toBeGreaterThanOrEqual(v);
  });
});

describe('bucketPoints', () => {
  const pts = Array.from({ length: 10 }, (_, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, hours: 1, pages: 2 }));
  it('sums consecutive points and keeps the first date of each bucket', () => {
    const out = bucketPoints(pts, 7);
    expect(out).toEqual([
      { date: '2026-01-01', hours: 7, pages: 14 },
      { date: '2026-01-08', hours: 3, pages: 6 },
    ]);
  });
  it('is a no-op for size 1', () => expect(bucketPoints(pts, 1)).toBe(pts));
});

describe('tint', () => {
  it('works for CSS variables, where appending hex alpha would be invalid CSS', () => {
    expect(tint('var(--accent-primary)', 12)).toBe('color-mix(in srgb, var(--accent-primary) 12%, transparent)');
  });
});
