// ============================================================
// Tab → page resolution
// ============================================================
// Turns "this tab is now showing a URL" into a recorded Page, remembering each tab's
// previous URL so navigations can be linked as `navigated_from` relationships.
// NOT concurrency-safe by itself: always call through time-tracker's queue.

import type { Page } from '../shared/types';
import { isExcludedUrl } from '../shared/url-rules';
import { getSettings } from './settings';
import { handlePageVisit } from './session-manager';
import { getState, setState } from './state';

const TAB_URLS_KEY = 'tabUrls';
type TabUrls = Record<string, string>;

export async function trackTab(tabId: number): Promise<Page | null> {
  let tab: chrome.tabs.Tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    return null; // tab closed in the meantime
  }
  // A loading tab may not have its final URL/title yet: wait for status === 'complete'.
  if (!tab.url || tab.status === 'loading') return null;

  const settings = await getSettings();
  if (!settings.trackingEnabled || tab.incognito || isExcludedUrl(tab.url, settings.blockedDomains)) {
    await forgetTab(tabId);
    return null;
  }

  const urls = (await getState<TabUrls>(TAB_URLS_KEY)) ?? {};
  let parentUrl: string | undefined;
  const previous = urls[tabId];
  if (previous) {
    if (previous !== tab.url) parentUrl = previous;
  } else if (tab.openerTabId !== undefined) {
    parentUrl = urls[tab.openerTabId];
  }
  urls[tabId] = tab.url;
  await setState(TAB_URLS_KEY, urls);

  return handlePageVisit(tab.url, tab.title || tab.url, parentUrl);
}

export async function forgetTab(tabId: number): Promise<void> {
  const urls = await getState<TabUrls>(TAB_URLS_KEY);
  if (urls && String(tabId) in urls) {
    delete urls[tabId];
    await setState(TAB_URLS_KEY, urls);
  }
}
