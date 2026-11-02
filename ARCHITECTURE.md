# Architecture

FileShuttle is one Node process that serves a React single-page app and a small JSON API on `127.0.0.1:3001`.

```
Browser (React)                                   Node server (Express)
───────────────                                   ─────────────────────
CSV browser ──► POST /api/folders {path|null, start, files:'csv'} ──► folders + *.csv names
     │ pick
     ▼
POST /api/csv-file {path} ──────────────────────────────────────► read ≤ 5 MB .csv ──► raw bytes
     │                       (or the browser's own dialog: read in the browser, no server)
     ▼
Skills CSV bytes ──► decode ──► parse ──► validate ──► skill cards
                                   │
                                   ▼
                  POST /api/inspect {paths}  ───►  stat() each path ──► file | folder | missing
                                   │
             source list ◄─────────┘
                 │  + / drag / add all
                 ▼
              basket ──► for each item:
                  POST /api/copy {source, destination, policy} ───► fs.cp() into destination
                 ◄────────────── {outcome, target, message} ◄───────┘
```

The CSV browser opens in the server's working folder (`process.cwd()`; `npm` runs FileShuttle in the project folder) because a web page can't tell the browser's own file dialog where to open. The server only hands back the CSV's bytes; decoding, parsing and validation stay in the browser, the same as for a file opened with the browser's own dialog, which remains as a fallback and needs no server. Items are copied **one request per item**, so every basket row can show its own progress, one failure doesn't stop the batch, and the user can stop between items.

Every API call carries the per-launch key from the launch link (`X-FileShuttle-Key`); see [SECURITY.md](SECURITY.md).

## Folder layout

```
shared/
  api.ts                 zod schemas + types for every request and response (used by both sides)
server/
  index.ts               entry point: flags, elevation check, launch key, Vite (dev) or dist/ (prod), loopback listen
  app.ts                 Express app: headers, Host check, Fetch Metadata, dev-endpoint block, /api router
  middleware/security.ts CSP and headers, Host allowlist, cross-site/CSRF checks, API key check
  routes/api.ts          /api/inspect, /api/copy (one at a time), /api/health, JSON error handling
  services/              inspectPaths, copyItem (policies, rename, real-path and depth guards),
                         pathRules (local/network/invalid, Windows name rules), copyErrors, elevation,
                         listFolders (folder picker listings), apiKeyStore (key saved in the user profile)
src/
  main.tsx               React root; captures the launch key
  app/
    App.tsx              page layout only
    useFileShuttle.ts    orchestration hook: combines the feature hooks and enforces cross-feature rules
    progressSteps.ts     header step logic (Load CSV → Pick items → Copy)
  components/
    layout/              AppHeader, ProgressSteps, ConnectionNotice
    ui/                  Button, IconButton, Panel, StatusPill, ItemText, custom icons
  features/
    inventory/           loading the skills CSV and showing the skill cards
      services/          csvFileApi (POST /api/csv-file), decodeText, parseCsv, parseInventory (skills columns, zod rows, dedupe)
      utils/             filterItems
      hooks/useInventory loading state machine (a File or a picked path): empty → loading → ready | error; ignores stale runs
      components/        InputListCard, CsvFilePicker (CSV browser + system-dialog fallback), SourceListPanel, SourceListBody,
                         SkillCard (name, description, "Show details" tick), SkillDetails, FilterField
    basket/              useBasket (ordered ids), drag-and-drop helpers, same-name notes, basket components
    copy/                useCopyJob (sequential copy with stop), copyApi, validateDestination, copy option components
    folders/             folder picker, also used as the CSV browser (files: 'csv'): folderApi (POST /api/folders),
                         useFolderListing, FolderPickerDialog (<dialog>), FolderList
  hooks/useFocusAfterRender  moves focus once a control the user used disappears
  services/              apiClient (fetch + zod + friendly errors, reports connection state), apiKey (launch key storage),
                         connection (start-up /api/health check behind the "launch link" / "server not running" notices)
  styles/index.css       Tailwind v4 + design tokens (@theme)
  utils/                 cn, path display helpers
  tests/                 test setup, fake server, axe helper
scripts/create-sample.mjs
```

## Principles

