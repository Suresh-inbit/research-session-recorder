import { describe, it, expect } from 'vitest';
import { isExcludedUrl, isTrackableUrl, normalizeDomain, hostMatches } from './url-rules';

describe('isExcludedUrl', () => {
  it('excludes non-http(s) schemes', () => {
    for (const url of ['chrome://settings', 'about:blank', 'chrome-extension://abc/popup.html', 'file:///home/a.pdf', 'moz-extension://x/y']) {
      expect(isExcludedUrl(url)).toBe(true);
    }
  });

  it('excludes listed hosts and their subdomains', () => {
    expect(isExcludedUrl('https://mail.google.com/mail/u/0')).toBe(true);
    expect(isExcludedUrl('https://www.facebook.com/')).toBe(true);
    expect(isExcludedUrl('https://m.facebook.com/')).toBe(true);
    expect(isExcludedUrl('https://x.com/someone')).toBe(true);
  });

  it('does NOT exclude look-alike hosts (regression: unanchored x\\.com matched linux.com)', () => {
    expect(isExcludedUrl('https://www.linux.com/news')).toBe(false);
    expect(isExcludedUrl('https://dropbox.com/')).toBe(false);
    expect(isExcludedUrl('https://fedex.com/')).toBe(false);
    expect(isExcludedUrl('https://example.org/?ref=facebook.com')).toBe(false);
    expect(isExcludedUrl('https://notfacebook.com/')).toBe(false);
  });

  it('excludes search result pages but not the rest of the site', () => {
    expect(isExcludedUrl('https://www.google.com/search?q=cats')).toBe(true);
    expect(isExcludedUrl('https://www.bing.com/search?q=cats')).toBe(true);
    expect(isExcludedUrl('https://scholar.google.com/scholar?q=x')).toBe(false);
  });

  it('honours the user blocklist (any input form)', () => {
    expect(isExcludedUrl('https://intranet.example.com/wiki', ['example.com'])).toBe(true);
    expect(isExcludedUrl('https://example.com/', ['https://www.Example.com/path'])).toBe(true);
    expect(isExcludedUrl('https://other.com/', ['example.com'])).toBe(false);
    expect(isExcludedUrl('https://anything.com/', [''])).toBe(false);
  });

  it('treats unparseable URLs as excluded', () => {
    expect(isExcludedUrl('not a url')).toBe(true);
  });
});

describe('helpers', () => {
  it('normalizeDomain strips scheme, www, port, path', () => {
    expect(normalizeDomain(' HTTPS://www.Foo.com:8080/a/b?c#d ')).toBe('foo.com');
    expect(normalizeDomain('foo.com.')).toBe('foo.com');
  });
  it('hostMatches requires a dot boundary', () => {
    expect(hostMatches('a.b.com', 'b.com')).toBe(true);
    expect(hostMatches('ab.com', 'b.com')).toBe(false);
  });
  it('isTrackableUrl only accepts http(s)', () => {
    expect(isTrackableUrl('https://a.com')).toBe(true);
    expect(isTrackableUrl('ftp://a.com')).toBe(false);
  });
});
