// ============================================================
// Paper Extractor
// ============================================================
// Extracts paper-specific metadata from arXiv, OpenReview, CVF pages.

import type { PaperMetadata } from '../shared/types';

export function extractPaperMetadata(url: string): PaperMetadata | null {
  if (url.includes('arxiv.org')) return extractArxiv();
  if (url.includes('openreview.net')) return extractOpenReview();
  if (url.includes('thecvf.com') || url.includes('cvf-org')) return extractCVF();
  return null;
}

function extractArxiv(): PaperMetadata {
  const meta: PaperMetadata = {};

  // arXiv id comes from the URL path
  if (document.querySelector('h1.title')) {
    meta.arxivId = window.location.pathname.replace(/^\/(abs|pdf)\//, '').replace(/\.pdf$/, '');
  }

  // Authors
  const authorsEl = document.querySelector('.authors');
  if (authorsEl) {
    const authorLinks = authorsEl.querySelectorAll('a');
    meta.authors = Array.from(authorLinks).map(a => a.textContent?.trim() || '').filter(Boolean);
  }

  // Abstract
  const abstractEl = document.querySelector('blockquote.abstract');
  if (abstractEl) {
    meta.abstract = (abstractEl.textContent || '')
      .replace(/^Abstract:\s*/i, '')
      .trim();
  }

  // Year from submission date
  const dateEl = document.querySelector('.dateline');
  if (dateEl) {
    const match = (dateEl.textContent || '').match(/(\d{4})/);
    if (match) meta.year = parseInt(match[1], 10);
  }

  // ArXiv ID
  const idMatch = window.location.pathname.match(/\/(abs|pdf)\/([\d.]+)/);
  if (idMatch) meta.arxivId = idMatch[2];

  return meta;
}

function extractOpenReview(): PaperMetadata {
  const meta: PaperMetadata = {};

  const authorEls = document.querySelectorAll('.meta_row .note-authors a, .author-name');
  if (authorEls.length) {
    meta.authors = Array.from(authorEls).map(a => a.textContent?.trim() || '').filter(Boolean);
  }

  const venueEl = document.querySelector('.meta_row .venue-name, .note-content-value');
  if (venueEl) meta.venue = venueEl.textContent?.trim();

  return meta;
}

function extractCVF(): PaperMetadata {
  const meta: PaperMetadata = {};

  const authorsEl = document.querySelector('#authors');
  if (authorsEl) {
    const text = authorsEl.textContent || '';
    meta.authors = text.split(',').map(a => a.trim()).filter(Boolean);
  }

  const abstractEl = document.querySelector('#abstract');
  if (abstractEl) meta.abstract = abstractEl.textContent?.trim();

  return meta;
}
