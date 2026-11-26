import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '../shared/types';
import { DEFAULT_SETTINGS, SETTINGS_KEY, normalizeSettings } from '../shared/settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      setSettings(normalizeSettings(result[SETTINGS_KEY]));
      setLoading(false);
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes[SETTINGS_KEY]) {
        setSettings(normalizeSettings(changes[SETTINGS_KEY].newValue));
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    // Read-modify-write from storage so concurrent updates don't clobber each other.
    const stored = await chrome.storage.local.get(SETTINGS_KEY);
    const updated = normalizeSettings({ ...normalizeSettings(stored[SETTINGS_KEY]), ...newSettings });
    setSettings(updated);
    await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
  }, []);

  return { settings, loading, updateSettings };
}
