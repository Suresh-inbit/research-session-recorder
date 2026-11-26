import { describe, it, expect } from 'vitest';
import { normalizeSettings, DEFAULT_SETTINGS } from './settings';

describe('normalizeSettings', () => {
  it('returns defaults for missing/garbage input', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps explicit false and migrates old shapes without blockedDomains', () => {
    expect(normalizeSettings({ trackingEnabled: false, highlightEnabled: true })).toEqual({
      trackingEnabled: false,
      highlightEnabled: true,
      blockedDomains: [],
    });
  });
  it('normalizes, dedupes and filters blocked domains', () => {
    const s = normalizeSettings({ blockedDomains: ['https://www.A.com/x', 'a.com', '', 42, 'b.org'] });
    expect(s.blockedDomains).toEqual(['a.com', 'b.org']);
  });
});
