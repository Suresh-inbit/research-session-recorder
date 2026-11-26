import type { Settings } from '../shared/types';
import { SETTINGS_KEY, normalizeSettings } from '../shared/settings';

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(result[SETTINGS_KEY]);
}

export async function saveSettings(partial: Partial<Settings>): Promise<Settings> {
  const next = normalizeSettings({ ...(await getSettings()), ...partial });
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}
