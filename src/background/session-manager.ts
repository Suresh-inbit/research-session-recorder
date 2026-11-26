// ============================================================
// Session Manager
// ============================================================
// Manages the lifecycle of research sessions — auto-start on research page visits,
// auto-end on idle timeout.
//
// MV3 service workers are killed and restarted at will, so nothing here may rely on
// timers or on module variables surviving: the active session is re-read from the DB,
// "last activity" is persisted, and idle expiry is evaluated against timestamps (it is
// driven by a chrome.alarms tick, see alarms.ts) instead of a setTimeout.

import { sessionRepo } from '../db/repositories/session-repo';
import { pageRepo } from '../db/repositories/page-repo';
import { relationshipRepo } from '../db/repositories/relationship-repo';
import { db } from '../db/database';
import { classifyPage, cleanPageTitle } from './page-classifier';
import { isExcludedUrl } from '../shared/url-rules';
import { DEFAULT_IDLE_TIMEOUT_MINUTES } from '../shared/constants';
import { generateId } from '../shared/utils';
import type { Session, Page } from '../shared/types';
import { getSettings, saveSettings } from './settings';
import { getState, setState } from './state';
import { createQueue } from './queue';

export const IDLE_TIMEOUT_MS = DEFAULT_IDLE_TIMEOUT_MINUTES * 60 * 1000;
const LAST_ACTIVITY_KEY = 'lastActivityAt';
const PERSIST_THROTTLE_MS = 5000;

let currentSessionId: string | null = null;
let lastActivityAt = 0;
let lastPersistedAt = 0;
let initPromise: Promise<void> | null = null;

/** Session mutations (start / end / page visit) run one at a time. */
const queue = createQueue();

// ---------- init ----------

export function initSessionManager(): Promise<void> {
  if (!initPromise) {
    initPromise = restoreActiveSession().catch((err) => {
      initPromise = null; // allow a retry on the next call
      throw err;
    });
  }
  return initPromise;
}

async function restoreActiveSession(): Promise<void> {
  const active = await sessionRepo.getActive();
  if (!active) return;

  const pages = await pageRepo.getBySession(active.id);
  const persisted = (await getState<number>(LAST_ACTIVITY_KEY)) ?? 0;
  const lastActive = Math.max(
    persisted,
    active.startTime,
    ...pages.map((p) => p.lastActiveAt)
  );

  if (Date.now() - lastActive > IDLE_TIMEOUT_MS) {
    // The worker (or the whole browser) was gone past the idle window: close it where it stopped.
    await finishSession(active.id, lastActive);
    return;
  }
  currentSessionId = active.id;
  lastActivityAt = lastActive;
}

// ---------- page visits ----------

/**
 * Record a page visit — starts a session if needed, creates (or touches) the page.
 * Safe to call concurrently: calls are serialized so a page is never created twice.
 */
export function handlePageVisit(url: string, title: string, parentUrl?: string): Promise<Page | null> {
  return queue.run(async () => {
    await initSessionManager();
    const settings = await getSettings();
    if (!settings.trackingEnabled) {
      if (currentSessionId) await endSessionNow();
      return null;
    }
    if (isExcludedUrl(url, settings.blockedDomains)) return null;

    await expireIfIdle();
    const sessionId = currentSessionId ?? (await startSessionNow('Session started'));
    notifyActivity();

    const existing = await pageRepo.getByUrl(url, sessionId);
    if (existing) {
      await pageRepo.update(existing.id, { lastActiveAt: Date.now() });
      await linkParent(parentUrl, existing.id, sessionId);
      return existing;
    }

    const classification = classifyPage(url);
    const cleanedTitle = cleanPageTitle(title, url);
    const page = await pageRepo.create({
      sessionId,
      url,
      title: cleanedTitle,
      type: classification.type,
      typeConfidence: classification.confidence,
      activeTimeSeconds: 0,
      visitedAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    await db.timelineEvents.add({
      id: generateId(),
      timestamp: Date.now(),
      type: 'page_visit',
      title: `Visited: ${cleanedTitle}`,
      url,
      entityId: page.id,
      entityType: 'page',
      sessionId,
    });
    await linkParent(parentUrl, page.id, sessionId);
    return page;
  });
}

async function linkParent(parentUrl: string | undefined, pageId: string, sessionId: string): Promise<void> {
  if (!parentUrl) return;
  const parent = await pageRepo.getByUrl(parentUrl, sessionId);
  if (parent && parent.id !== pageId) {
    await relationshipRepo.create(parent.id, 'page', pageId, 'page', 'navigated_from');
  }
}

// ---------- queries ----------

export async function getCurrentSession(): Promise<Session | null> {
  await initSessionManager();
  if (!currentSessionId) return null;
  return (await sessionRepo.getById(currentSessionId)) ?? null;
}

export function getCurrentSessionId(): string | null {
  return currentSessionId;
}

// ---------- start / end ----------

async function startSessionNow(title: string): Promise<string> {
  const session = await sessionRepo.create();
  currentSessionId = session.id;
  lastActivityAt = Date.now();
  lastPersistedAt = 0;
  await db.timelineEvents.add({
    id: generateId(),
    timestamp: Date.now(),
    type: 'session_start',
    title,
    entityId: session.id,
    entityType: 'session',
    sessionId: session.id,
  });
  return session.id;
}

async function finishSession(id: string, endTime: number): Promise<void> {
  await sessionRepo.endSession(id, endTime);
  await db.timelineEvents.add({
    id: generateId(),
    timestamp: endTime,
    type: 'session_end',
    title: 'Session ended',
    entityId: id,
    entityType: 'session',
    sessionId: id,
  });
}

async function endSessionNow(endTime: number = Date.now()): Promise<void> {
  if (!currentSessionId) return;
  const id = currentSessionId;
  currentSessionId = null;
  await finishSession(id, endTime);
}

/** End the current session manually (or because tracking was switched off). */
export function endCurrentSession(): Promise<void> {
  return queue.run(async () => {
    await initSessionManager();
    await endSessionNow();
  });
}

/** Start a session from the UI (also re-enables tracking). */
export function startManualSession(): Promise<void> {
  return queue.run(async () => {
    await initSessionManager();
    const settings = await getSettings();
    if (!settings.trackingEnabled) {
      await saveSettings({ trackingEnabled: true });
    }
    if (currentSessionId) return;
    await startSessionNow('Session started manually');
  });
}

// ---------- idle handling ----------

/** Record user activity (page visit, tab switch, time accrued...). */
export function notifyActivity(): void {
  if (!currentSessionId) return;
  const now = Date.now();
  lastActivityAt = now;
  if (now - lastPersistedAt >= PERSIST_THROTTLE_MS) {
    lastPersistedAt = now;
    void setState(LAST_ACTIVITY_KEY, now);
  }
}

async function expireIfIdle(): Promise<void> {
  if (currentSessionId && Date.now() - lastActivityAt > IDLE_TIMEOUT_MS) {
    await endSessionNow(lastActivityAt);
  }
}

/** Called from the periodic alarm: end the session if nothing happened for the idle window. */
export function checkIdleTimeout(): Promise<void> {
  return queue.run(async () => {
    await initSessionManager();
    await expireIfIdle();
  });
}
