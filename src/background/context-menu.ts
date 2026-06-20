// ============================================================
// Context Menu
// ============================================================
// Sets up the right-click context menu for saving highlights.

import { CONTEXT_MENU_SAVE_HIGHLIGHT } from '../shared/constants';
import { highlightRepo } from '../db/repositories/highlight-repo';
import { getCurrentSessionId } from './session-manager';
import { pageRepo } from '../db/repositories/page-repo';
import { generateId } from '../shared/utils';
import { db } from '../db/database';

/**
 * Initialize context menus — called on extension install.
 */
export function initContextMenu(): void {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_SAVE_HIGHLIGHT,
    title: 'Save to Research Notes',
    contexts: ['selection'],
  });

  chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
}

/**
 * Handle context menu item clicks.
 */
async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<void> {
  if (info.menuItemId !== CONTEXT_MENU_SAVE_HIGHLIGHT) return;
  if (!info.selectionText || !tab?.url) return;

  const sessionId = getCurrentSessionId();
  if (!sessionId) return;

  // Find or infer the page record
  let page = await pageRepo.getByUrl(tab.url, sessionId);
  let pageId = page?.id || generateId();

  // If no page exists yet, we don't create one here — the session manager handles that.
  // But we still need a pageId for the highlight.
  if (!page) {
    // Use a placeholder — the page may be tracked later
    pageId = 'untracked-' + generateId();
  }

  // Save the highlight
  const highlight = await highlightRepo.create({
    pageId: page?.id || pageId,
    sessionId,
    text: info.selectionText,
    url: tab.url,
    pageTitle: tab.title || tab.url,
  });

  // Create timeline event
  await db.timelineEvents.add({
    id: generateId(),
    timestamp: Date.now(),
    type: 'highlight_saved',
    title: `Highlighted: "${info.selectionText.slice(0, 80)}${info.selectionText.length > 80 ? '...' : ''}"`,
    url: tab.url,
    entityId: highlight.id,
    entityType: 'highlight',
    sessionId,
  });

  // Show a brief notification badge
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
