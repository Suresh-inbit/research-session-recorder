// ============================================================
// Background Service Worker Entry
// ============================================================

import { initSessionManager, handlePageVisit } from './session-manager';
import { initTimeTracker } from './time-tracker';
import { initContextMenu } from './context-menu';
import { initMessageHandler } from './message-handler';

// Extension installed / updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[RSR] Extension installed/updated');
  initContextMenu();
  await initSessionManager();

  // Set side panel behavior — open on action click
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (e) {
    console.warn('[RSR] Side panel behavior not supported:', e);
  }
});

// Service worker startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('[RSR] Service worker started');
  await initSessionManager();
});

// Initialize subsystems
initTimeTracker();
initMessageHandler();

// Track tab navigation for auto-session creation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.active) {
    await handlePageVisit(tab.url, tab.title || tab.url);
  }
});

console.log('[RSR] Background service worker loaded');
