import { describe, it, expect } from 'vitest';
import { buildDailyBuckets, computeStreak, startOfDayDaysAgo } from './stats';
import { formatDate } from '../shared/utils';

// Local noon, so day arithmetic is unambiguous in any timezone.
const NOW = new Date(2025, 5, 15, 12, 0, 0).getTime(); // 15 Jun 2025
const day = (offset: number) => formatDate(startOfDayDaysAgo(offset, NOW));
const at = (offset: number, hour = 10) => {
  const d = new Date(startOfDayDaysAgo(offset, NOW));
  d.setHours(hour);
  return d.getTime();
};

describe('buildDailyBuckets', () => {
  it('returns one bucket per day, oldest first, ending today', () => {
    const buckets = buildDailyBuckets([], 7, NOW);
    expect(buckets).toHaveLength(7);
    expect(buckets[0].date).toBe(day(6));
    expect(buckets[6].date).toBe(day(0));
  });

  it('sums pages and hours per local day and ignores out-of-window pages', () => {
    const buckets = buildDailyBuckets(
      [
        { visitedAt: at(0), activeTimeSeconds: 1800 },
        { visitedAt: at(0, 15), activeTimeSeconds: 1800 },
        { visitedAt: at(2), activeTimeSeconds: 3600 },
        { visitedAt: at(30), activeTimeSeconds: 9999 },
      ],
      7,
      NOW
    );
    expect(buckets[6]).toMatchObject({ pages: 2, hours: 1 });
    expect(buckets[4]).toMatchObject({ pages: 1, hours: 1 });
    expect(buckets.reduce((s, b) => s + b.pages, 0)).toBe(3);
  });
});

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak(new Set([day(0), day(1), day(2)]), NOW)).toBe(3);
  });
  it('does not break the streak just because today has no activity yet', () => {
    expect(computeStreak(new Set([day(1), day(2)]), NOW)).toBe(2);
  });
  it('stops at the first gap', () => {
    expect(computeStreak(new Set([day(0), day(1), day(3)]), NOW)).toBe(2);
  });
  it('is 0 when neither today nor yesterday has activity', () => {
    expect(computeStreak(new Set([day(2)]), NOW)).toBe(0);
    expect(computeStreak(new Set(), NOW)).toBe(0);
  });
});
