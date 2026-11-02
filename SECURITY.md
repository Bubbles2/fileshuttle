# Security

FileShuttle copies files on your computer, so its local API is powerful by design. This document describes who it trusts, how it is protected, what an independent review found, and what remains your responsibility.

## Threat model

| Actor | Trusted? | How FileShuttle handles it |
| --- | --- | --- |
| You, using FileShuttle on this computer | Yes | No new privileges: FileShuttle can only reach what your account can. |
| Other websites open in your browser | **No** | Same-origin, Fetch Metadata and per-launch key checks stop them from driving the API (CSRF) or reaching it via DNS rebinding. |
| Other programs and other signed-in users on the same machine | **No** | They can reach `127.0.0.1`, but can't call the API without the per-launch key, which is only printed in your terminal. |
| Other machines on the network | **No** | The server never listens on a network interface. |
| The CSV file | **No** | Treated as untrusted: parsed, size-limited, validated, rendered as text only, and it can't make FileShuttle contact network hosts. |

## Controls

### Access
- **Loopback only.** The server binds to `127.0.0.1` (`server/index.ts`).
- **Optional API key (`--require-key`).** Off by default. When on, the server creates a 256-bit random key on first start and prints and opens a launch link, `http://localhost:3000/#key=…`. The key is saved in the user's own profile (`%APPDATA%\FileShuttle\api-key`, or `~/.config/fileshuttle/api-key` with mode 600) and reused on later starts; `--new-key` replaces it. The browser keeps the key in `localStorage`, which is scoped to that exact origin, and sends it in an `X-FileShuttle-Key` header. On page load the app checks `/api/health` and explains straight away if a required key is missing or outdated.
- **Avoids admin rights.** FileShuttle exits if it runs as Administrator (Windows integrity level High/System) or root and the user could have avoided it, unless started with `--allow-elevated` (`server/services/elevation.ts`). On Windows PCs where UAC is turned off (`EnableLUA = 0`), every program runs elevated and there is no alternative, so it starts with a warning instead. If the UAC setting can't be read, UAC is assumed on. The Windows tools used for this check (`whoami.exe`, `reg.exe`) are run from `System32` by full path, so nothing earlier on `PATH` can impersonate them.

### Browser-based attacks
- **DNS rebinding:** a Host header allowlist (`localhost`, `127.0.0.1`, `[::1]` on the configured port); anything else gets `421`.
- **Fetch Metadata on every route:** requests marked `Sec-Fetch-Site: cross-site` or `same-site` (other localhost ports count as same-site) are refused unless they are top-level navigations. That blocks `<img>`, `<script>` and `fetch` probes, including Vite dev endpoints.
- **CSRF on the API:** the `Origin` must equal `http://<Host>` and is mandatory on `POST`; bodies must be `application/json`. The server sends no CORS headers, so cross-origin preflights fail. The API key adds a second, independent barrier.
- **Dev server:** Vite runs with `cors: false`, and its `/__open-in-editor` endpoint is blocked.

