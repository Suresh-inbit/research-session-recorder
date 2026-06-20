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

/** Database version */
export const DB_VERSION = 1;

/** Context menu ID */
export const CONTEXT_MENU_SAVE_HIGHLIGHT = 'save-to-research-notes';

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

/** URLs to exclude from tracking */
export const EXCLUDED_URL_PATTERNS: RegExp[] = [
  /^chrome:\/\//,
  /^chrome-extension:\/\//,
  /^about:/,
  /^edge:\/\//,
  /^brave:\/\//,
  /google\.com\/search/,
  /bing\.com\/search/,
  /duckduckgo\.com\//,
  /mail\.google\.com/,
  /outlook\.live\.com/,
  /web\.whatsapp\.com/,
  /facebook\.com/,
  /twitter\.com|x\.com/,
  /instagram\.com/,
  /netflix\.com/,
  /spotify\.com/,
];

/** Page type display labels */
export const PAGE_TYPE_LABELS: Record<import('./types').PageType, string> = {
  paper: '📄 Paper',
  repository: '💻 Repository',
  documentation: '📖 Documentation',
  video: '🎬 Video',
  blog: '✏️ Blog Post',
  forum: '💬 Discussion',
  dataset: '📊 Dataset',
  unknown: '🔗 Page',
};

/** Page type colors (for badges/charts) */
export const PAGE_TYPE_COLORS: Record<import('./types').PageType, string> = {
  paper: '#7c5cfc',
  repository: '#38bdf8',
  documentation: '#34d399',
  video: '#f87171',
  blog: '#fbbf24',
  forum: '#a78bfa',
  dataset: '#fb923c',
  unknown: '#6b7084',
};
