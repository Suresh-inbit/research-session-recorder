// ============================================================
// Dashboard statistics — pure helpers (no DB / chrome access)
// ============================================================

import type { Page } from '../shared/types';
import { formatDate } from '../shared/utils';

export interface DayBucket {
  date: string;
  hours: number;
  pages: number;
}

/** Local-time start of the day `daysAgo` days before `now`. DST-safe (uses calendar arithmetic). */
export function startOfDayDaysAgo(daysAgo: number, now: number = Date.now()): number {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * One bucket per local calendar day, oldest → newest, ending today.
 * A page's active time is attributed to the day it was first visited.
 */
export function buildDailyBuckets(
  pages: Array<Pick<Page, 'visitedAt' | 'activeTimeSeconds'>>,
  days: number,
  now: number = Date.now()
): DayBucket[] {
  const buckets = new Map<string, DayBucket>();
  for (let i = days - 1; i >= 0; i--) {
    const date = formatDate(startOfDayDaysAgo(i, now));
    buckets.set(date, { date, hours: 0, pages: 0 });
  }
  for (const p of pages) {
    const bucket = buckets.get(formatDate(p.visitedAt));
    if (!bucket) continue;
    bucket.pages += 1;
    bucket.hours += p.activeTimeSeconds / 3600;
  }
  return Array.from(buckets.values());
}

/**
 * Consecutive days with activity, counted back from today. A day without activity *yet*
 * today doesn't break the streak — counting then starts from yesterday.
 */
export function computeStreak(activeDays: ReadonlySet<string>, now: number = Date.now()): number {
  let offset = activeDays.has(formatDate(now)) ? 0 : 1;
  let streak = 0;
  while (activeDays.has(formatDate(startOfDayDaysAgo(offset, now)))) {
    streak++;
    offset++;
  }
  return streak;
}
