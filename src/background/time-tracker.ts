// ============================================================
// Time Tracker
// ============================================================
// Tracks active time per page using tab/window focus events
// and a heartbeat mechanism. Pauses on tab switch, blur, idle.

import { pageRepo } from '../db/repositories/page-repo';
import { notifyActivity, getCurrentSessionId } from './session-manager';
import { isExcludedUrl } from './page-classifier';
import { TIME_TRACKING_INTERVAL_MS } from '../shared/constants';

let activeTabId: number | null = null;
let activePageId: string | null = null;
let isWindowFocused = true;
let isIdle = false;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize the time tracker — set up Chrome event listeners.
 */
export function initTimeTracker(): void {
  // Tab activation
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await handleTabChange(activeInfo.tabId);
  });

  // Tab URL changes (navigation within the same tab)
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.status === 'complete' && tab.url) {
      await handleTabChange(tabId);
    }
  });

  // Window focus
  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      isWindowFocused = false;
    } else {
      isWindowFocused = true;
      notifyActivity();
    }
  });

  // Idle state detection
  chrome.idle.onStateChanged.addListener((newState) => {
    isIdle = newState !== 'active';
    if (!isIdle) {
      notifyActivity();
    }
  });

  // Set idle detection interval (60 seconds)
  chrome.idle.setDetectionInterval(60);

  // Start the heartbeat
  startHeartbeat();

  // Initialize with the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs[0]?.id) {
      await handleTabChange(tabs[0].id);
    }
  });
}

/**
 * Handle a tab change — update the active page being tracked.
 */
async function handleTabChange(tabId: number): Promise<void> {
  activeTabId = tabId;

  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || isExcludedUrl(tab.url)) {
      activePageId = null;
      return;
    }

    const sessionId = getCurrentSessionId();
    if (!sessionId) {
      activePageId = null;
      return;
    }

    // Find the page record for this URL in the current session
    const page = await pageRepo.getByUrl(tab.url, sessionId);
    activePageId = page?.id || null;

    notifyActivity();
  } catch {
    // Tab may have been closed
    activePageId = null;
  }
}

/**
 * Start the heartbeat — increment active time every interval.
 */
function startHeartbeat(): void {
  if (heartbeatInterval) return;

  heartbeatInterval = setInterval(async () => {
    if (!activePageId || !isWindowFocused || isIdle) return;

    const incrementSeconds = TIME_TRACKING_INTERVAL_MS / 1000;
    await pageRepo.incrementActiveTime(activePageId, incrementSeconds);
  }, TIME_TRACKING_INTERVAL_MS);
}

/**
 * Set the active page ID (used when a new page is created by session manager).
 */
export function setActivePageId(pageId: string | null): void {
  activePageId = pageId;
}

/**
 * Get the current active tab ID.
 */
export function getActiveTabId(): number | null {
  return activeTabId;
}
