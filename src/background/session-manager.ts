// ============================================================
// Session Manager
// ============================================================
// Manages the lifecycle of research sessions — auto-start on
// research page visits, auto-end on idle timeout.

import { sessionRepo } from '../db/repositories/session-repo';
import { pageRepo } from '../db/repositories/page-repo';
import { classifyPage, isExcludedUrl, cleanPageTitle } from './page-classifier';
import { DEFAULT_IDLE_TIMEOUT_MINUTES } from '../shared/constants';
import type { Session, Page } from '../shared/types';
import { generateId } from '../shared/utils';
import { db } from '../db/database';

let currentSessionId: string | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
const IDLE_TIMEOUT_MS = DEFAULT_IDLE_TIMEOUT_MINUTES * 60 * 1000;

/**
 * Initialize the session manager — restore any active session from DB.
 */
export async function initSessionManager(): Promise<void> {
  const activeSession = await sessionRepo.getActive();
  if (activeSession) {
    currentSessionId = activeSession.id;
    resetIdleTimer();
  }
}

/**
 * Handle a page visit — start a session if needed, record the page.
 */
export async function handlePageVisit(url: string, title: string): Promise<Page | null> {
  if (isExcludedUrl(url)) return null;

  const classification = classifyPage(url);
  const cleanedTitle = cleanPageTitle(title, url);

  // Auto-start a session if none active
  if (!currentSessionId) {
    const session = await sessionRepo.create();
    currentSessionId = session.id;

    // Create a timeline event for session start
    await db.timelineEvents.add({
      id: generateId(),
      timestamp: Date.now(),
      type: 'session_start',
      title: 'Session started',
      entityId: session.id,
      entityType: 'session',
      sessionId: session.id,
    });
  }

  resetIdleTimer();

  // Check if this page was already visited in this session
  const existingPage = await pageRepo.getByUrl(url, currentSessionId);
  if (existingPage) {
    await pageRepo.update(existingPage.id, { lastActiveAt: Date.now() });
    return existingPage;
  }

  // Create new page record
  const page = await pageRepo.create({
    sessionId: currentSessionId,
    url,
    title: cleanedTitle,
    type: classification.type,
    typeConfidence: classification.confidence,
    activeTimeSeconds: 0,
    visitedAt: Date.now(),
    lastActiveAt: Date.now(),
  });

  // Create timeline event
  await db.timelineEvents.add({
    id: generateId(),
    timestamp: Date.now(),
    type: 'page_visit',
    title: `Visited: ${cleanedTitle}`,
    url,
    entityId: page.id,
    entityType: 'page',
    sessionId: currentSessionId,
  });

  return page;
}

/**
 * Get the current active session.
 */
export async function getCurrentSession(): Promise<Session | null> {
  if (!currentSessionId) return null;
  const session = await sessionRepo.getById(currentSessionId);
  return session || null;
}

/**
 * Get the current session ID.
 */
export function getCurrentSessionId(): string | null {
  return currentSessionId;
}

/**
 * End the current session manually or due to idle timeout.
 */
export async function endCurrentSession(): Promise<void> {
  if (!currentSessionId) return;

  await sessionRepo.endSession(currentSessionId);

  // Create timeline event
  await db.timelineEvents.add({
    id: generateId(),
    timestamp: Date.now(),
    type: 'session_end',
    title: 'Session ended',
    entityId: currentSessionId,
    entityType: 'session',
    sessionId: currentSessionId,
  });

  currentSessionId = null;
  clearIdleTimer();
}

/**
 * Reset the idle timer — called on every activity.
 */
function resetIdleTimer(): void {
  clearIdleTimer();
  idleTimer = setTimeout(async () => {
    await endCurrentSession();
  }, IDLE_TIMEOUT_MS);
}

/**
 * Clear the idle timer.
 */
function clearIdleTimer(): void {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

/**
 * Notify the session manager of user activity (to reset idle timer).
 */
export function notifyActivity(): void {
  if (currentSessionId) {
    resetIdleTimer();
  }
}
