// ============================================================
// Repair for inflated page times (pure — no DB access)
// ============================================================
// Older builds could credit the same wall-clock time again and again, leaving pages with more
// "active" time than there are hours in the week. Active time can never exceed real time, so:
//   1. a page can't have more active time than elapsed between its first visit and last activity;
//   2. pages of one session (which are visited one at a time) can't add up to more than the session.

import type { Page, Session } from '../shared/types';

/** No single page is plausibly in focus for longer than this. */
export const MAX_PAGE_SECONDS = 12 * 3600;
/** Tolerance for rounding and the final tick. */
const SLACK_SECONDS = 60;

type PageTimes = Pick<Page, 'id' | 'sessionId' | 'visitedAt' | 'lastActiveAt' | 'activeTimeSeconds'>;
type SessionSpan = Pick<Session, 'id' | 'startTime' | 'endTime'>;

/** Returns the corrected `activeTimeSeconds` for every page that needs changing (others are omitted). */
export function repairActiveTimes(sessions: SessionSpan[], pages: PageTimes[]): Map<string, number> {
  const fixed = new Map<string, number>();

  for (const p of pages) {
    const elapsed = Math.max(0, (p.lastActiveAt - p.visitedAt) / 1000);
    const cap = Math.min(elapsed + SLACK_SECONDS, MAX_PAGE_SECONDS);
    fixed.set(p.id, Math.min(p.activeTimeSeconds, cap));
  }

  const bySession = new Map<string, PageTimes[]>();
  for (const p of pages) bySession.set(p.sessionId, [...(bySession.get(p.sessionId) ?? []), p]);

  for (const s of sessions) {
    const group = bySession.get(s.id);
    if (!group) continue;
    const end = s.endTime ?? group.reduce((max, p) => Math.max(max, p.lastActiveAt), s.startTime);
    const wall = Math.max(0, (end - s.startTime) / 1000) + SLACK_SECONDS;
    const total = group.reduce((sum, p) => sum + (fixed.get(p.id) ?? 0), 0);
    if (total > wall) {
      const ratio = wall / total;
      for (const p of group) fixed.set(p.id, (fixed.get(p.id) ?? 0) * ratio);
    }
  }

  const changes = new Map<string, number>();
  for (const p of pages) {
    const next = Math.floor(fixed.get(p.id) ?? p.activeTimeSeconds);
    if (next < p.activeTimeSeconds) changes.set(p.id, next);
  }
  return changes;
}
