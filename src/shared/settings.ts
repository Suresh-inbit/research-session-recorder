// ============================================================
// Settings defaults & normalization (shared by every context)
// ============================================================

import type { Settings } from './types';
import { normalizeDomain } from './url-rules';

export const SETTINGS_KEY = 'settings';

export const DEFAULT_SETTINGS: Settings = {
  trackingEnabled: true,
  highlightEnabled: true,
  blockedDomains: [],
};

/** Merge whatever is in storage with the defaults, dropping invalid values. */
export function normalizeSettings(raw: unknown): Settings {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Partial<Settings>;
  const blocked = Array.isArray(input.blockedDomains) ? input.blockedDomains : [];
  return {
    trackingEnabled: input.trackingEnabled !== false,
    highlightEnabled: input.highlightEnabled !== false,
    blockedDomains: Array.from(
      new Set(blocked.filter((d): d is string => typeof d === 'string').map(normalizeDomain).filter(Boolean))
    ),
  };
}
