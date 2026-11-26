// ============================================================
// URL rules — which pages are never tracked or annotated
// ============================================================
// Pure functions only (no chrome.* / DOM) so they are usable from the
// background worker, content scripts, UI and unit tests alike.

/** Hosts (and all their subdomains) that are never tracked. */
export const EXCLUDED_HOSTS: string[] = [
  'mail.google.com',
  'accounts.google.com',
  'outlook.live.com',
  'outlook.office.com',
  'web.whatsapp.com',
  'web.telegram.org',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'netflix.com',
  'spotify.com',
  'paypal.com',
  'duckduckgo.com',
];

/** Search-result pages: the host is fine, but these paths are not research. */
export const EXCLUDED_PATH_RULES: Array<{ host: string; pathPrefix: string }> = [
  { host: 'google.com', pathPrefix: '/search' },
  { host: 'bing.com', pathPrefix: '/search' },
];

/** Reduce user input ("https://www.Example.com/path") to a bare lowercase hostname. */
export function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  d = d.split(/[/?#]/)[0];
  d = d.replace(/:\d+$/, '');
  d = d.replace(/^www\./, '');
  return d.replace(/\.$/, '');
}

/** True when `host` is `domain` or one of its subdomains. */
export function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith('.' + domain);
}

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** Only http(s) pages can ever be tracked (no chrome://, about:, extensions, file:, ...). */
export function isTrackableUrl(url: string): boolean {
  const u = parse(url);
  return !!u && (u.protocol === 'http:' || u.protocol === 'https:');
}

/**
 * Should this URL be skipped entirely?
 * @param blockedDomains user-configured extra domains (already normalized or raw)
 */
export function isExcludedUrl(url: string, blockedDomains: string[] = []): boolean {
  const u = parse(url);
  if (!u || (u.protocol !== 'http:' && u.protocol !== 'https:')) return true;

  const host = u.hostname.toLowerCase().replace(/^www\./, '');

  if (EXCLUDED_HOSTS.some((d) => hostMatches(host, d))) return true;
  if (EXCLUDED_PATH_RULES.some((r) => hostMatches(host, r.host) && u.pathname.startsWith(r.pathPrefix))) return true;
  return blockedDomains.some((d) => {
    const n = normalizeDomain(d);
    return n !== '' && hostMatches(host, n);
  });
}
