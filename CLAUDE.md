# CLAUDE.md

Research Session Recorder — MV3 browser extension (Chrome + Firefox), TypeScript, React 19, Dexie (IndexedDB), Vite.
See `README.md` for features and architecture; this file is the working agreement for changing the code.

## Commands

```bash
npm run check          # typecheck + lint + tests — run before calling anything done
npm test               # vitest (node env, fake-indexeddb, mocked chrome.*)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint src
npm run build:chrome   # → dist/chrome   (build:firefox → dist/firefox)
```

A build is two Vite runs: `vite.config.ts` (popup/sidepanel/dashboard/background) then
`vite.content.config.ts` (content script as a standalone IIFE). Don't merge them: content scripts
cannot `import` shared chunks.

There is no way to load the extension from this environment — UI/browser behaviour is verified by
tests of the underlying logic only. Say so rather than claiming something "works in the browser".

## MV3 service-worker rules (the source of most past bugs)

The worker is killed when idle and re-executed from the top. Therefore, in `src/background/`:

1. **Register every `chrome.*.addListener` synchronously at top level** (see `index.ts`). Never inside
   `onInstalled`, a promise callback, or a function that only runs once. One-time setup (creating
   context-menu items) goes in `onInstalled`; the *listener* does not.
2. **No `setTimeout`/`setInterval` for logic that must survive.** Use `chrome.alarms` (`alarms.ts`) and
   compare persisted timestamps. A `setInterval` is only an optimisation while the worker is alive.
3. **Module variables are a cache, not the source of truth.** Persist what matters in
   `chrome.storage.session` (`state.ts`) or IndexedDB, and re-derive on start.
4. **Serialise read-modify-write** with `createQueue()` (`queue.ts`). Tab/window/idle events fire
   concurrently; without a queue you get duplicate pages and lost time.
5. Don't call `notifyActivity()` just because the worker woke up — that would keep sessions alive forever.

## Data / IndexedDB

- **Booleans can't be indexed.** Don't add an index on `isActive` (or any boolean); filter instead.
- Schema changes need a new `this.version(n)` in `src/db/database.ts` with `.upgrade()` if data must be fixed.
  Never edit an old version block. `src/db/database.test.ts` has a migration test to copy from.
- Dexie `where()` only works on indexed fields (`activeTimeSeconds` is *not* indexed).
- UI list endpoints are capped (`getAll(limit)`); anything that must be complete (export) uses `GET_EXPORT_DATA`.
- Use `Table.where(...).modify(fn)` for atomic increments.

## Conventions

- **Messages**: add a typed interface + union member in `src/shared/messages.ts`, handle it in
  `background/message-handler.ts`, expose via a hook in `src/hooks/index.ts` if the UI needs it.
- **Saving content** (highlight/note/question) goes through `background/capture.ts` so session/page
  resolution lives in one place.
- **URL policy** lives in `src/shared/url-rules.ts` (pure, hostname-based — never use unanchored regexes
  on whole URLs; `x\.com` once matched `linux.com`). Respect `settings.blockedDomains`; never track
  incognito tabs or non-http(s) URLs.
- **Settings** defaults/normalisation: `src/shared/settings.ts` only. Don't re-declare defaults.
- **Time/dates**: `formatDate` is *local* time. Use `startOfDayDaysAgo` for day arithmetic (DST-safe).
- **Stats** are computed from page `activeTimeSeconds` (focused, non-idle time), never wall-clock session length.
- **Exports** must go through `csvCell` / `wikiLink` / `mdLabel` / `mdUrl` (formula injection, broken links).
- Open links with `openUrl` / `openExtensionPage` (`shared/utils.ts`); open the panel with `openSidePanel`.
- **Styling**: colours/spacing/radii come from CSS variables in `src/styles/design-tokens.css` — only use
  tokens that exist there (an undefined `var(--x)` fails silently; `--accent-amber`/`--accent-rose` once did).
  Shared look lives in `src/styles/components.css` (`.card`, `.btn`, `.tab`, `.icon-btn`, `.stat-tile`,
  `.row-item`, `.page-head`, `.chart`…). Put hover/active/focus states there, **not** in `useState` +
  `onMouseEnter`; keep inline `style` for one-off layout and data-driven values (e.g. a bar's width).
- Every colour must work in both themes (`[data-theme="light"]` overrides in the tokens file). Category colours
  are `PAGE_TYPE_COLORS` (CSS vars). For a translucent colour use `tint(color, %)` from `shared/color.ts` —
  never `` `${color}1a` ``, which is invalid for `var()` colours.
- Icons are Flaticon `fi fi-rr-*` (regular-rounded only — the build strips other fonts/formats, see
  `vite.config.ts`). Not every name exists: check `node_modules/@flaticon/flaticon-uicons/css/regular/rounded.css`
  (a missing one renders blank). No emoji as icons.
- Fonts are bundled (`src/styles/fonts.css`, latin subset) — never `@import` a remote font/stylesheet.
- Interactive elements need real semantics: `<button type="button">`, `role="tab"`/`aria-selected`,
  `role="dialog"` on modals, visible `:focus-visible`. Motion respects `prefers-reduced-motion` (components.css).
- Keep pure logic (stats, URL rules, parsing) free of `chrome.*`/DOM so it is unit-testable.
- ESLint is `warn` for `any`; prefer real types. Unused vars: prefix with `_`.

## Testing notes

- `src/test/chrome-mock.ts` fakes the `chrome.*` surface the background uses (storage, tabs, windows, idle).
  Extend it rather than sprinkling ad-hoc mocks.
- Simulate a worker restart with `vi.resetModules()` + re-import (see `session-manager.test.ts`,
  `time-tracker.test.ts`). Fake only `Date` (`vi.useFakeTimers({ toFake: ['Date'] })`) so IndexedDB keeps working.
- When fixing a bug, add a regression test that fails on the old code.

## Manifest / browsers

- `public/manifest.json` is the Chrome-shaped source; `manifestPlugin` in `vite.config.ts` rewrites it per
  browser (Firefox: `sidebar_action`, `open-side-panel` → `_execute_sidebar_action`, drops `sidePanel`).
- Shortcuts: `Alt+Shift+N` (note), `Alt+Shift+R` (side panel). `Ctrl+Shift+N`/`Ctrl+Shift+R` are reserved by browsers.
- The toolbar button opens the **popup**; the side panel is opened from it or by shortcut
  (`openPanelOnActionClick` is deliberately `false`).
- Firefox add-on id (`research-session-recorder@suresh-inbit.github.io`) is published on AMO — never change it.
  The Firefox build declares `data_collection_permissions: none` (nothing leaves the device); revisit if that changes.

## Git

Default branch is `main`. Commit in small logical chunks.
