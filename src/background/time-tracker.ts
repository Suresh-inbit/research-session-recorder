// ============================================================
// Time Tracker
// ============================================================
// Accrues active time on the page in the focused tab. Time is accounted as deltas
// ("now − last tick", capped) every time something changes — tab switch, focus, idle
// state — and on a periodic tick (setInterval while the worker is alive, plus the
// chrome.alarms tick that wakes it). The state is persisted, so a service-worker
// restart loses at most one tick instead of all tracking.

import { pageRepo } from '../db/repositories/page-repo';
import { TIME_TRACKING_INTERVAL_MS } from '../shared/constants';
import { notifyActivity } from './session-manager';
import { trackTab, forgetTab } from './tab-tracker';
import { createQueue } from './queue';
import { getState, setState } from './state';

/** Idle detection threshold passed to chrome.idle (seconds). */
const IDLE_DETECTION_SECONDS = 60;
/** Never credit more than this for a single gap (worker asleep, laptop suspended...). */
export const MAX_GAP_MS = 90_000;

const STATE_KEY = 'tracker';

interface TrackerState {
  tabId: number | null;
  pageId: string | null;
  windowFocused: boolean;
  idle: boolean;
  lastTickAt: number;
}

const queue = createQueue();
let state: TrackerState | null = null;

async function ensureState(): Promise<TrackerState> {
  if (state) return state;
  const stored = await getState<TrackerState>(STATE_KEY);
  if (stored) {
    state = stored;
    return state;
  }

  let windowFocused = true;
  try {
    windowFocused = (await chrome.windows.getLastFocused()).focused;
  } catch { /* keep default */ }
  let idle = false;
  try {
    idle = (await chrome.idle.queryState(IDLE_DETECTION_SECONDS)) !== 'active';
  } catch { /* keep default */ }

  state = { tabId: null, pageId: null, windowFocused, idle, lastTickAt: Date.now() };
  return state;
}

async function persist(): Promise<void> {
  if (state) await setState(STATE_KEY, state);
}

/** Credit the time elapsed since the last tick to the current page (if actively viewed). */
async function flush(): Promise<void> {
  const s = await ensureState();
  const now = Date.now();
  if (s.pageId && s.windowFocused && !s.idle) {
    const elapsed = Math.min(Math.max(now - s.lastTickAt, 0), MAX_GAP_MS);
    if (elapsed > 0) {
      await pageRepo.incrementActiveTime(s.pageId, Math.round(elapsed) / 1000);
      notifyActivity(); // reading a page counts as activity: don't end the session mid-read
    }
  }
  s.lastTickAt = now;
  await persist();
}

async function switchToTab(tabId: number | null): Promise<void> {
  await flush();
  const s = await ensureState();
  s.tabId = tabId;
  s.pageId = null;
  if (tabId !== null) {
    const page = await trackTab(tabId);
    s.pageId = page?.id ?? null;
    if (page) notifyActivity();
  }
  s.lastTickAt = Date.now();
  await persist();
}

async function activeTabIn(windowId: number): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  return tab?.id ?? null;
}

/** Register all listeners. Must be called synchronously at worker start-up. */
export function initTimeTracker(): void {
  chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
    void queue.run(async () => {
      const s = await ensureState();
      // Switching tabs in a window the user isn't looking at doesn't change what's being read.
      const focused = await chrome.windows.getLastFocused().catch(() => null);
      if (focused && focused.id !== windowId && s.windowFocused) return;
      await switchToTab(tabId);
    });
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // `url` while already complete = same-document navigation (pushState / SPA routing).
    const spaNavigation = changeInfo.url !== undefined && tab.status === 'complete';
    if (changeInfo.status !== 'loading' && changeInfo.status !== 'complete' && !spaNavigation) return;
    void queue.run(async () => {
      const s = await ensureState();
      if (tabId !== s.tabId) return;
      if (changeInfo.status === 'loading') {
        // Navigating away: stop crediting the old page until the new one has loaded.
        await flush();
        s.pageId = null;
        await persist();
      } else {
        await switchToTab(tabId);
      }
    });
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    void queue.run(async () => {
      await forgetTab(tabId);
      const s = await ensureState();
      if (s.tabId === tabId) {
        await flush();
        s.tabId = null;
        s.pageId = null;
        await persist();
      }
    });
  });

  chrome.windows.onFocusChanged.addListener((windowId) => {
    void queue.run(async () => {
      await flush();
      const s = await ensureState();
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        s.windowFocused = false;
        await persist();
        return;
      }
      s.windowFocused = true;
      notifyActivity();
      const tabId = await activeTabIn(windowId);
      if (tabId !== null && tabId !== s.tabId) await switchToTab(tabId);
      else await persist();
    });
  });

  chrome.idle.setDetectionInterval(IDLE_DETECTION_SECONDS);
  chrome.idle.onStateChanged.addListener((newState) => {
    void queue.run(async () => {
      await flush();
      const s = await ensureState();
      s.idle = newState !== 'active';
      if (!s.idle) notifyActivity();
      await persist();
    });
  });

  // While the worker happens to be alive, keep the numbers fresh.
  setInterval(() => void tick(), TIME_TRACKING_INTERVAL_MS);

  // Fresh browser start: pick up whatever tab is active. On a mere worker restart the
  // persisted state is reused as-is — re-tracking would count every wake-up as activity.
  void queue.run(async () => {
    const s = await ensureState();
    if (s.tabId !== null) return;
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.id !== undefined) await switchToTab(tab.id);
  });
}

/** Periodic accrual — called by the interval and by the alarm tick. */
export function tick(): Promise<void> {
  return queue.run(flush);
}
