// ============================================================
// Page Classifier
// ============================================================
// Classifies URLs into research page categories using pattern matching.

import { PAGE_CLASSIFICATION_RULES } from '../shared/constants';
import { isExcludedUrl } from '../shared/url-rules';
import type { PageType } from '../shared/types';

export interface ClassificationResult {
  type: PageType;
  confidence: number;
}

/**
 * Classify a URL into a research page type.
 * Returns the first matching rule with its confidence score.
 */
export function classifyPage(url: string): ClassificationResult {
  // Check exclusions first
  if (isExcludedUrl(url)) {
    return { type: 'unknown', confidence: 0 };
  }

  for (const rule of PAGE_CLASSIFICATION_RULES) {
    if (rule.pattern.test(url)) {
      return {
        type: rule.type,
        confidence: rule.confidence,
      };
    }
  }

  return { type: 'unknown', confidence: 0.5 };
}

/**
 * Check if a URL is a research-relevant page (not unknown and not excluded).
 */
export function isResearchPage(url: string): boolean {
  if (isExcludedUrl(url)) return false;
  const result = classifyPage(url);
  return result.type !== 'unknown';
}

/**
 * Extract a clean title from URL and document title.
 * Removes common suffixes like " - YouTube", " · GitHub", etc.
 */
export function cleanPageTitle(title: string, url: string): string {
  if (!title) return url;

  // Remove common suffixes
  const suffixes = [
    / - YouTube$/,
    / · GitHub$/,
    / - GitHub$/,
    / \| Hacker News$/,
    / - Stack Overflow$/,
    / \| Reddit$/,
    / - arXiv$/,
    / \| OpenReview$/,
    / \| Papers With Code$/,
  ];

  let cleaned = title;
  for (const suffix of suffixes) {
    cleaned = cleaned.replace(suffix, '');
  }

  return cleaned.trim();
}
