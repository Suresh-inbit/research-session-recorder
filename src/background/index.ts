// ============================================================
// Background Service Worker Entry
// ============================================================
// IMPORTANT (MV3): the worker is killed when idle and re-run from the top when an
// event arrives. Every listener below must be registered synchronously at top level —
// never inside an async callback or a one-time install handler.

import { initSessionManager } from './session-manager';
import { initTimeTracker } from './time-tracker';
import { initContextMenu, createContextMenus } from './context-menu';
import { initMessageHandler } from './message-handler';
import { initCommands } from './commands';
import { initAlarms } from './alarms';

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[RSR] Extension installed/updated');
  createContextMenus();
  await initSessionManager();

  // The toolbar button opens the popup (which links to the side panel), not the panel itself.
  try {
    await chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: false });
  } catch (e) {
    console.warn('[RSR] Side panel behavior not supported:', e);
  }
});

chrome.runtime.onStartup.addListener(() => {
  void initSessionManager();
});

initContextMenu();
initCommands();
initMessageHandler();
initTimeTracker();
initAlarms();
