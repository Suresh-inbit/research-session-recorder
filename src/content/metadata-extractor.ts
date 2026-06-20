// ============================================================
// Metadata Extractor
// ============================================================
// Extracts general page metadata from the DOM.

export interface PageMeta {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  author?: string;
}

export function extractPageMetadata(): PageMeta {
  const meta: PageMeta = {
    title: document.title,
  };

  // Description
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) meta.description = descEl.getAttribute('content') || undefined;

  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) meta.ogTitle = ogTitle.getAttribute('content') || undefined;

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) meta.ogDescription = ogDesc.getAttribute('content') || undefined;

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) meta.ogImage = ogImage.getAttribute('content') || undefined;

  // Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) meta.canonicalUrl = canonical.getAttribute('href') || undefined;

  // Author
  const authorEl = document.querySelector('meta[name="author"]');
  if (authorEl) meta.author = authorEl.getAttribute('content') || undefined;

  return meta;
}
