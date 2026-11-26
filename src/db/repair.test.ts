import { describe, it, expect } from 'vitest';
import { repairActiveTimes, MAX_PAGE_SECONDS } from './repair';

const H = 3600_000;
const page = (id: string, sessionId: string, visitedAt: number, lastActiveAt: number, activeTimeSeconds: number) => ({
  id,
  sessionId,
  visitedAt,
  lastActiveAt,
  activeTimeSeconds,
});

describe('repairActiveTimes', () => {
  it('leaves plausible times alone', () => {
    const changes = repairActiveTimes(
      [{ id: 's', startTime: 0, endTime: 2 * H }],
      [page('a', 's', 0, H, 1800), page('b', 's', H, 2 * H, 3000)]
    );
    expect(changes.size).toBe(0);
  });

  it('caps a page at the time between its first visit and last activity', () => {
    // 300 hours of "active" time on a page that was only open for 10 minutes.
    const changes = repairActiveTimes([{ id: 's', startTime: 0, endTime: H }], [page('a', 's', 0, 600_000, 300 * 3600)]);
    expect(changes.get('a')).toBe(660); // 600s + 60s slack
  });

  it('never allows a single page above the absolute maximum', () => {
    const changes = repairActiveTimes(
      [{ id: 's', startTime: 0, endTime: 100 * H }],
      [page('a', 's', 0, 100 * H, 90 * 3600)]
    );
    expect(changes.get('a')).toBe(MAX_PAGE_SECONDS);
  });

  it('scales pages down when one session adds up to more than the session lasted', () => {
    // Session ran 1h but its two pages claim 2h each.
    const changes = repairActiveTimes(
      [{ id: 's', startTime: 0, endTime: H }],
      [page('a', 's', 0, H, 7200), page('b', 's', 0, H, 7200)]
    );
    const total = (changes.get('a') ?? 0) + (changes.get('b') ?? 0);
    expect(total).toBeLessThanOrEqual(3660);
    expect(total).toBeGreaterThan(3500);
  });

  it('is idempotent', () => {
    const sessions = [{ id: 's', startTime: 0, endTime: H }];
    const pages = [page('a', 's', 0, H, 7200), page('b', 's', 0, H, 7200)];
    const once = repairActiveTimes(sessions, pages);
    const repaired = pages.map((p) => ({ ...p, activeTimeSeconds: once.get(p.id) ?? p.activeTimeSeconds }));
    expect(repairActiveTimes(sessions, repaired).size).toBe(0);
  });
});