### File-system safety
- **Network paths off by default.** UNC paths (`\\host\share`, `//host/share`, `\\?\UNC\…`) are neither inspected nor copied unless FileShuttle is started with `--allow-network-paths`. Touching them would make Windows authenticate to that host with your NTLM credentials. Device paths (`\\.\…`, `\\?\GLOBALROOT…`) and drive-relative paths (`\Windows`, `C:folder`) are always refused (`server/services/pathRules.ts`).
- **Safe destination names.** Windows reserved names (`CON`, `NUL`, `COM1`…), names ending in a dot or space, and `<>:"|?*` are refused, because long-path APIs can create folders Explorer can't delete. The browser applies the same rules for early feedback.
- **No self-copies.** A folder can't be copied into itself, either by path or through junctions, symlinks or `subst`/mapped drives: real paths are compared before anything is created. Copies are also capped at 64 folder levels as a last line of defence against loops.
- **Policies:** *Skip* (default) and *Keep both* never overwrite. *Overwrite* replaces files but never deletes, and won't replace a file with a folder or the other way round. Whole drives can't be copied. Symlinks inside folders are copied as links, not followed.
- **One copy at a time.** The server refuses concurrent copies (`409`), so batches never race each other.
- **Guides.** `POST /api/guides` accepts only the names `claude` or `agents` and reads one of two fixed files configured on the server (`GUIDE_FILES`, in the project's `Doc_Spec_Claude_Agents` folder), up to 2 MB. The browser can never send a path. Markdown is rendered by `react-markdown` as React elements: embedded HTML is ignored and link URLs are sanitised, so a guide can't inject script.
- **Folder picker and CSV browser.** `POST /api/folders` lists folder *names*, plus `.csv` file names when asked (`files: 'csv'`, the only file type accepted), never other files or any contents, behind the same key, origin and schema checks as the rest of the API. It applies the same path rules (no network paths unless allowed, no device paths), hides Windows system folders such as `$Recycle.Bin`, caps a listing at 1,000 folders (and 1,000 CSV files), and skips drive letters that don't answer within 1.5 s. `start: 'working-folder'` lists the server's own working folder; the browser never learns any other server state. Browsers can't reveal the full path of a folder chosen in their own dialog, or be told where it opens, so this is the only way to offer these pickers.
- **Reading a picked CSV.** `POST /api/csv-file` returns the raw bytes of one file, and only if its name ends in `.csv`, it is a regular file, and it is at most 5 MB (checked before and after reading). The same path rules apply. This lets the API read any `.csv` your account can read, so it relies on the same protections as copying (origin, Fetch Metadata and the optional key); the browser still treats the content as an untrusted CSV.

### Input validation
- **Server:** strict zod schemas (`shared/api.ts`) reject unknown fields and wrong types. Paths are limited to 4,096 characters with no NUL bytes, inspect calls to 500 paths, and the policy to `skip | overwrite | rename`. Bodies over 3 MB get `413`.
- **Browser:** CSV limited to 5 MB and 5,000 rows. Unclosed quotes are reported, not silently merged. Rows are validated with zod: names, categories and list entries are capped at 200 characters and descriptions at 1,000, counts must be whole numbers, and invisible bidirectional-override characters are stripped from text (rows whose central copy contains them are skipped), so a CSV can't disguise a skill or path. Every API response is validated with zod before use.

### Output, errors and headers
- Everything is rendered as React text: no `dangerouslySetInnerHTML`, `eval` or HTML strings.
- Errors become fixed, short messages (`server/services/copyErrors.ts`); stack traces, error codes and OS messages never reach the browser, and only the error type is logged. Express runs in production mode under `npm start`, and a final error handler returns a generic `500`.
- **Production CSP:** `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`. Also sent: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, COOP and CORP `same-origin`, a restrictive `Permissions-Policy`, and `Cache-Control: no-store` on the API. Development mode adds only what Vite needs: inline scripts and styles, and the HMR socket.
- Fonts are self-hosted and no assets are inlined, so the page makes no third-party requests and needs no `data:` sources.

### Secrets and dependencies
- No credentials, API keys or `VITE_*` variables are shipped. The only runtime secret is the optional API key, kept in the user's profile and the browser's storage for this origin.
- Few runtime dependencies: React, Express, zod, lucide-react and two font packages. `npm audit` reports **0 vulnerabilities** (21 Oct 2026). `eslint-plugin-jsx-a11y` was left out because it doesn't support supported ESLint versions; accessibility is checked with axe-core in tests instead.

## Independent review (21 Oct 2026)

A separate security review agent probed a production build. Findings and their status:

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | Medium (High on shared hosts) | No authentication: local programs and other users could forge `Origin` and drive the API | **Mitigated by an opt-in key** (`--require-key`, recommended on shared machines); refuses to run elevated where avoidable; Origin must match Host |
| 2 | Medium | CSV with UNC paths triggers SMB/NTLM authentication to arbitrary hosts and can stall the server | **Fixed:** network and device paths off by default (`--allow-network-paths`) |
| 3 | Low (dev) | Vite `/__open-in-editor` and permissive dev CORS reachable from other local pages | **Fixed:** endpoint blocked, `cors: false`, global Fetch Metadata check |
| 4 | Low | Destinations like `NUL`, `typo.` create folders Explorer can't delete | **Fixed:** server and browser name rules |
| 5 | Low | Folder into itself via junction/subst; `mkdir` before validation | **Fixed:** real-path comparison before `mkdir`, depth cap |
| 6 | Info | Express in development mode under `npm start` | **Fixed:** `env` set to production, generic final error handler |
| – | Info | `data:` in CSP, concurrent copies, bidi characters | **Fixed** |

Effective controls confirmed by the review: loopback bind, Host check, browser CSRF checks, strict schemas, body limits, generic errors, safe static serving, React-only rendering.

## Limitations and residual risks

- **On PCs with UAC turned off, FileShuttle has administrator rights.** Windows won't stop a copy into system folders, so a wrong destination with *Overwrite* could replace system files. Turning UAC back on (an IT decision) restores that safety net.
- **Your account's permissions apply.** FileShuttle can read and write anything your account can.
- **Without `--require-key`, any program or other user on this machine can use the API** (browse folders and copy files with your account's rights). That is acceptable on a single-user PC, where such programs already run as you; on shared or multi-user machines, always start with `--require-key`, and don't share the launch link.
- **Programs running as you** (or with admin rights) can read your terminal or browser storage and are out of scope; that's true of any local tool.
- **Overwrite is destructive.** There is no undo or backup. *Skip* is the default.
- **Stopping is best-effort.** *Stop copying* stops the batch, but the item already in progress finishes on the server and may end up partly copied. Closing the browser tab doesn't stop an item already in progress.
- **Folders with links:** symlinks and junctions inside a copied folder are recreated as links, and this can fail with "Permission denied" on Windows.
- **Development mode is weaker:** `npm run dev` allows inline scripts for hot reload and serves project files through Vite. Use `npm run build && npm start` for real work.
- **`--allow-network-paths`** brings back NTLM exposure for any host named in a CSV. Only use it with CSVs you wrote yourself, ideally with the Windows policy *Network security: Restrict NTLM: Outgoing NTLM traffic to remote servers* configured.

## Deployment requirements

FileShuttle is a **personal, local tool** and must not be exposed on a network or the internet.

- Do **not** change the bind address from `127.0.0.1`, or put it behind a reverse proxy, tunnel or port forward. Serving it remotely would need real user authentication, authorisation (an allowlist of source and destination roots), HTTPS, rate limiting and audit logging, none of which this version has.
- HTTPS isn't needed while traffic stays on the loopback interface; it becomes mandatory if that ever changes.
- Run it under a normal user account, never elevated, and stop it when you're done.
- Keep Node.js and dependencies up to date (`npm audit`, `npm outdated`).
