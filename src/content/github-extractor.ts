// ============================================================
// GitHub Extractor
// ============================================================
// Extracts repository metadata from GitHub pages.

import type { GitHubMetadata } from '../shared/types';

export function extractGitHubMetadata(url: string): GitHubMetadata | null {
  if (!url.includes('github.com')) return null;

  const meta: GitHubMetadata = {};

  // Owner and repo from URL
  const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (match) {
    meta.owner = match[1];
    meta.repoName = match[2];
  }

  // Description
  const descEl = document.querySelector('[itemprop="about"]') ||
    document.querySelector('.f4.my-3') ||
    document.querySelector('.BorderGrid-row p.f4');
  if (descEl) meta.description = descEl.textContent?.trim();

  // Stars
  const starsEl = document.querySelector('#repo-stars-counter-star') ||
    document.querySelector('[id="repo-stars-counter-star"]') ||
    document.querySelector('.social-count');
  if (starsEl) {
    const text = starsEl.getAttribute('title') || starsEl.textContent || '';
    const cleaned = text.replace(/[,\s]/g, '');
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) meta.stars = num;
  }

  // Language
  const langEl = document.querySelector('[data-ga-click*="language"]') ||
    document.querySelector('.BorderGrid-row .d-inline .text-bold');
  if (langEl) meta.language = langEl.textContent?.trim();

  // Topics
  const topicEls = document.querySelectorAll('.topic-tag');
  if (topicEls.length) {
    meta.topics = Array.from(topicEls)
      .map(el => el.textContent?.trim() || '')
      .filter(Boolean);
  }

  return meta;
}