- **UI is separate from logic.** Components receive data and callbacks. Parsing, validation, API calls and state machines live in `services/`, `utils/` and `hooks/`, and are unit-tested on their own.
- **One owner per piece of state.** `useInventory` owns the loaded list, `useBasket` the selected ids, `useCopyJob` the copy progress. `useFileShuttle` composes them and applies the rules that span features: missing items can't be added, nothing changes while a copy runs, and loading a new CSV resets the basket. It returns one prop group per panel, so `App.tsx` stays a layout file.
- **Validate at every boundary.** CSV rows are validated with zod in the browser; every API request is validated with strict zod schemas on the server; every API response is validated again in the browser before use.
- **The server is the authority on paths.** Client-side path checks (`validateDestination`, `joinPath`) are only for previews and early feedback.
- **Large lists stay fast.** Rows (`SourceItemRow`, `BasketItemRow`) are memoised and receive stable callbacks and flat props, so adding an item or one item's progress update re-renders only the rows that changed. Lists aren't virtualised; 5,000 rows is the supported maximum.
- **Focus is never dropped.** When a control disappears (a row's **+** after adding, **✕** after removing, the copy button when results appear), `useFocusAfterRender` moves focus to the next sensible control. Screen readers get progress through persistent `aria-live` regions.

## Design system

All visual values come from the Claude Design and live as tokens in `src/styles/index.css` (`@theme`): colours (`ink`, `muted`, `line`, `accent`, `success`, `warning`, `danger`, `folder`…), type sizes (`text-caption` 12px through `text-title` 19px), radii (`rounded-tile` 10px … `rounded-card` 20px) and shadows. Components use these Tailwind utilities instead of raw hex values. Fonts (Plus Jakarta Sans, JetBrains Mono) are self-hosted via Fontsource.

Deliberate deviations from the design:

- **Light blue page, black and larger text.** On request, the page is light blue (`--color-canvas` `#DBEAFE`) with a white header, the white cards carry a soft blue `shadow-card`, text is black (`--color-ink` `#000`, with near-black secondary text), and every type size is one step larger than the design (body 16px). Placeholders stay grey (`--color-placeholder`) so they can't be mistaken for typed values.
- **Forgiving drag-and-drop.** The whole Copy basket card accepts drops (`useDropTarget`), not just the dashed area. Skills that can't be copied yet can still be dragged, and dropping one explains why (`addRefusal`). After a copy finishes, adding a skill starts a new batch instead of being blocked.
- **Skill cards.** The source list shows skills from a skills inventory CSV as cards (name, two-line description, category tag) with a **Show details** checkbox, instead of the design's one-line file rows.

- `--color-faint` is `#646D80` rather than `#6B7487`, so 12px text meets WCAG AA contrast.
- Focus rings are a solid 2px accent outline instead of the design's 35% tint, to meet the 3:1 non-text contrast rule. They are also shown on the filter and destination fields, where the design removed outlines.
- The conflict policy is a radio group styled as the design's segmented control, giving arrow-key navigation for free, plus a one-line hint about the selected policy.
- Added states the static design didn't show: launch-link notice, no CSV yet, loading, CSV errors, server unreachable, *Network path – not checked*, same-name warnings in the basket, per-item *Waiting / Skipped / Failed / Stopped*, a **Stop copying** button, and a warning-coloured summary when something failed.

## Testing

| Layer | Where | Tooling |
| --- | --- | --- |
| Pure logic (CSV, paths, validation, steps) | `src/**/services`, `src/**/utils`, `src/app/*.test.ts` | Vitest |
| Components and user flows | `src/app/App.test.tsx` (rendered in `StrictMode`) | React Testing Library, user-event, fake `fetch` |
| Accessibility | inside the flow tests | axe-core (colour contrast is checked against tokens by hand) |
| Server logic | `server/services/*.test.ts` | Vitest with real temporary folders and junctions; Windows-only cases run on Windows |
| HTTP and security behaviour | `server/app.test.ts` | Raw `node:http` requests (to control Host/Origin headers) |

Vitest runs two projects: `web` (jsdom) and `server` (node). See `vite.config.ts`.

## Adding a feature

1. Add request and response schemas to `shared/api.ts` if the server is involved.
2. Put the server logic in `server/services/` and expose it in `server/routes/api.ts`.
3. Create `src/features/<name>/` with `services/` (API calls, pure functions), `hooks/` (state) and `components/` (presentation).
4. Wire cross-feature rules in `useFileShuttle.ts` and place the component in `App.tsx`.
