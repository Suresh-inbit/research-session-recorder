// ============================================================
// App-wide Constants
// ============================================================

/** Default idle timeout before ending a session (in minutes) */
export const DEFAULT_IDLE_TIMEOUT_MINUTES = 15;

/** Heartbeat interval for time tracking (in milliseconds) */
export const TIME_TRACKING_INTERVAL_MS = 5000;

/** Maximum pages to show in lists before pagination */
export const DEFAULT_PAGE_SIZE = 50;

/** Fuse.js search threshold (0 = exact, 1 = match anything) */
export const SEARCH_THRESHOLD = 0.35;

/** Database name */
export const DB_NAME = 'ResearchSessionRecorderDB';

/** Placeholder session/page id for items saved while nothing was being tracked */
export const UNTRACKED_ID = 'untracked';

/** Context menu IDs */
export const CONTEXT_MENU_SAVE_HIGHLIGHT = 'save-to-research-notes';
export const CONTEXT_MENU_SAVE_NOTE = 'save-as-note';

/** Page type classification rules (order matters — first match wins) */
export const PAGE_CLASSIFICATION_RULES: Array<{
  pattern: RegExp;
  type: import('./types').PageType;
  confidence: number;
}> = [
  // Papers
  { pattern: /arxiv\.org\/(abs|pdf)\//, type: 'paper', confidence: 0.98 },
  { pattern: /openreview\.net\//, type: 'paper', confidence: 0.95 },
  { pattern: /cvf-org|thecvf\.com/, type: 'paper', confidence: 0.95 },
  { pattern: /semanticscholar\.org\/paper\//, type: 'paper', confidence: 0.93 },
  { pattern: /scholar\.google\.com/, type: 'paper', confidence: 0.85 },
  { pattern: /papers\.nips\.cc|neurips\.cc\/paper/, type: 'paper', confidence: 0.95 },
  { pattern: /aclanthology\.org\//, type: 'paper', confidence: 0.95 },
  { pattern: /ieeexplore\.ieee\.org\/document\//, type: 'paper', confidence: 0.93 },
  { pattern: /dl\.acm\.org\/doi\//, type: 'paper', confidence: 0.90 },

  // Repositories
  { pattern: /github\.com\/[^/]+\/[^/]+\/?$/, type: 'repository', confidence: 0.95 },
  { pattern: /github\.com\/[^/]+\/[^/]+\//, type: 'repository', confidence: 0.85 },
  { pattern: /gitlab\.com\/[^/]+\/[^/]+/, type: 'repository', confidence: 0.90 },
  { pattern: /bitbucket\.org\/[^/]+\/[^/]+/, type: 'repository', confidence: 0.90 },

  // Documentation
  { pattern: /readthedocs\.(io|org)\//, type: 'documentation', confidence: 0.95 },
  { pattern: /docs\.[^.]+\.(com|org|io)/, type: 'documentation', confidence: 0.85 },
  { pattern: /pytorch\.org\/docs\//, type: 'documentation', confidence: 0.95 },
  { pattern: /tensorflow\.org\/api_docs\//, type: 'documentation', confidence: 0.95 },
  { pattern: /developer\.mozilla\.org\//, type: 'documentation', confidence: 0.90 },
  { pattern: /devdocs\.io\//, type: 'documentation', confidence: 0.90 },

  // Videos
  { pattern: /youtube\.com\/watch/, type: 'video', confidence: 0.98 },
  { pattern: /youtu\.be\//, type: 'video', confidence: 0.98 },
  { pattern: /vimeo\.com\/\d+/, type: 'video', confidence: 0.95 },

  // Datasets
  { pattern: /huggingface\.co\/datasets\//, type: 'dataset', confidence: 0.95 },
  { pattern: /kaggle\.com\/datasets\//, type: 'dataset', confidence: 0.95 },
  { pattern: /paperswithcode\.com\/dataset\//, type: 'dataset', confidence: 0.93 },

  // Forums / Discussion
  { pattern: /reddit\.com\/r\//, type: 'forum', confidence: 0.90 },
  { pattern: /stackoverflow\.com\/questions\//, type: 'forum', confidence: 0.90 },
  { pattern: /news\.ycombinator\.com\//, type: 'forum', confidence: 0.85 },
  { pattern: /discuss\.pytorch\.org\//, type: 'forum', confidence: 0.88 },

  // Blog Posts
  { pattern: /medium\.com\//, type: 'blog', confidence: 0.80 },
  { pattern: /dev\.to\//, type: 'blog', confidence: 0.80 },
  { pattern: /towardsdatascience\.com\//, type: 'blog', confidence: 0.85 },
  { pattern: /distill\.pub\//, type: 'blog', confidence: 0.90 },
  { pattern: /lilianweng\.github\.io\//, type: 'blog', confidence: 0.90 },
  { pattern: /blog\.[^.]+\.(com|org|io)/, type: 'blog', confidence: 0.70 },
];

/** Page type display labels */
export const PAGE_TYPE_LABELS: Record<import('./types').PageType, string> = {
  paper: 'Paper',
  repository: 'Repository',
  documentation: 'Documentation',
  video: 'Video',
  blog: 'Blog Post',
  forum: 'Discussion',
  dataset: 'Dataset',
  unknown: 'Page',
};

/** Page type icons (Flaticon classes) */
export const PAGE_TYPE_ICONS: Record<import('./types').PageType, string> = {
  paper: 'fi fi-rr-document',
  repository: 'fi fi-rr-code-branch',
  documentation: 'fi fi-rr-book',
  video: 'fi fi-rr-play-alt',
  blog: 'fi fi-rr-edit',
  forum: 'fi fi-rr-comments',
  dataset: 'fi fi-rr-chart-pie-alt',
  unknown: 'fi fi-rr-link',
};

/** Page type colors (for badges/charts) */
export const PAGE_TYPE_COLORS: Record<import('./types').PageType, string> = {
  // CSS variables (design-tokens.css) so the colours adapt to the light theme.
  paper: 'var(--color-paper)',
  repository: 'var(--color-repository)',
  documentation: 'var(--color-documentation)',
  video: 'var(--color-video)',
  blog: 'var(--color-blog)',
  forum: 'var(--color-forum)',
  dataset: 'var(--color-dataset)',
  unknown: 'var(--color-unknown)',
};
