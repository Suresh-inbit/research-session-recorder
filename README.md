# Research Session Recorder

A Manifest V3 browser extension (Chrome and Firefox) that quietly records your research sessions —
papers, repositories, docs, videos — and lets you annotate them as you read.

Everything stays **on your device** (IndexedDB + extension storage). There are no network calls and no
accounts. Note that this storage is *not encrypted*.

## Features

- **Automatic sessions** – a session starts on your first tracked page and ends after 15 minutes without activity.
- **Active-time tracking** – time is only counted while the tab is focused and you are not idle.
- **Page classification** – arXiv/OpenReview/CVF papers, GitHub/GitLab repos, docs, videos, datasets, forums, blogs.
  Paper and repo metadata (authors, abstract, stars…) is scraped from the page.
- **Capture** – select text → floating *Save Highlight* button or right-click menu; `Alt+Shift+N` opens a quick-note widget.
- **Notes, questions, hypotheses, ideas** – with tags and status.
- **Views** – popup (today at a glance), side panel (live session + notes/quotes/inquiries/timeline/search),
  full dashboard (stats, activity chart, daily report, knowledge graph, export).
- **Export** – Markdown, JSON, CSV, Obsidian (with `[[wikilinks]]` and frontmatter). Exports contain *all* data.
- **Privacy controls** – webmail, social media, search results and anything non-http(s) are never tracked;
  incognito tabs are never tracked; add your own blocked domains in Settings.

## Install (development)

```bash
npm install
npm run build:chrome      # or build:firefox, or `npm run build` for both
```

| Browser | Load it from |
| --- | --- |
| Chrome / Edge / Brave | `chrome://extensions` → *Developer mode* → *Load unpacked* → `dist/chrome` |
| Firefox (121+) | `about:debugging` → *This Firefox* → *Load Temporary Add-on…* → `dist/firefox/manifest.json` |

`npm run dev` does a Chrome build and then rebuilds on change (reload the extension after each rebuild).

> **Before publishing to Firefox**, replace the placeholder add-on id
> (`research-session-recorder@example.com`) in `public/manifest.json` with your own.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Alt+Shift+N` | Toggle the quick-note widget on the current page |
| `Alt+Shift+R` | Open the side panel / sidebar |

Rebind them at `chrome://extensions/shortcuts` (Chrome) or *Manage Extension Shortcuts* (Firefox).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run build:chrome` / `build:firefox` / `build` | Typecheck, then build into `dist/<browser>` |
| `npm run dev` | Build Chrome, then watch |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:watch` | Vitest (in-memory IndexedDB, mocked `chrome.*`) |
| `npm run check` | typecheck + lint + tests |

## Architecture

```
src/
├── background/      MV3 service worker (the brain)
│   ├── index.ts           registers every listener synchronously, at top level
│   ├── session-manager.ts session lifecycle, page records, idle expiry
│   ├── time-tracker.ts    active-time accounting (tab / window / idle events)
│   ├── tab-tracker.ts     tab → page resolution, navigation parents
│   ├── capture.ts         save highlight / note / question (+ timeline events)
│   ├── message-handler.ts typed request/response API for the UI and content script
│   ├── context-menu.ts · commands.ts · alarms.ts
│   └── queue.ts · state.ts   serial task queue; storage.session-backed state
├── content/         injected into http(s) pages (built as a standalone IIFE)
├── popup/ sidepanel/ dashboard/   React UIs (each has its own HTML entry)
├── components/      ui/ design system, tabs/ shared list views, graph/ knowledge graph
├── db/              Dexie schema + repositories (one per table)
├── services/        stats (pure), topic extraction, export
├── shared/          types, message protocol, constants, URL rules, settings, utils
└── test/            chrome.* mock, IndexedDB setup
```

### How tracking works

1. The **background** listens to tab activation/navigation, window focus and idle state.
   The content script does *not* report page visits.
2. `trackTab()` resolves the focused tab to a `Page` (creating a session first if needed) and links
   navigations as `navigated_from` relationships.
3. `time-tracker` credits `now − lastTick` (capped at 90 s) to the current page whenever something
   changes and on a 30-second `chrome.alarms` tick.
4. The same alarm ends a session whose last activity is older than 15 minutes — at the time of that
   last activity, not "now".

### Why the worker looks the way it does

MV3 service workers are killed after ~30 s of inactivity and re-run from the top. So:

- listeners are registered at top level, never inside `onInstalled` or async code;
- no `setTimeout`-based logic — idle expiry is evaluated against persisted timestamps;
- the active tab/page, last activity and tab→URL map live in `chrome.storage.session`;
- the active session is re-read from IndexedDB on start;
- mutations that read-then-write (create page, accrue time) go through serial queues.

### Data model (IndexedDB `ResearchSessionRecorderDB`, schema v2)

`sessions`, `pages`, `notes`, `highlights`, `questions`, `topics`, `relationships`, `dailyReports`,
`timelineEvents`. Items saved while nothing is tracked use the placeholder id `untracked`.

Schema v2 dropped the `isActive` index (booleans are not valid IndexedDB keys, so it never matched
anything) and closes sessions that older versions left dangling.

## Testing

```bash
npm test
```

Covers URL rules, page classification, settings normalisation, stats/streaks, export escaping,
the DB (incl. the v1→v2 migration), the session manager (concurrency, restart, idle expiry) and the
time tracker (idle, focus, tab switching, restart). The UI is not covered by automated tests.

## Known limitations

- Time is attributed to the day a page was *first visited*, not split across days.
- Topic extraction is a simple frequency heuristic; there is no LLM integration.
- The extension needs the `tabs` permission and runs a content script on all http(s) pages — that is
  inherent to automatic tracking, but expect to justify it in a store listing.

## License

MIT
