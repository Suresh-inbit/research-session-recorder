// ============================================================
// Context Menu
// ============================================================
// Right-click menu for saving the current selection.
// Menu *items* are created once on install; the click *listener* must be registered
// on every worker start (top level), or clicks are lost after the worker restarts.

import { CONTEXT_MENU_SAVE_HIGHLIGHT, CONTEXT_MENU_SAVE_NOTE } from '../shared/constants';
import { saveHighlight, saveNote } from './capture';

/** Create the menu items — call from onInstalled. */
export function createContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_SAVE_HIGHLIGHT,
      title: 'Save as Highlight',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: CONTEXT_MENU_SAVE_NOTE,
      title: 'Create Note from Selection',
      contexts: ['selection'],
    });
  });
}

/** Register the click listener — call synchronously at worker start-up. */
export function initContextMenu(): void {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    void handleContextMenuClick(info, tab).catch((err) => console.error('[RSR] context menu failed:', err));
  });
}

async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<void> {
  if (info.menuItemId !== CONTEXT_MENU_SAVE_HIGHLIGHT && info.menuItemId !== CONTEXT_MENU_SAVE_NOTE) return;
  if (!info.selectionText || !tab?.url) return;

  const pageTitle = tab.title || tab.url;
  if (info.menuItemId === CONTEXT_MENU_SAVE_HIGHLIGHT) {
    await saveHighlight({ text: info.selectionText, url: tab.url, pageTitle });
  } else {
    await saveNote({ content: info.selectionText, url: tab.url, pageTitle });
  }

  try {
    await chrome.action.setBadgeText({ text: '✓' });
    await chrome.action.setBadgeBackgroundColor({ color: '#34d399' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 2000);
  } catch {
    // Badge API may not be available
  }
}
