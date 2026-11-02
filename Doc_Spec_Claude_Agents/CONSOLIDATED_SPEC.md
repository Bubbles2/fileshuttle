# Consolidated specification

Consolidated on 21 October 2026 from 14 source files under `C:/AI_Donncha`.

## How to use this document

Requirements are grouped by application. The first distinct source in each group is reproduced as the baseline. Later sources contribute only text not already included; their section headings retain the original context. Exact duplicate files are listed together. Repeated prose blocks, list items, and complete code blocks are included once. Similar wording with distinct details is retained to avoid losing requirements.

Source-specific alternatives remain alternatives: this document does not choose between conflicting architectures, styling systems, or implementation status. Paths inside code examples remain relative to their original project. Markdown file links are resolved relative to the source location.

## Source inventory

| Application | Source file | Content group |
| --- | --- | --- |
| TinyNotes | [AgentSkill/MAX_agent_skill/SPEC.MD](AgentSkill/MAX_agent_skill/SPEC.MD) | TinyNotes / 1 |
| TinyNotes | [codex/finished-codex-project/SPEC.MD](codex/finished-codex-project/SPEC.MD) | TinyNotes / 1 |
| TinyNotes | [finished-project-claude/SPEC.MD](finished-project-claude/SPEC.MD) | TinyNotes / 2 |
| JDE Demo ERP | [codex/jde/improvements/SPEC.md](codex/jde/improvements/SPEC.md) | JDE Demo ERP / 1 |
| JDE Demo ERP | [codex/jde/SPEC.md](codex/jde/SPEC.md) | JDE Demo ERP / 2 |
| Stock Management | [codex/StockApp/SPEC.md](codex/StockApp/SPEC.md) | Stock Management / 1 |
| ARCADE-GED | [testClaude/arcade-ged/SPEC.md](testClaude/arcade-ged/SPEC.md) | ARCADE-GED / 1 |
| ARCADE-GED | [testClaude/arcade-ged-prompted_experiment/SPEC.md](testClaude/arcade-ged-prompted_experiment/SPEC.md) | ARCADE-GED / 1 |
| ARCADE-GED | [testClaude/old-non-git-arcade-ged-V1/SPEC.md](testClaude/old-non-git-arcade-ged-V1/SPEC.md) | ARCADE-GED / 1 |
| ARCADE-GED | [testClaude/ArcMob/SPEC.md](testClaude/ArcMob/SPEC.md) | ARCADE-GED / 2 |
| ARCADE-GED | [testClaude/oldstuff/MobArc_Lp/SPEC.md](testClaude/oldstuff/MobArc_Lp/SPEC.md) | ARCADE-GED / 2 |
| ARCADE-GED | [testClaude/ArcMobWord/SPEC.md](testClaude/ArcMobWord/SPEC.md) | ARCADE-GED / 3 |
| ARCADE-GED | [testClaude/ArcMobWord/.claude/worktrees/vigilant-hermann-2b897b/SPEC.md](testClaude/ArcMobWord/.claude/worktrees/vigilant-hermann-2b897b/SPEC.md) | ARCADE-GED / 4 |
| ARCADE-GED | [testClaude/oldstuff/MobArc_Lp/.claude/worktrees/vigilant-hermann-2b897b/SPEC.md](testClaude/oldstuff/MobArc_Lp/.claude/worktrees/vigilant-hermann-2b897b/SPEC.md) | ARCADE-GED / 4 |

## TinyNotes

### Baseline — source group 1

Applies to: [AgentSkill/MAX_agent_skill/SPEC.MD](AgentSkill/MAX_agent_skill/SPEC.MD), [codex/finished-codex-project/SPEC.MD](codex/finished-codex-project/SPEC.MD).

#### Features

* Email+password authentication (better-auth).
* Authenticated users can create, view, edit, delete notes.
* Notes can be shared publicly via an unguessable link token.
* Share link can be disabled (revoked) by the note owner.
* Unauthenticated users can view shared notes via `/s/[token]`.

#### Constraints

* Bun runtime, TypeScript, Next.js **App Router**, TailwindCSS.
* Rich text via TipTap. Stored as **TipTap JSON**; rendered as **sanitized HTML** for display.
* SQLite via **Bun’s built-in SQLite client**.
* No file storage, no images in notes.
* Raw SQL only (no ORM); custom migrations script.
* No password reset, no email confirmation, no outbound email sending.
* Minimal but **proper error handling** (no sensitive detail leakage).
* Custom **404 page**.
* Styling: “elegant acqua colors”.

#### Rendering and data access

* Use Next.js App Router.
* Use **React Server Components** for all note data reads.
* Use **Server Functions (Server Actions)** for all note mutations.
* Do not use client-side data fetching for initial note/page data (`useEffect() + fetch()` etc.).
* Client Components only for TipTap editor UI and minimal interactivity.

#### Auth

* better-auth for:

* Register / login via credentials (email+password).
  * Session management via secure cookie (httpOnly).
* App authorization:

* Only owners can read/write their notes on authenticated routes.
  * Public shared route checks token and share status.

#### Notes content pipeline

* Store:

* `content_json` (TipTap JSON string).
* Render:

* TipTap JSON → HTML on server.
  * **Sanitize** HTML (strict allowlist) before returning/serving to clients (especially public share view).

#### Public

* `GET /` → if authenticated redirect to `/notes`, else redirect to `/login`.
* `GET /login` → login form.
* `GET /register` → registration form.
* `GET /s/[token]` → public shared note view (sanitized HTML).

#### Authenticated

* `GET /notes` → list user’s notes (sorted by `updated_at DESC`).
* `GET /notes/new` → create note page (editor).
* `GET /notes/[id]` → view/edit note page (editor + share controls).

#### Not found

* `app/not-found.tsx` custom 404 for missing pages/resources.

#### 3) Server Functions (Server Actions)

Mutations are implemented as Server Actions invoked from forms and client interactions. Reads are done in Server Components by directly calling server-side data-access functions.

#### Auth integration

* Use better-auth’s Next integration routes as required by the library. Only credential provider enabled.

#### Notes actions (authenticated; require session)

* `createNoteAction(input: { title?: string; contentJson: object })`
* `updateNoteAction(input: { id: string; title?: string; contentJson?: object })`
* `deleteNoteAction(input: { id: string })`

All actions return typed result objects (success/error) and must not leak SQL/internal details in user-facing messages.

#### Share actions (authenticated; require session)

* `enableShareAction(input: { id: string })` -> `{ shareUrl, token, shareEnabled: true }`
* `disableShareAction(input: { id: string })` -> `{ shareEnabled: false }`

#### Public shared note read

* `/s/[token]` Server Component resolves token server-side and renders sanitized HTML.
* Invalid/disabled token or missing note must resolve to the same **404** behavior.

#### General conventions

* Use `TEXT` for IDs/tokens (UUID strings).
* Use `INTEGER` for booleans (0/1).
* Use `TEXT` ISO timestamps (UTC) or SQLite `strftime`-generated strings; choose one consistently. Recommended: `TEXT` ISO8601 UTC.

#### `user`

* `id TEXT PRIMARY KEY`
* `name TEXT NOT NULL`
* `email TEXT NOT NULL UNIQUE`
* `emailVerified INTEGER NOT NULL DEFAULT 0`
* `image TEXT NULL`
* `createdAt TEXT NOT NULL`
* `updatedAt TEXT NOT NULL`

#### `session`

* `userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`
* `token TEXT NOT NULL UNIQUE`
* `expiresAt TEXT NOT NULL`
* `ipAddress TEXT NULL`
* `userAgent TEXT NULL`
* Index: `CREATE INDEX idx_session_userId ON session(userId);`

#### `account`

* `accountId TEXT NOT NULL`
* `providerId TEXT NOT NULL`
* `accessToken TEXT NULL`
* `refreshToken TEXT NULL`
* `accessTokenExpiresAt TEXT NULL`
* `refreshTokenExpiresAt TEXT NULL`
* `scope TEXT NULL`
* `idToken TEXT NULL`
* `password TEXT NULL`
* Unique constraint for credentials:

* `UNIQUE(providerId, accountId)`
* Index: `CREATE INDEX idx_account_userId ON account(userId);`

#### `verification`

* `identifier TEXT NOT NULL`
* `value TEXT NOT NULL`
* Index: `CREATE INDEX idx_verification_identifier ON verification(identifier);`

#### `note`

* `user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`
* `title TEXT NOT NULL DEFAULT ''`
* `content_json TEXT NOT NULL` (serialized TipTap JSON)
* `share_enabled INTEGER NOT NULL DEFAULT 0`
* `created_at TEXT NOT NULL`
* `updated_at TEXT NOT NULL`
* Indexes:

* `CREATE INDEX idx_note_user_updated ON note(user_id, updated_at DESC);`

#### `note_share`

Purpose: store public tokens separately, allow disable without deleting.

* `note_id TEXT NOT NULL REFERENCES note(id) ON DELETE CASCADE`
* `token_hash TEXT NOT NULL UNIQUE` (hash of token)
* `enabled INTEGER NOT NULL DEFAULT 1`
* `disabled_at TEXT NULL`
* Constraints:

* One active share per note (enforced via query logic; SQLite partial unique index optional).
* Index:

* `CREATE INDEX idx_note_share_note ON note_share(note_id);`

#### `schema_migrations`

* `version TEXT PRIMARY KEY`
* `applied_at TEXT NOT NULL`

#### Token hashing

* Generate token: 32 random bytes → base64url (no padding) or hex.
* Store `token_hash = SHA-256(token)` hex/base64.
* On lookup: hash incoming token and match.

#### Notes

**List notes**

```sql
SELECT id, title, share_enabled, created_at, updated_at
FROM note
WHERE user_id = ?
ORDER BY updated_at DESC;
```

**Create note**

```sql
INSERT INTO note (id, user_id, title, content_json, share_enabled, created_at, updated_at)
VALUES (?, ?, ?, ?, 0, ?, ?);
```

**Get note by id (owner)**

```sql
SELECT id, user_id, title, content_json, share_enabled, created_at, updated_at
FROM note
WHERE id = ? AND user_id = ?;
```

**Update note (autosave)**

```sql
UPDATE note
SET title = COALESCE(?, title),
    content_json = COALESCE(?, content_json),
    updated_at = ?
WHERE id = ? AND user_id = ?;
```

**Delete note**

```sql
DELETE FROM note
WHERE id = ? AND user_id = ?;
```

#### Sharing

**Enable share (create or re-enable)**

* Step 1: ensure note belongs to user.
* Step 2: find existing share row for note.

```sql
SELECT id, token_hash, enabled
FROM note_share
WHERE note_id = ?
ORDER BY created_at DESC
LIMIT 1;
```

* If none exists: insert.

```sql
INSERT INTO note_share (id, note_id, token_hash, enabled, created_at, disabled_at)
VALUES (?, ?, ?, 1, ?, NULL);
```

* If exists: re-enable.

```sql
UPDATE note_share
SET enabled = 1,
    disabled_at = NULL
WHERE id = ?;
```

* Update note flag:

```sql
UPDATE note SET share_enabled = 1, updated_at = ? WHERE id = ? AND user_id = ?;
```

**Disable share**

```sql
UPDATE note_share
SET enabled = 0,
    disabled_at = ?
WHERE note_id = ?;
```

```sql
UPDATE note SET share_enabled = 0, updated_at = ? WHERE id = ? AND user_id = ?;
```

**Public fetch by token**

```sql
SELECT n.title, n.content_json, n.updated_at
FROM note_share s
JOIN note n ON n.id = s.note_id
WHERE s.token_hash = ?
  AND s.enabled = 1
  AND n.share_enabled = 1
LIMIT 1;
```

* If no row: return 404.

#### Allowed features (default)

* TipTap `StarterKit`
* Links extension:

* allow only `http`/`https`
  * `rel="noopener noreferrer"` and open in new tab

#### Content storage

* Client sends TipTap JSON object.
* Server validates:

* JSON parseable
  * size <= **256KB** serialized

#### HTML rendering

* On server: TipTap JSON → HTML.
* Sanitize using strict allowlist (minimum):

* tags: `p, br, strong, em, u, s, a, h1, h2, h3, ul, ol, li, blockquote, pre, code`
  * attributes: `a[href,target,rel]`
  * protocols: `http`, `https`
* Public `/s/[token]` must only ever serve sanitized HTML.

#### Client

* On editor changes, debounce (e.g. 800–1200ms) and invoke `updateNoteAction`.
* Track “saving / saved / error” UI state.
* Avoid save storms:

* do not send if content unchanged (compare serialized JSON hash).
  * cancel pending request on navigation/unmount if possible.

#### Server

* Accept partial updates; update `updated_at`.
* Enforce payload size and ownership.
* Return updated timestamps and share state.

#### Error contract

* Server Actions should return:

* `{ error: { code: string, message: string } }`
* `message` must be generic; no SQL details.
* Log full details server-side only (console is sufficient for demo).

Suggested `code` values:

* `UNAUTHORIZED` (401)
* `FORBIDDEN` (403)
* `NOT_FOUND` (404)
* `VALIDATION_ERROR` (400)
* `CONFLICT` (409)
* `RATE_LIMITED` (429, optional)
* `INTERNAL_ERROR` (500)

#### Not leaking sensitive info

* Public shared note resolution always returns 404 for:

* invalid token
  * disabled share
  * missing note
* Auth endpoints return generic invalid-credentials errors.

#### Security headers (minimum)

* `Content-Security-Policy` with current app policy:

* `default-src 'self'`
  * `base-uri 'self'`
  * `form-action 'self'`
  * `frame-ancestors 'none'`
  * `object-src 'none'`
  * `script-src 'self' 'unsafe-inline'` and additionally `'unsafe-eval'` in development
  * `style-src 'self' 'unsafe-inline'`
  * `img-src 'self' data: blob:`
  * `font-src 'self' data:`
  * `connect-src 'self'` and additionally `ws: wss:` in development for HMR
  * `frame-src 'none'`
  * `upgrade-insecure-requests` in production only
* `Referrer-Policy: no-referrer`
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY` (or CSP frame-ancestors)
* `Permissions-Policy` minimal

#### CSRF

* Rely on better-auth guidance for cookie sessions; ensure Server Actions require a valid session and use same-site cookies.

#### Theme

* Add a small acqua palette via CSS variables (e.g. `--acc-1`, `--acc-2`) and map to Tailwind using `theme.extend.colors`.
* Use neutral background + acqua accents:

* Buttons, links, focus rings, subtle gradients.
* Consistent components:

* App shell, card, button, input, toast/banner for save/errors.

#### Required pages UI states

* Loading states for note fetch and share fetch.
* Empty list state for `/notes`.
* Inline validation messages (generic).

#### Folder layout

* `migrations/0001_init.sql`, `0002_notes.sql`, etc.
* `scripts/migrate.ts`:

* Ensures `schema_migrations` exists.
  * Reads migration files sorted by filename.
  * Applies each within a transaction.
  * Records applied version (filename) with timestamp.
  * On failure: rollback and exit non-zero.

#### Migration content

* 0001: better-auth tables + indexes.
* 0002: `note`, `note_share`, indexes.

#### 11) Environment variables

* `DB_PATH=./data/tinynotes.db`
* `AUTH_SECRET=...` (better-auth)
* `APP_URL=http://localhost:3000` (for share URL construction)
* Optional: `NODE_ENV`, `LOG_LEVEL`

#### 12) Acceptance criteria (minimal)

1. Register + login works; session persists via cookie.
2. Auth user can create/edit/delete note; autosave reliably persists.
3. `/notes` shows notes sorted by last updated.
4. Enable share returns a link; `/s/[token]` shows sanitized rendered content without auth.
5. Disable share makes `/s/[token]` return 404.
6. Unauthorized access to `/notes/*` redirects to `/login`.
7. Custom 404 page shown for missing routes/resources.
8. Errors shown to user are generic; server logs contain details.

### Additional requirements and version differences — source group 2

Applies to: [finished-project-claude/SPEC.MD](finished-project-claude/SPEC.MD).

#### 1. Overview

A web application where authenticated users can create, view, edit, delete, and publicly share rich-text notes. Notes are created with TipTap, stored as JSON in a SQLite database, and rendered in the browser with formatting.

#### Core Features

- User authentication (sign up, login, logout) via better-auth
- Authenticated note management (CRUD)
- Rich text editor using TipTap with:
  - Bold, Italic
  - Heading levels (H1–H3) + normal text
  - Inline code + code blocks
  - Bullet lists
  - Horizontal rules
- Public sharing of notes via a public URL (toggle on/off)

#### Tech

- Next.js (App Router) + Bun runtime
- TypeScript
- TailwindCSS
- SQLite via Bun's SQLite client with raw SQL

#### 2.1 High-Level Architecture

- **Frontend & Backend:** Next.js (App Router)
  - Server components for data fetching
  - Client components for TipTap editor and interactive UI
  - Route Handlers (`app/api/.../route.ts`) for JSON APIs
- **Runtime:** Bun (for dev & production)
- **Database:** Single SQLite file (e.g., `data/app.db`) accessed via Bun's SQLite client
- **Auth:** better-auth integrated into Next.js (middleware + server helpers)

#### 2.2 Application Layers

**Presentation layer**
- Next.js pages and components
- TailwindCSS for styling
- TipTap editor component

**API layer**
- REST-like JSON endpoints for notes CRUD & sharing

**Data access layer**
- Raw SQL queries executed via Bun's SQLite client
- A small helper module for DB access

#### 3.1 Authentication

Users can:
- Register (email + password, minimum validation)
- Log in / log out

Authentication state is accessible on server (for SSR) and on client (for protected UI).

Unauthenticated users:
- Can access public shared note URLs (read-only)
- Cannot access dashboard or personal notes

#### 3.2 Notes Management (Authenticated)

**Create a new note:**
- Default title: "Untitled note"
- Default empty TipTap document

**View a list of own notes:**
- Show title, last updated at, shared status

**View a single note:**
- Load editor with stored TipTap JSON document

**Update note:**
- Change title
- Change content (TipTap JSON)
- Auto-update `updated_at`

**Delete note:**
- Hard delete

#### 3.3 Note Sharing

Users can toggle note "public sharing":

**When enabled:**
- Note gets a unique public slug (e.g. `abcdef1234`)
- Accessible via `/p/{slug}` for anonymous users

**When disabled:**
- Public URL returns 404 / "Note not found"

**Public page rendering:**
- Reads note from DB by `public_slug`
- Shows title and content in read-only mode
- No editing or owner information necessary

#### 4. Non-Functional Requirements

**Performance**
- Notes list & note view should load under ~300 ms for typical DB sizes

**Security**
- All note operations are scoped to authenticated user's `user_id`
- Public notes are read-only; no leaked private data in API responses

**Reliability**
- Graceful handling of DB errors

**Maintainability**
- Type-safe APIs and DB types
- Modularized DB and auth helpers

**UX**
- Simple, minimal UI with keyboard-friendly editor

#### better-auth Core Tables

better-auth manages its own tables for authentication. The following tables are required by better-auth:

**user**

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique identifier for each user (primary key) |
| name | TEXT | User's chosen display name |
| email | TEXT | User's email address for communication and login |
| emailVerified | INTEGER | Whether the user's email is verified (0 or 1) |
| image | TEXT | User's image URL (optional) |
| createdAt | TEXT | Timestamp of when the user account was created |
| updatedAt | TEXT | Timestamp of the last update to the user's information |

**session**

```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expiresAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique identifier for each session (primary key) |
| userId | TEXT | The ID of the user (foreign key) |
| token | TEXT | The unique session token |
| expiresAt | TEXT | The time when the session expires |
| ipAddress | TEXT | The IP address of the device (optional) |
| userAgent | TEXT | The user agent information of the device (optional) |
| createdAt | TEXT | Timestamp of when the session was created |
| updatedAt | TEXT | Timestamp of when the session was updated |

**account**

```sql
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  idToken TEXT,
  password TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique identifier for each account (primary key) |
| userId | TEXT | The ID of the user (foreign key) |
| accountId | TEXT | The ID of the account as provided by SSO or equal to userId for credential accounts |
| providerId | TEXT | The ID of the provider (e.g., "credential", "google", "github") |
| accessToken | TEXT | The access token returned by the provider (optional) |
| refreshToken | TEXT | The refresh token returned by the provider (optional) |
| accessTokenExpiresAt | TEXT | The time when the access token expires (optional) |
| refreshTokenExpiresAt | TEXT | The time when the refresh token expires (optional) |
| scope | TEXT | The scope of the account returned by the provider (optional) |
| idToken | TEXT | The ID token returned from the provider (optional) |
| password | TEXT | The hashed password for email/password authentication (optional) |
| createdAt | TEXT | Timestamp of when the account was created |
| updatedAt | TEXT | Timestamp of when the account was updated |

**verification**

```sql
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique identifier for each verification (primary key) |
| identifier | TEXT | The identifier for the verification request |
| value | TEXT | The value to be verified |
| expiresAt | TEXT | The time when the verification request expires |
| createdAt | TEXT | Timestamp of when the verification request was created |
| updatedAt | TEXT | Timestamp of when the verification request was updated |

#### notes

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0,
  public_slug TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user(id)
);
```

#### 5.2 Indexes

```sql
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_public_slug ON notes(public_slug);
CREATE INDEX idx_notes_is_public ON notes(is_public);
```

#### 6.1 Database Access Module

**File:** `lib/db.ts`

- Initialize Bun SQLite client with DB file (`app.db`)
- Export helper functions such as:
  - `getDb()` – returns singleton DB connection
  - Utility wrappers for:
    - `query<T>(sql, params?): T[]`
    - `get<T>(sql, params?): T | undefined`
    - `run(sql, params?)`

#### 6.2 Note Repository Functions

**File:** `lib/notes.ts`

**TypeScript types:**

```typescript
export type Note = {
  id: string;
  userId: string;
  title: string;
  contentJson: string; // stringified TipTap doc
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};
```

**Repository functions:**

- `createNote(userId: string, data: { title?: string; contentJson?: string }): Promise<Note>`
- `getNoteById(userId: string, noteId: string): Promise<Note | null>`
- `getNotesByUser(userId: string): Promise<Note[]>`
- `updateNote(userId: string, noteId: string, data: Partial<{ title: string; contentJson: string }>): Promise<Note | null>`
- `deleteNote(userId: string, noteId: string): Promise<void>`
- `setNotePublic(userId: string, noteId: string, isPublic: boolean): Promise<Note | null>`
- `getNoteByPublicSlug(slug: string): Promise<Note | null>`

Each function enforces `user_id = ?` in SQL where applicable, to avoid cross-user access.

#### 7. API Design (Next.js Route Handlers)

Base path under `/api/notes`.

#### 7.1 Authentication Access

Implement a server helper from better-auth like `getCurrentUser()` or `getSession()`.

All `/api/notes` handlers (except public read) must:
- Check auth
- Return 401 if not authenticated

#### GET /api/notes

**Description:** List notes for current user.

**Response 200:**
```json
[
  {
    "id": "note-id",
    "title": "My Note",
    "isPublic": true,
    "updatedAt": "2025-01-01T12:00:00Z"
  }
]
```

Optionally omit `contentJson` for list for performance.

#### POST /api/notes

**Description:** Create a new note.

**Request body (JSON):**
```json
{
  "title": "Optional title",
  "contentJson": { "type": "doc", ... }
}
```

**Behavior:**
- Default title = "Untitled note" if missing
- Default `contentJson` = empty TipTap document if missing

**Response 201:** created Note (or minimal subset)

#### GET /api/notes/:id

**Description:** Get single note owned by current user.

**Response:**
- 200 with full note including `contentJson`
- 404 if not found or not owned by user

#### PUT /api/notes/:id

**Description:** Update note title/content.

**Request body:**
```json
{
  "title": "New title",
  "contentJson": { ... }
}
```

**Response:**
- 200 with updated note
- 404 if not found

#### DELETE /api/notes/:id

**Description:** Delete note.

**Response:**
- 204 on success
- 404 if not found

#### POST /api/notes/:id/share

**Description:** Toggle public sharing.

**Request body:**
```json
{
  "isPublic": true
}
```

**Behavior:**
- If `isPublic = true` and note has no `public_slug`, generate new slug (`nanoid()`)
- If `isPublic = false`, set `is_public = 0` and `public_slug = NULL`

**Response 200:**
```json
{
  "id": "note-id",
  "isPublic": true,
  "publicSlug": "abcdef1234"
}
```

#### GET /api/public-notes/:slug

**Description:** Read-only access to public notes.

**Response 200:**
```json
{
  "title": "Public note",
  "contentJson": { ... }
}
```

- 404 if slug not found or `is_public = 0`

(Or skip this API and just resolve directly in the `/p/[slug]` route using server components.)

#### 8.1 Routes

Assuming Next.js App Router structure:

- `/` – Landing page
  - Marketing / "Log in / Sign up" CTA
- `/dashboard` – Authenticated area
  - List of user notes
  - "Create note" button
- `/notes/[id]` – Authenticated note editor page
  - TipTap editor
  - Title field
  - Share toggle
  - Delete button
- `/p/[slug]` – Public note page
  - Read-only content
  - No nav to user-specific area if viewer is unauthenticated

#### 8.2 Layout & Navigation

- Global layout: `app/layout.tsx`
  - Header with app name, login/logout/account & theme
- `app/(auth)/login`, `app/(auth)/register` (if better-auth doesn't provide their own UI)

#### 8.3 Components

**components/NoteList.tsx**
- Props: `notes: { id, title, updatedAt, isPublic }[]`
- Renders list with links to `/notes/[id]`

**components/NoteEditor.tsx**
- TipTap-based editor
- Controlled by parent (`onChange` updates state, eventual API call)

**components/ShareToggle.tsx**
- Switch/checkbox for `isPublic`
- Shows public URL when enabled

**components/DeleteNoteButton.tsx**
- Confirms and calls DELETE API

**components/PublicNoteViewer.tsx**
- Render TipTap content in read-only mode (or use `EditorContent` with `editable: false`)

#### 9.1 Extensions

Enable at minimum:
- `StarterKit` (with paragraphs, headings, bold, italic, bullet lists, horizontal rule, etc.)
- `Code` (inline code)
- `CodeBlockLowlight` or `CodeBlock` (for code snippets)

**Example editor config:**

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Code,
    CodeBlock
  ],
  content: initialContentJson,  // TipTap JSON
  onUpdate: ({ editor }) => {
    const json = editor.getJSON();
    onChange(json);
  },
});
```

Content is always stored in DB as `JSON.stringify(json)`; when loading, `JSON.parse` and pass as `content`.

#### 9.2 Toolbar

Buttons:
- Bold, Italic
- H1, H2, H3, paragraph
- Bullet list
- Inline code
- Code block
- Horizontal rule

Each button calls the relevant TipTap chain: `editor.chain().focus().toggleBold().run()` etc.

#### 10. Styling (TailwindCSS)

- Configure Tailwind in `tailwind.config.ts`
- Use a minimal design:
  - Neutral background, card-like note container
  - Utility classes on components
- Consider a prose style for read-only content (using `@tailwindcss/typography`)

#### 11. Security Considerations

**Auth enforcement**
- All `/dashboard` and `/notes/[id]` routes check auth on server
- API routes verify user and attach `userId` from session

**Authorization**
- Every note query in the auth context filters by `user_id`

**Public notes**
- Slug should be sufficiently random to prevent guessing (e.g. 16+ chars)

**XSS**
- Primary data is TipTap JSON, not raw HTML
- When rendering to HTML, only use TipTap's rendering (no arbitrary `dangerouslySetInnerHTML` with unsanitized data)

**Rate limiting (optional enhancement)**
- Apply per-IP or per-user rate limiting to API routes if exposed publicly

#### 12. Development Workflow

1. Initialize Next.js app with Bun & TypeScript
2. Set up TailwindCSS
3. Integrate better-auth and session handling
4. Implement SQLite DB initialization and migrations (e.g. via a `scripts/init-db.ts` or manual `.sql`)
5. Build DB helpers and note repository
6. Implement `/api/notes` and sharing APIs
7. Build dashboard and note editor pages
8. Integrate TipTap editor and toolbar
9. Implement public note pages `/p/[slug]`
10. Add polish (loading states, toast messages, error handling)

## JDE Demo ERP

### Baseline — source group 1

Applies to: [codex/jde/improvements/SPEC.md](codex/jde/improvements/SPEC.md).

#### SPEC.md — JDE Demo ERP

> Canonical contract for the HTTP API and the database access layer.
> When the code disagrees with this file, **the code wins** — but file an issue and update the spec the same day.

#### 1. Overview

JDE Demo ERP is a single-package full-stack application that serves three read-only operational dashboards (Sales, Stock, Purchasing) over a PostgreSQL `jde_demo` schema modelled on Oracle JD Edwards EnterpriseOne tables and views.

```
React 18 SPA  ──/api──►  Express 4 (ESM)  ──Sequelize 6──►  PostgreSQL (jde_demo)
```

#### 1.1 Reference data

A column-by-column map of every table and view (with JDE-style descriptions) is maintained at [`docs/data-dictionary.md`](codex/jde/improvements/docs/data-dictionary.md) (proposed location — currently lives in the project root as `jde_demo_conversion_table.csv/.xls`). Covered objects:

```
f0101    f4101    f4102    f41021   f4111
f4201    f4211    f4301    f4311
v_inventory_available
v_inventory_ledger_with_cost
v_items_below_reorder
v_purchase_order_status
v_sales_order_status
v_supply_demand_by_item_branch
```

#### 2. Non-Functional Requirements

| Category        | Constraint                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Auth**        | None. The app is intended to run on `127.0.0.1` only. Any future deployment requires designing auth from scratch.         |
| **Network**     | Express listens on `127.0.0.1:${API_PORT}` (default 3001). Do **not** bind `0.0.0.0`.                                     |
| **Database**    | Read-only. Connection user must have `SELECT` on `jde_demo.*` and **no** write privileges.                                |
| **Concurrency** | Sequelize pool: max 5, min 0, idle 10 s, acquire 5 s. Each dashboard request runs 5–6 queries in parallel via `Promise.all`. |
| **Payload**     | JSON request body capped at 32 KB (`express.json({ limit: "32kb" })`).                                                    |
| **Errors**      | Generic envelope: `{ "error": "<short user-facing message>" }`. HTTP 4xx for validation, 500 for server errors.           |
| **Caching**     | None on the server. Client-side caching via RTK Query.                                                                    |
| **Pagination**  | Not implemented. Each "recent / open" panel returns a fixed limit (5–10 rows).                                            |
| **CORS**        | Not configured. The Vite dev proxy forwards `/api` → `http://127.0.0.1:3001`. Same-origin in production.                  |
| **SLO**         | Not formalised. Demo data; expected p95 < 200 ms on a local Postgres.                                                     |
| **Logging**     | `console.error` only. No structured logger.                                                                               |

#### 3.1 Environment variables

| Variable        | Required | Default     | Notes                                                                     |
| --------------- | -------- | ----------- | ------------------------------------------------------------------------- |
| `API_PORT`      | no       | `3001`      | Express listen port                                                       |
| `DATABASE_URL`  | no       | —           | If set, takes precedence over discrete PG vars                            |
| `PGHOST`        | yes¹     | —           | Postgres host                                                             |
| `PGPORT`        | yes¹     | `5432`      | Postgres port                                                             |
| `PGDATABASE`    | yes¹     | —           | Database name (e.g. `jde_demo`)                                           |
| `PGUSER`        | yes¹     | —           | Read-only DB user                                                         |
| `PGPASSWORD`    | yes¹     | —           | Password for `PGUSER`                                                     |
| `PGSSL`         | no       | `false`     | When `true`, uses `{require: true, rejectUnauthorized: false}`            |
| `JDE_SCHEMA`    | no       | `jde_demo`  | Schema name. Must match `^[a-zA-Z_][a-zA-Z0-9_]*$` or the app refuses to start a query |

¹ Required when `DATABASE_URL` is **not** set.

#### 3.2 Schema validation invariant

`server/config/schema.js` validates `JDE_SCHEMA` on every call to `getSchemaName()`. Raw SQL must always go through `schemaTable(name)`; never concatenate `JDE_SCHEMA` directly into a query string. Bypassing this is a SQL-injection vector.

#### 4. Server Folder Convention

```
server/api/<domain>/
  <domain>Controller.js     # named exports: index, create, ...
  index.js                  # Express router; imports controller methods
```

- One folder per business domain.
- Controllers use **named ES module exports** (no CommonJS `exports.*`).
- Routers are mounted from `server/api/index.js`.

#### 4.1 Controller template

```js
// server/api/widget/widgetController.js
import { col, fn, getWidgetModels, sequelize } from "../../models/index.js";
import { schemaTable } from "../../config/schema.js";
import { toNumber } from "../../utils/number.js";

export async function index(req, res) {
  try {
    const { Widget } = getWidgetModels();

    const [summary, rows] = await Promise.all([
      sequelize.query(`
        select count(*)::int as widget_count
        from ${schemaTable("v_widget_summary")}
      `),
      Widget.findAll({ raw: true, limit: 10 }),
    ]);

    return res.json({
      summary: { widgetCount: summary[0][0].widget_count },
      widgets: rows.map((row) => ({
        id: row.id,
        amount: toNumber(row.amount),
      })),
    });
  } catch (error) {
    console.error("Widget dashboard failed.", error);
    return res.status(500).json({ error: "Unable to load widget dashboard." });
  }
}
```

#### 4.2 Router template

```js
// server/api/widget/index.js
import express from "express";
import { index } from "./widgetController.js";

const router = new express.Router();

router.get("/", index);
router.get("/dashboard", index);

export default router;
```

Then in `server/api/index.js`:

```js
import widgetRoutes from "./widget/index.js";
router.use("/widget", widgetRoutes);
```

#### 5. Models

Each domain has a model file under `server/models/<domain>.js` exporting `init<Domain>Models(sequelize)`. `server/models/index.js` provides lazy accessors:

```js
import { getInventoryModels, getSalesModels, getPurchaseModels, sequelize } from "./models/index.js";
```

Conventions for every model:

- `schema: getSchemaName()`
- `freezeTableName: true`
- `timestamps: false`
- Compound primary keys for views (no surrogate IDs)
- Associations declared with `constraints: false`

#### 5.1 Decimal handling

`pg` returns Postgres `numeric` as strings. Always coerce with `toNumber(value)` before returning JSON:

```js
import { toNumber } from "../../utils/number.js";

quantityOnHand: toNumber(row.quantity_on_hand);
```

#### 6. API Endpoints

Base URL: `/api`. All endpoints return `application/json`.

#### 6.1 Connection (legacy ad-hoc query)

| Method | Path                      | Handler                                |
| ------ | ------------------------- | -------------------------------------- |
| GET    | `/api/connection/`        | `connection.index` — returns route metadata |
| POST   | `/api/connection/create`  | `connection.create` — runs supplied query |
| POST   | `/api/connection/test`    | alias of `create`                      |
| POST   | `/api/test-connection`    | legacy alias of `create`               |

#### Request body (`POST`)

```json
{
  "host": "localhost",
  "port": 5432,
  "database": "jde_demo",
  "user": "readonly_user",
  "password": "...",
  "ssl": false,
  "query": "select now() as connected_at"
}
```

#### Validation

- `host`, `port`, `database`, `user` are required.
- `query` defaults to `select now() as connected_at;` when missing/blank.
- Allowed grammar: **`^\s*(select|show)\b`** — `WITH` clauses are **not** allowed.
- Single statement only — embedded `;` (other than a trailing one) is rejected.

#### Success response

```json
{
  "ok": true,
  "durationMs": 7,
  "rowCount": 1,
  "rows": [ { "connected_at": "2026-05-08T10:00:00.000Z" } ]
}
```

#### Error responses

```
400 { "error": "Host, port, database, and user are required." }
400 { "error": "Only single-statement read-only SELECT or SHOW queries are allowed." }
500 { "error": "Connection failed." }
```

#### Security

- Uses request-supplied connection details — **does not** use the configured `DATABASE_URL` / PG vars.
- Has **no auth**. Treat the endpoint as localhost-only.

#### 6.2 Inventory

| Method | Path                          | Handler             |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/inventory/`             | `inventory.index`   |
| GET    | `/api/inventory/dashboard`    | `inventory.index`   |
| GET    | `/api/inventory-dashboard`    | legacy alias        |

#### Views consumed

- `v_inventory_available`
- `v_items_below_reorder`
- `v_supply_demand_by_item_branch`
- `v_inventory_ledger_with_cost`

#### Response shape

```ts
{
  summary: {
    stockLines: number;
    itemCount: number;
    branchCount: number;
    quantityOnHand: number;
    availableQuantity: number;
    committedQuantity: number;
  };
  branches: Array<{
    branch: string;
    itemCount: number;
    quantityOnHand: number;
    availableQuantity: number;
  }>;
  lowStock: Array<{                       // limit 8
    item: string;
    description: string;
    branch: string;
    availableQuantity: number;
    reorderPoint: number;
    safetyStock: number;
  }>;
  supplyDemand: Array<{                   // limit 10
    item: string;
    description: string;
    branch: string;
    quantityOnHand: number;
    committedQuantity: number;
    availableQuantity: number;
    openSalesDemand: number;
    openPurchaseSupply: number;
    projectedAvailable: number;
  }>;
  recentMovements: Array<{                // limit 8
    document: number;
    documentType: string;
    transactionDate: string;              // ISO date
    item: string;
    description: string;
    branch: string;
    quantity: number;
    unitOfMeasure: string;
    extendedCost: number;
    explanation: string;
  }>;
}
```

#### 6.3 Sales

| Method | Path                       | Handler        |
| ------ | -------------------------- | -------------- |
| GET    | `/api/sales/`              | `sales.index`  |
| GET    | `/api/sales/dashboard`     | `sales.index`  |
| GET    | `/api/sales-dashboard`     | legacy alias   |

#### Views consumed

- `v_sales_order_status`

#### Response shape

```ts
{
  summary: {
    orderCount: number;
    lineCount: number;
    customerCount: number;
    bookedRevenue: number;
    openQuantity: number;
  };
  branches: Array<{
    branch: string;
    orderCount: number;
    revenue: number;
    openQuantity: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    lineCount: number;
    revenue: number;
  }>;
  topCustomers: Array<{                   // limit 5
    customer: string;
    orderCount: number;
    revenue: number;
    openQuantity: number;
  }>;
  openOrders: Array<{                     // limit 6, only quantity_open > 0
    salesOrder: number;
    customer: string;
    branch: string;
    requestedDate: string;
    itemCode: string;
    openQuantity: number;
    lineAmount: number;
    status: string;
  }>;
  recentOrders: Array<{                   // limit 6
    salesOrder: number;
    customer: string;
    orderDate: string;
    itemCode: string;
    branch: string;
    quantityOrdered: number;
    quantityShipped: number;
    lineAmount: number;
    status: string;
  }>;
}
```

#### 6.4 Purchase

| Method | Path                          | Handler           |
| ------ | ----------------------------- | ----------------- |
| GET    | `/api/purchase/`              | `purchase.index`  |
| GET    | `/api/purchase/dashboard`     | `purchase.index`  |
| GET    | `/api/purchase-dashboard`     | legacy alias      |

#### Views consumed

- `v_purchase_order_status`

#### Response shape

```ts
{
  summary: {
    orderCount: number;
    lineCount: number;
    supplierCount: number;
    committedSpend: number;
    openQuantity: number;
  };
  branches: Array<{
    branch: string;
    orderCount: number;
    spend: number;
    openQuantity: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    lineCount: number;
    spend: number;
  }>;
  topSuppliers: Array<{                   // limit 5
    supplier: string;
    orderCount: number;
    spend: number;
    openQuantity: number;
  }>;
  inboundOrders: Array<{                  // limit 6, only quantity_open > 0
    purchaseOrder: number;
    supplier: string;
    branch: string;
    promisedDate: string;
    itemCode: string;
    openQuantity: number;
    lineAmount: number;
    status: string;
  }>;
  recentOrders: Array<{                   // limit 6
    purchaseOrder: number;
    supplier: string;
    orderDate: string;
    itemCode: string;
    branch: string;
    quantityOrdered: number;
    quantityReceived: number;
    lineAmount: number;
    status: string;
  }>;
}
```

#### 6.5 SPA fallback

`GET *` (after `/api`) serves `dist/index.html`. When `dist/` is missing, the request 404s. Always run `npm run build` before `npm start`.

#### 7. Client Contract

The client TypeScript types in `src/client/features/<domain>/types.ts` are the **mirror image** of §6 response shapes. There is no shared compile-time contract — drift is silent.

When you change a response shape, update **all four** of:

1. Sequelize model — `server/models/<domain>.js`
2. Controller `attributes` and JSON mapping
3. Client TS types — `src/client/features/<domain>/types.ts`
4. Panel components consuming the field — `src/client/components/<domain>-domain/*.tsx`

#### 8. Future / Out of Scope

The following are explicitly **not** part of the current spec:

- Authentication / authorization
- Mutating endpoints (POST/PUT/PATCH/DELETE on data)
- Pagination beyond fixed `LIMIT` clauses
- Migrations or schema management (the schema is owned externally)
- Background jobs, queues, or websockets
- Multi-tenant schema selection per-request
- Internationalisation
- Production deployment topology

When adding any of the above, this spec must be updated first.

### Additional requirements and version differences — source group 2

Applies to: [codex/jde/SPEC.md](codex/jde/SPEC.md).

#### JDE Demo Conversion Table

I created a reusable conversion table CSV here: `jde_demo_conversion_table.csv`

It includes every column from all `jde_demo` tables and views with:

- object name
- object type
- column name
- Postgres data type
- a plain-English suggested description

#### Covered Objects

- `f0101`
- `f4101`
- `f4102`
- `f41021`
- `f4105`
- `f4111`
- `f4201`
- `f4211`
- `f4301`
- `f4311`

#### Notes

- Some descriptions come from existing DB comments.
- The rest are sensible JDE-style interpretations based on standard field prefixes like `IM`, `IB`, `LI`, `SD`, `PD`, `SH`, and `PH`.
- Because this is a simplified demo schema, a few fields like `liqowo`, `liqrop`, `sdnxtr`, and `pdlttr` are best treated as informed mappings rather than guaranteed official JDE definitions.

#### Server API Structure

Mirror the server API folder by organizing routes into domain-based sections.

#### Folder Structure

For each API domain, create a dedicated folder inside `server/api`.

```txt
server/
  api/
    connection/
      connectionController.js
      index.js
    inventory/
      inventoryController.js
      index.js
```

#### Naming Rules

Each API domain folder must contain:

- A controller file named after the folder plus `Controller`, such as `inventory/inventoryController.js`.
- An `index.js` file that creates the Express router and defines that domain's routes.

#### Controller Responsibilities

Controllers export request handlers for domain actions. This project uses ES modules, so controllers use named exports instead of CommonJS `exports.*`.

Example:

```js
export async function index(req, res) {}
export async function create(req, res) {}
```

#### Route Responsibilities

Each domain `index.js` should:

- Create an Express router.
- Import the matching controller methods.
- Define all paths used by the controller.
- Export the router.

```js
import express from "express";
import { index } from "./inventoryController.js";

const router = new express.Router();

router.get("/", index);
router.get("/dashboard", index);

export default router;
```

#### Database

This project uses PostgreSQL through the `pg` package, not Mongoose. Database configuration is loaded from `.env` via `node --env-file=.env`.

Relevant environment variables:

- `API_PORT`
- `DATABASE_URL`
- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`
- `PGSSL`
- `JDE_SCHEMA`

#### Folder

`server/api/connection/`

#### Files

- `connectionController.js`
- `index.js`

#### Routes

| Method | Path                     | Controller Method            |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/api/connection/`       | `index`                      |
| POST   | `/api/connection/create` | `create`                     |
| POST   | `/api/connection/test`   | `create`                     |
| POST   | `/api/test-connection`   | `create` compatibility alias |

#### Controller

- `index`: returns domain route metadata.
- `create`: validates connection details, restricts queries to read-only `SELECT`, `SHOW`, or `WITH`, runs the query, and returns timing plus rows.

#### DB / PostgreSQL

This domain uses the request-supplied PostgreSQL connection details. It does not use a fixed schema or model.

#### Folder

`server/api/inventory/`

#### Files

- `inventoryController.js`

#### Routes

| Method | Path                       | Controller Method           |
| ------ | -------------------------- | --------------------------- |
| GET    | `/api/inventory/`          | `index`                     |
| GET    | `/api/inventory/dashboard` | `index`                     |
| GET    | `/api/inventory-dashboard` | `index` compatibility alias |

#### Controller

- `index`: loads inventory dashboard data from the documented JDE demo views and returns summary KPIs, branch stock, reorder exposure, supply/demand, and recent movements.

#### DB / PostgreSQL

This domain uses these PostgreSQL views from `JDE_SCHEMA`:

## Stock Management

### Baseline — source group 1

Applies to: [codex/StockApp/SPEC.md](codex/StockApp/SPEC.md).

#### Goal

Build a simple stock management application with a React 18 frontend in this
repository and a backend that will later be implemented in Node.js + Express.
The project should follow clear, maintainable patterns and leave room for
future backend integration without overengineering the current MVP.

This application must support multi-warehouse inventory. The core relationship
is:

- A part can exist in multiple warehouses
- Each warehouse has its own stock balance for that part
- Warehouses are first-class entities that can be created and maintained

This document is intended to guide coding agents and contributors working in the
current repository.

#### Current Project State

The repository currently contains:

- React 18
- Vite
- JavaScript + JSX
- Plain CSS
- ESLint flat config

Current npm commands:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Current UI state:

- A light landing page exists as the current entry screen
- The landing page exposes three primary actions:
  - Create a part
  - Create a warehouse
  - Create a stock movement

Current frontend files of interest:

- `src/App.jsx`
- `src/App.css`
- `src/index.css`

#### Product Summary

The application manages inventory for parts stored across one or more
warehouses. Users should be able to:

- View a list of parts
- Add a new part
- Edit an existing part
- Remove a part
- Create and manage warehouses
- View stock balances by warehouse
- Adjust stock quantities per warehouse
- View low-stock items
- Search and filter parts and balances

The first milestone should prioritize a clean, working MVP on the existing
frontend foundation.

#### MVP Features

1. Dashboard / Part List

- Display parts in a table or card-based inventory view
- Show at minimum:
  - Part name
  - SKU / part number
  - Category
  - Unit price
  - Total quantity in stock across all warehouses
  - Low-stock status
  - Last updated date

2. Create Part

- Allow creating a part with:
  - Name
  - Description (optional)
  - Default low-stock threshold

3. Edit Part

- Allow updates to editable part fields
- SKU must remain unique

4. Delete Part

- Allow deleting a part with confirmation

5. Warehouse Management

- Allow creating a warehouse
- Allow editing warehouse details
- Allow deleting or deactivating a warehouse, subject to validation
- Warehouse fields should include at minimum:
  - Code
  - Location fields (optional for MVP)
  - Active/inactive status

6. Warehouse Stock Balances

- A part can have multiple stock balance records, one per warehouse
- Users can create a stock balance entry linking a part to a warehouse
- Users can view balances for a given part
- Users can view balances for a given warehouse
- Duplicate `(part, warehouse)` balance records must be prevented

7. Stock Adjustment by Warehouse

- Users can increase or decrease stock quantity for a specific part in a
  specific warehouse
- Quantity cannot drop below zero
- Each adjustment should update the balance timestamp
- Part total stock must be derived from warehouse balances, not manually stored

8. Search and Filter

- Search by part name or SKU
- Filter by category
- Filter low-stock parts
- Filter by warehouse
- Filter balances by warehouse or part

9. Validation and Error States

- Required fields must be validated
- Numeric fields must reject invalid values
- Duplicate SKU must be prevented
- Empty, loading, and error states should be user-friendly

#### Suggested MVP Frontend Structure

The app should evolve from the current landing page into a small set of focused
views. If client-side navigation is added, use React Router.

Suggested screens:

- Landing page / main menu
- Parts list page
- Part create/edit form page
- Warehouse list page
- Warehouse create/edit form page
- Stock movement or stock adjustment page
- Balance detail view by part or warehouse

Suggested frontend structure:

- `src/components/` for shared UI building blocks
- `src/features/parts/` for part-specific UI and logic
- `src/features/warehouses/` for warehouse-specific UI and logic
- `src/features/stock/` for balances and adjustments
- `src/lib/` for shared helpers, formatters, and validation utilities
- `src/data/` or `src/mocks/` for temporary local data during MVP

This structure is guidance, not a requirement, but new code should avoid
putting all logic into `App.jsx`.

#### Data Model Guidance

The MVP should be designed around these logical entities:

#### Part

- `id`
- `name`
- `sku`
- `category`
- `description`
- `unitPrice`
- `lowStockThreshold`
- `createdAt`
- `updatedAt`

#### Warehouse

- `code`
- `location`
- `isActive`

#### StockBalance

- `partId`
- `warehouseId`
- `quantity`

Rules:

- `sku` must be unique
- `(partId, warehouseId)` must be unique
- Total part stock is the sum of related stock balances
- Low-stock status is derived from total stock compared to threshold

#### Future StockMovement Entity

When stock movement history is introduced, represent adjustments as explicit
records rather than only mutating balances.

Suggested fields:

- `type`
- `reason`

#### Frontend Implementation Guidance

- Keep the UI light-themed unless product requirements change
- Prefer simple, readable React components
- Preserve responsive behavior for desktop and mobile
- Avoid reintroducing the default Vite demo content
- Favor derived data over duplicated state where possible
- Keep forms straightforward and predictable

For the current repo, JavaScript is acceptable and aligned with the existing
setup. TypeScript can be introduced later if the project chooses to migrate.

For forms and validation:

- Controlled React forms are acceptable for the MVP
- React Hook Form is a reasonable option if form complexity grows
- Zod is recommended once shared validation schemas are introduced

For data fetching:

- Use local mock data first if no backend exists yet
- Use `fetch` or a lightweight API layer when backend integration starts
- TanStack Query can be introduced once server state becomes a real concern

#### Backend Direction

The backend is planned, not currently implemented in this repository.

Preferred backend stack:

- Node.js
- Express

Recommended backend structure:

- `routes`
- `controllers`
- `services`
- `repositories`
- `middleware`
- `validators`

Backend expectations:

- Request validation
- Centralized error handling
- Environment-based configuration
- Clear separation between HTTP, business logic, and persistence concerns

#### Data Layer Direction

For the MVP, frontend data may be backed by:

- Mocked local state
- Static mock data files
- A temporary JSON-backed mock service

The architecture should still make later migration easier.

Preferred future persistence:

- PostgreSQL preferred
- MongoDB acceptable if requirements change

If backend scaffolding is added early, persistence should be abstracted behind a
service/repository layer.

#### Future Features

These are explicitly out of scope for the first MVP unless priorities change:

- Authentication and role-based access
- Supplier management
- Purchase and restock history
- Sales / stock-out transaction history
- Full stock movement ledger
- Warehouse transfers
- Reserved stock / available stock tracking
- Barcode scanning
- CSV import/export
- Pagination and server-side filtering
- Audit log
- Dashboard analytics and charts
- Batch adjustments and bulk imports

## ARCADE-GED

### Baseline — source group 1

Applies to: [testClaude/arcade-ged/SPEC.md](testClaude/arcade-ged/SPEC.md), [testClaude/arcade-ged-prompted_experiment/SPEC.md](testClaude/arcade-ged-prompted_experiment/SPEC.md), [testClaude/old-non-git-arcade-ged-V1/SPEC.md](testClaude/old-non-git-arcade-ged-V1/SPEC.md).

#### ARCADE-GED — Application Specification

> **Companion document:** [`CLAUDE.md`](testClaude/arcade-ged/CLAUDE.md) (CloudMD) is the authoritative engineering and architecture guide. CloudMD covers the runtime tree, navigation, providers, the shared `<TopBar />` contract, theme tokens, and the rules for adding screens. This SPEC.md is the **product-level, screen-by-screen** description of what each screen is, what data it shows, what the user can do on it, and how it is styled. Read CloudMD first for the wiring; read this for the surface.

#### 1. Product overview

ARCADE-GED is a French-language document management (GED — _gestion électronique des documents_) mobile app built on Expo. The user signs in, browses libraries of business documents (contracts, ship records, works orders, HR, assets, policies), searches by content, drills into a document to see its indexed fields and attachments, and previews/downloads the attached files (Word, PDF, images).

- **Platform:** Android, iOS, and Web (Expo SDK 54, React Native 0.81, React 19, TypeScript).
- **Primary persona:** internal back-office user at AIRS3 (`adm_airs3`, prefilled in the login form).
- **Backend status:** the real API is not wired in yet. All search results, document records, attachments, and even the sample Word / PDF previews come from [`assets/dummyData.json`](testClaude/arcade-ged/assets/dummyData.json) (see §8).

#### 2. Tech stack snapshot

| Concern              | Choice                                                                |
| -------------------- | --------------------------------------------------------------------- |
| Runtime              | Expo SDK 54, React Native 0.81, React 19                              |
| Language             | TypeScript 5.9                                                        |
| Navigation           | `@react-navigation/native` v7 (native-stack + bottom-tabs)            |
| Local persistence    | `@react-native-async-storage/async-storage` (recent search history)   |
| Styling              | RN `StyleSheet`, design tokens in `src/theme/tokens.ts`               |
| Icons                | `lucide-react-native`                                                 |
| SVG                  | `react-native-svg` (Arcade logo, sparkline, decorative grid)          |
| Document preview     | `react-native-webview` + `mammoth` (Word), `expo-file-system` (PDF/image cache) |
| File I/O             | `expo-file-system`, `expo-sharing`, custom `documentDownload` service |
| HTTP                 | `axios` (services layer; not yet hot-wired)                           |
| Fonts                | Geist + Geist Mono via `@expo-google-fonts/geist*`                    |

Full dependency list and rationale are in [CloudMD → Stack](testClaude/arcade-ged/CLAUDE.md#stack).

#### 3. Navigation map (quick reference)

```
RootStack (native-stack)
├── Login                              (isAuthenticated = false)
└── Main → MainTabs (bottom-tabs)      (isAuthenticated = true)
    ├── HomeTab → HomeStack            { Home, Detail }
    ├── SearchTab → SearchStack        { Search, Results, Detail }
    ├── InboxTab → PlaceholderScreen
    └── ProfileTab → PlaceholderScreen
```

The bottom tab bar hides itself on the `Search` and `Detail` routes (see `HIDE_TAB_BAR_FOR` in `src/navigation/MainTabs.tsx`). Cross-screen state (`results`, `activeDoc`, `isAuthenticated`) lives in `AppStateProvider` and `AuthProvider` — see [CloudMD → Provider tree](testClaude/arcade-ged/CLAUDE.md#provider-tree).

#### 4. Shared TopBar (every screen except Login)

Every screen below the login wall renders the shared `<TopBar />` (`src/components/TopBar.tsx`) immediately under the safe-area inset. It is 56 px tall with a transparent background and provides three slots:

- **Back chevron** (when `onBack` is provided)
- **Brand:** full coloured `<ArcadeLogo />` at 32 px tall (same component as the login hero)
- **`leftSlot`:** flex-grown area after the logo, used by Home (user info), Search (input), and Results (query frame)
- **`rightSlot`:** trailing icon area, used by Home (bell + settings)

Per-screen header configurations are listed inline in §5. The full contract is documented in [CloudMD → Shared TopBar Header](testClaude/arcade-ged/CLAUDE.md#shared-topbar-header).

#### 5.1 LoginScreen — `src/screens/LoginScreen.tsx`

**Purpose.** Authenticate the user. Currently does not call the real auth API — pressing _Se connecter_ calls `useAuth().login()` and the root stack swaps to `Main`.

**Visual structure.**

1. **Hero** — full-bleed teal `LinearGradient` (`#0F2A28 → #0E3530 → #155F5A`) with a faint SVG grid overlay.
   - Top row: `PRODUCTION · AIRS3` environment tag (teal eyebrow type) + ⚙️ settings cog that opens a `SettingsModal`.
   - Body row: large white `<ArcadeLogo height={110} />` + French tagline _"Plateforme de gestion électronique des documents."_
2. **Form card** — white sheet with rounded top corners, lifted over the hero by `marginTop: -24`.
   - Eyebrow `CONNEXION` + headline _"Reprenez votre travail."_
   - Identifier `FloatingInput` (prefilled `adm_airs3`, `User` icon).
   - Password `FloatingInput` (prefilled, `Hash` icon, eye/eye-off toggle).
   - Remember row: checkbox _"Rester connecté"_ + link _"Mot de passe oublié ?"_.
   - Error box (red palette) appears when login fails.
   - Primary teal CTA _"Se connecter"_ with `ArrowUpRight` icon; active-state darkens to `brandTealActive`.
   - "OU" divider, then alt-auth row: _Biométrie_ (`Fingerprint`) and _Code SSO_ (`QrCode`) outlined buttons (UI only).
   - Footer line: `v4.12.0 · build 2026.04 · airs3.digitech.fr` (Geist Mono).

**Header.** None — Login is the only screen without the shared TopBar.

**State.** Local: `user`, `pw`, `showPw`, `pressing`, `staySigned`, `submitting`, `error`, `settingsOpen`. No global state read.

**Wiring notes.** The real call to `fetchStatus(user, pw)` in `src/services/apiService.ts` is commented out — login currently short-circuits straight to `login()`. Re-enabling the real auth is a single block change.

#### 5.2 HomeScreen — `src/screens/HomeScreen.tsx`

**Purpose.** Landing page: shows the signed-in user, surfaces pending work, exposes the document libraries, and lists recent activity.

1. **TopBar** (sole header on the screen — the standalone greeting block has been folded into it):
   - `leftSlot`: `HeaderUserInfo` — circular avatar (teal gradient, initials `DF`) + first name _"Donncha"_.
   - `rightSlot`: `HeaderActions` — `IconBtn` notifications bell with badge `3`, and `IconBtn` settings cog (cog currently calls `logout()` — it's the de-facto sign-out affordance).
2. **Search prompt** (`SearchPrompt`) — white tappable bar with a teal magnifier, placeholder _"Rechercher un document, un ID, un champ…"_, and a `⌘K` kbd pill on the right. Tapping it navigates to `SearchTab`.
3. **Validation alert** (`ValidationAlert`) — amber `warningBg` card: white square icon (`ListChecks`), title _"3 documents à valider"_, subtitle _"Échéance : aujourd'hui · 17h00"_, trailing chevron.
4. **Libraries section** — eyebrow `BIBLIOTHÈQUES` + "Tout voir →" link, then a 3-column tile grid built from `TYPE_TILES`. Each tile is a white card with a coloured `<TypeTile />` icon, a monospaced count, and the localised label from `TYPE_META`.
5. **Recents section** — eyebrow `RÉCENTS`, then white rows for each item in `RECENTS`. Each row is `<TypeTile /> + title + (#id · when) + <StatusDot />`. Tapping resolves the row to a full `DocResult` and navigates to `Detail`.
6. **Activity card** — dark teal `LinearGradient` with grid overlay. Shows eyebrow `ACTIVITÉ — 7 JOURS`, headline `+127 documents archivés`, trend line `+14% vs. semaine précédente`, and a 7-point SVG sparkline rendered inline.

**Data sources.** `RECENTS`, `TYPE_TILES`, and `TYPE_META` — all derived from `dummyData.json` (see §8). The number badge, validation alert copy, and activity stats are currently hardcoded placeholders.

**State.** Local: none. Global: reads `setActiveDoc` from `AppStateProvider`, `logout` from `AuthProvider`.

#### 5.3 SearchScreen — `src/screens/SearchScreen.tsx`

**Purpose.** Capture a free-text query and (optionally) filter by document type, then jump to the results page.

1. **TopBar** (header is the only chrome — the standalone search bar has been folded into it):
   - `onBack` → returns to `HomeTab`.
   - `leftSlot`: `SearchInputFrame` — white pill with teal border, magnifier glyph, `<TextInput autoFocus placeholder="Rechercher…" />`, and an inline X clear chip when there's text.
   - `rightSlot`: square teal submit button with white magnifier (swaps to `ActivityIndicator` while loading).
2. **Body** (ScrollView, `keyboardShouldPersistTaps="handled"`):
   - Eyebrow `FILTRER PAR TYPE` followed by `TypeFilters` — a wrap row of outlined pills (`Pressable` only — does not yet filter; presentational).
   - Eyebrow `RÉCENTES` followed by `RecentSearches` — up to 3 stored queries from AsyncStorage. Each row has a clock icon, the term, and an `ArrowUpRight` glyph. Tapping a row re-runs the search.

**Recent-search persistence.**

- Storage key: `recent_search`.
- Max items: `3`.
- Helpers `getStoredItems`, `saveStringToTop`, `addToTop`, `getUniqueItems` enforce uniqueness and a most-recent-first order.

**Search execution.** `handleSearch` trims the query, persists it, calls `searchDocuments(value)` from `src/services/dummyApiService.ts`, maps results through `toDocResult`, pushes them into `AppStateProvider.results`, and navigates to `Results`.

**State.** Local: `q`, `loading`, `error`, `items`. Global: `setResults`.

#### 5.4 ResultsScreen — `src/screens/ResultsScreen.tsx`

**Purpose.** Show the documents that matched the current query, support pagination, and let the user open any document.

1. **TopBar** (the filter icon previously on the right has been removed):
   - `onBack` → `navigation.goBack()` (returns to Search to edit).
   - `leftSlot`: `QueryDisplay` — white pill with teal border, magnifier, and the current query text (truncated). Tapping the frame returns to Search.
2. **Sub-toolbar** — count line: _"`N` sur `15` résultats"_ (count from `AppStateProvider.results`, total from `PAGE.totalResults`).
3. **Result list** — for each `DocResult`:
   - `<TypeTile />` based on `ctLabel`.
   - Title + sub-row (`#id` · `ctLabel`).
   - **Matched-fields card** (visible when at least one field contains the query) — transparent background with a teal border. Eyebrow `CHAMPS CORRESPONDANTS`, then each matching `key = value` line with the matched substring highlighted in a yellow `mark` style.
   - Footer link _"Consulter →"_.
4. **Empty state** — friendly French message when no results match the query.
5. **Pagination** — page-size dropdown (presentational), left/right chevrons, and a centred page indicator `page / totalPages`.

**Highlighting.** The `Highlight` helper splits each field value on the query (case-insensitive) and wraps matches in the `styles.mark` text style.

**State.** Local: `page`. Global: `results` (read), `setActiveDoc` (called when opening a row).

#### 5.5 DetailScreen — `src/screens/DetailScreen.tsx`

**Purpose.** Show one document's metadata and its attachments. Provides the entry points to the file viewers.

1. **TopBar** with `onBack`. (The previous Share / More-vertical right-slot icons have been removed.)
2. **Hero card** — white rounded card:
   - Top row: `<DocTypePill type={ctLabel} size="lg" />` on the left; bookmark + more icons on the right.
   - Title (Geist SemiBold, 22 px).
   - Meta row: `#id` chip (monospaced) + dot separator + `<StatusDot />`.
3. **Tab bar** with two tabs: _Détails_ and _Attachment_.
4. **Tab content** (16 px padded):
   - **Détails tab.** White card listing every populated field (`key` left, bold `value` right). Empty fields are filtered out by `toDocResult`. If a document has no fields, shows _"Aucun champ renseigné"_.
   - **Attachment tab.** White card; one row per attachment, each row has:
     - A coloured 36 px `AttachmentIcon` badge styled by extension (`fileTypeMeta` from dummyData).
     - The attachment's label (`SemiBold`) and filename (`GeistMono`).
     - A grey square `Download` button on the right.
   - Tapping the badge opens the file in a full-screen modal (Word or Media viewer — §5.6).
   - Tapping the download button writes the sample base64 to disk and triggers the platform share/download flow.
5. **No-document fallback.** Returns `null` if `activeDoc` is unset (shouldn't happen in normal nav flow).

**State.** Local: `tab`. Global: reads `activeDoc` from `AppStateProvider`.

#### 5.6 Document viewers

The viewers are **not** routes — they are full-screen `Modal`s presented from `DetailScreen`'s `AttachTab`. `viewerFor(fileName)` picks one based on file extension.

#### 5.6.1 WordDocumentScreen — `src/screens/WordDocumentScreen.tsx`

- Trigger: `.doc` / `.docx`.
- Loads `SAMPLE_WORD_BASE64` (from `dummyData.worddoc`), passes it to `mammoth.convertToHtml`, and renders the resulting HTML inside a styled `<WebView />`.
- Dark theme (`#080b14` background, `#c8a96e` accent) deliberately distinct from the rest of the app so it reads as a "document canvas".
- Header in-modal: back/close affordance + download button via the shared `documentDownload` service.
- Loading and error states are explicit (`ActivityIndicator`, error text + retry).

#### 5.6.2 MediaDocumentScreen — `src/screens/MediaDocumentScreen.tsx`

- Trigger: any other extension (PDFs and images, in practice).
- Distinguishes `image` (png/jpg/jpeg/gif/webp/bmp), `pdf`, and `unknown` via `getKind(ext)`.
- Image → renders `<Image>` with a base64 data URI.
- PDF → writes the base64 payload to the cache directory (`expo-file-system`) and loads the resulting `file://` URI in a `<WebView />` (WKWebView renders PDFs natively on iOS).
- Same dark canvas theme as the Word viewer.

Both viewers source their base64 from the matching `SAMPLE_*_BASE64` constant in `src/data/sampleBlobs.ts`, which re-exports the strings from `dummyData.json`.

#### 5.7 PlaceholderScreen — `src/screens/PlaceholderScreen.tsx`

A shared "coming soon" surface used for the `InboxTab` (_"À valider — 3 documents en attente de votre validation."_) and `ProfileTab` (_"Profil — Anaïs Berger · adm_airs3"_). Renders the shared TopBar plus a centred title + caption.

#### 6. Styling system

The project uses **pure React Native `StyleSheet`** with a central token file at [`src/theme/tokens.ts`](testClaude/arcade-ged/src/theme/tokens.ts). Screens should not introduce raw hex codes or magic spacing numbers — add a token instead.

#### 6.1 Colour palette (highlights)

| Token                         | Value      | Used for                                       |
| ----------------------------- | ---------- | ---------------------------------------------- |
| `brandTeal`                   | `#1E7D73`  | Primary CTAs, focus borders, brand accents     |
| `brandTealHover` / `Active`   | `#19706A` / `#155F5A` | Pressed-state CTAs                  |
| `brandTealDeep` / `Mid`       | `#0F2A28` / `#0E3530` | Login hero gradient, activity card  |
| `brandCobalt` `Coral` `Green` `Amber` `Red` | accent palette per doc type / status |
| `bgPrimary` / `bgSecondary` / `bgMuted` | `#F8FBFA` / `#FFFFFF` / `#EDF4F3` | App background, cards, chips |
| `borderSubtle` / `borderStrong` | `#DFEDEB` / `#C7DEDC` | Card borders                          |
| `textPrimary` / `Secondary` / `Muted` | `#0F172A` / `#475569` / `#94A3B8` | Type ramp |
| `successBg` `warningBg` `dangerBg` `infoBg` | per-status tinted backgrounds                  |

#### 6.2 Typography

- **Geist** at weights 400 / 500 / 600 / 700 for UI text.
- **Geist Mono** at 400 / 500 / 600 for IDs, codes, and the login footer.
- Type scale (`fontSize`, `lineHeight`, `fontWeight`, `letterSpacing` maps) is exported from the tokens file. Headings tighten letter-spacing (`-0.01em` for h1).

#### 6.3 Surfaces and depth

- Cards use the shared `CARD_SHADOW` preset (very subtle 1 px / 5% black) — applied on Hero card, library tiles, recents rows, result cards, detail card, attachment card.
- Rounded radii: 8 / 10 / 12 / 14 / 16 / 20 / 24 + `full` (999 px) for chips and avatars.
- Decorative SVG patterns (faint grid overlays on hero/activity gradients) are inlined with `react-native-svg`.

#### 6.4 Layout conventions

- Mobile-first; Android portrait is the primary target.
- Every screen reserves safe-area top inset with `paddingTop: insets.top` from `react-native-safe-area-context`.
- 16–20 px horizontal padding on screen bodies.
- Generous vertical rhythm; section eyebrows are uppercase 12 px Geist 600 with 0.96 letter-spacing.

#### 7. State + persistence

| Layer                  | Where                                | What                                                  |
| ---------------------- | ------------------------------------ | ----------------------------------------------------- |
| Auth flag              | `AuthProvider` (`src/navigation/AuthContext.tsx`) | `isAuthenticated`, `login()`, `logout()` |
| Cross-screen app state | `AppStateProvider` (`src/navigation/AppState.tsx`) | `results`, `activeDoc`                  |
| Recent searches        | AsyncStorage key `recent_search`     | string[] (max 3)                                      |
| Route params           | React Navigation                     | Only `Results` has params (`{ query: string }`)       |

There is no Redux or external state library; nothing requires it yet.

#### 8. `assets/dummyData.json` — the mock backend

> `dummyData.json` is the single source of truth for every list, document record, attachment, and sample preview blob the app renders today. It exists **because the real Arcade API is not yet wired in**. Once `apiService.ts` is connected to the live backend, the consumers below will switch from JSON imports to typed network calls — but the in-app shapes (`DocResult`, `Attachment`, `TYPE_META`, `PAGE`) are designed to match the eventual server response, so the swap should be local to the data layer.

#### 8.1 File overview

The file is a single JSON object (~890 lines, ~2.3 MB on disk — most of which is base64 file content). Its top-level keys are:

| Key             | Type      | Consumed by                                                                                       |
| --------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `_doc`          | object    | Self-documentation. Ignored at runtime; JSON has no comments so this block lives at the top.      |
| `page`          | object    | `PAGE` / `PAGE_SIZE` in `src/data/documents.ts` — pagination metadata for the Results screen.     |
| `documents`     | array     | `RESULTS = documents.map(toDocResult)` and `searchDocuments()` in `dummyApiService.ts`.           |
| `typeMeta`      | object    | `TYPE_META` in `src/data/typeMeta.ts`. Drives label/colour/icon for type pills, tiles, and rows.  |
| `worddoc`       | base64    | `SAMPLE_WORD_BASE64` in `src/data/sampleBlobs.ts` → used by Word viewer + download.               |
| `pdfdoc`        | base64    | `SAMPLE_MEDIA_BASE64` in `src/data/sampleBlobs.ts` → used by Media viewer + download.             |
| `recents`       | array     | `RECENTS` — rendered in the HomeScreen "RÉCENTS" section.                                          |
| `searchTypes`   | string[]  | `SEARCH_TYPES` — order of pills in SearchScreen's "FILTRER PAR TYPE" row.                          |
| `fileTypeMeta`  | object    | Looked up by `lookupFileType(ext)` in `src/data/fileTypeMeta.ts` — badge colour/label for attachments. |

#### 8.2 Step-by-step contents

**Step 1 — `_doc`.** A documentation block describing each top-level key. Lives at the top of the file so anyone opening it sees the schema first. **Ignored by all code.**

**Step 2 — `page`.** Pagination shape:

```json
{ "size": 5, "number": 0, "totalResults": 15, "totalPages": 15 }
```

`ResultsScreen` reads `PAGE.totalResults` to render the "N sur 15" counter and `PAGE.totalPages` to draw the page indicator. `PAGE_SIZE` defaults to `size`, falling back to `ceil(totalResults / totalPages)` if `size` is zero.

**Step 3 — `documents`.** An array of 15 raw document records (`RawDoc`). Each entry has:

- `id` — numeric (stringified by `toDocResult`).
- `secretLevel` — security tier from the backend (not yet rendered).
- `ctLabel` — backend content-type code, e.g. `"CP_MARCHE_VILLE"`. Used as the key into `typeMeta` to choose an icon for the result card.
- `fields[]` — indexed metadata fields. Each has `code`, `label` (French, human-readable), and `field` (the value). Two well-known codes drive special behaviour in `toDocResult`:
  - `CP_LIBMAR_V` → the document's display title (falls back to `{ctLabel} #{id}` if missing).
  - `CP_TIERS` → the `owner` (third-party / prestataire).
- `attachments[]` — each has `id`, `label`, `fileName`, `description`, `coverageType`, `airsType`. Only `label` and `fileName` are used by the UI today.
- `status` — one of `review` / `approved` / `draft`. Drives the colour of `<StatusDot />`.
- `date` — pre-formatted French date string (`"12 oct 2025"`).

`toDocResult(raw)` projects this raw shape into the `DocResult` consumed by every screen, dropping empty fields, lifting `title` / `owner` from the well-known codes, and normalising `id` to a string.

**Step 4 — `typeMeta`.** A keyed object whose **keys are either** a `DocTypeId` (`ship`, `works`, `contract`, `hr`, `asset`, `policy`) **or** a backend `ctLabel` (e.g. `CP_MARCHE_VILLE`, `unknown`). Each value is `{ label, color, bg, icon }`:

- `label` — French display name (e.g. _"Navire"_, _"Contrat"_).
- `color` — foreground colour for text and the icon.
- `bg` — chip/tile background.
- `icon` — string name of a `lucide-react-native` icon. Resolved to a real component by `ICON_LIBRARY` in `src/data/typeIcons.ts`. **The name must exist in that library** — adding a new icon means widening `ICON_LIBRARY` too.

Consumers: `DocTypePill`, `TypeTile`, `HomeScreen` library grid + recents, `SearchScreen` filter pills, `ResultsScreen` result cards.

**Step 5 — `worddoc` and `pdfdoc`.** Two large base64 strings holding a sample `.docx` and a sample `.pdf`. These are the **only** payloads the document viewers actually open today — every attachment in every document, regardless of its filename, falls back to one of these two blobs depending on whether `viewerFor(fileName)` classifies it as `word` or `media`. Same for downloads.

**Step 6 — `recents`.** A short list (3 items) of `DocSummary` rows used by the HomeScreen "RÉCENTS" section. Each item has `id`, `title`, `ctLabel`, `when` ("il y a 2 h"), `status`. When the user taps one, `HomeScreen.toActiveDoc(doc)` first tries to upgrade the summary to a full `DocResult` from `RESULTS`; if there's no match, it synthesises a minimal `DocResult` so `DetailScreen` can still render.

**Step 7 — `searchTypes`.** Ordered list of type IDs (`ship`, `works`, `contract`, `hr`, `asset`, `policy`) rendered as filter pills in SearchScreen. These are presentational today — they do not actually filter `searchDocuments()`.

**Step 8 — `fileTypeMeta`.** Per-extension badge style for the attachment list in DetailScreen:

```json
{
  "pdf":     { "bg": "#DC2626", "label": "PDF" },
  "doc":     { "bg": "#2563EB", "label": "DOC" },
  "docx":    { "bg": "#2563EB", "label": "DOC" },
  "unknown": { "bg": "#6B7280", "label": "FILE" }
}
```

Resolved by `lookupFileType(ext)`; the `unknown` entry is the fallback so any new extension renders sanely.

#### 8.3 Mock search behaviour

`searchDocuments(query)` in `src/services/dummyApiService.ts` is intentionally tiny:

```ts
return ALL_DOCUMENTS.filter((doc) =>
  doc.fields.some((f) => f.field?.toLowerCase().includes(needle)),
);
```

It searches **only** the populated `fields[].field` strings, case-insensitively. That's why the matched-fields preview in `ResultsScreen` always highlights inside those field values. Type filters, sort, and pagination are not yet enforced on this path.

#### 8.4 Replacing the dummy data

When the real API comes online:

1. Implement the network calls in `src/services/apiService.ts` (or a new `documentService.ts`).
2. Make the call surface return the **same** `RawDoc` shape, then keep `toDocResult` unchanged.
3. Swap the call sites — `dummyApiService.searchDocuments` for `SearchScreen`, and the initial `RESULTS` / `RECENTS` imports for whatever the backend lists endpoints return.
4. Move `worddoc` and `pdfdoc` to per-attachment downloads — the viewers already accept arbitrary base64.
5. Keep `typeMeta`, `searchTypes`, and `fileTypeMeta` as configuration; they're UX choices, not server data.

#### 9. Out of scope (today)

These items are mentioned in the UI but are not yet implemented in any functional sense:

- Real authentication (`apiService.fetchStatus` exists but is commented out in `LoginScreen.handleSubmit`).
- Inbox and Profile screens (placeholders).
- Document validation / revision-request actions on `Detail` (no UI yet beyond the metadata view).
- Type filtering and sort in `Search` / `Results`.
- Multi-page pagination across the dummy data (`PAGE.totalPages` is 15 but `documents` only contains 15 records → 1 real page).
- Notifications, bookmarks, and the "more" menus on `Detail` are non-functional icons.

When implementing any of these, update both `CLAUDE.md` and this spec.

#### 10. Implementation rules

- Functional components only.
- Strongly type props and route params; use the helpers in `src/navigation/types.ts`.
- Avoid unnecessary `useEffect` — derive instead of synchronise.
- Keep screens presentational; push business logic into `src/services/`.
- Reuse shared components (`TopBar`, `IconBtn`, `TypeTile`, `DocTypePill`, `StatusDot`, `SearchBar`, `FloatingInput`).
- Reuse theme tokens — no raw hex codes in screen files.
- Prefer Expo-compatible packages. Avoid bare React Native native modules unless unavoidable.
- Prettier: single quotes, trailing commas, avoid arrow parens.

**See also:** [`CLAUDE.md`](testClaude/arcade-ged/CLAUDE.md) for the engineering / architecture view, including the provider tree, navigation wiring, the full TopBar contract, theme tokens, and the rules for adding new screens.

### Additional requirements and version differences — source group 2

Applies to: [testClaude/ArcMob/SPEC.md](testClaude/ArcMob/SPEC.md), [testClaude/oldstuff/MobArc_Lp/SPEC.md](testClaude/oldstuff/MobArc_Lp/SPEC.md).

#### Architecture

This is a React Native mobile app (Android + iOS) for document search and viewing. It is TypeScript codebase (`.tsx`/`.ts`).

- **Package Manager**: NPM
- **TypeScript**: Strict mode enabled
- **Styling**: CSS
- **Styling**: Paperwhite 
- **UI**: Paperwhite when appropriate
- **React**: Version 19

#### Entry Points

- `index.js` — registers the root component via `AppRegistry`
- `App.tsx` — root component wrapping with providers (Redux, React Native Paper)

#### Key Source Directories (`src/`)

- `api/` — Axios-based API clients (`apiClient.ts`, `authApi.ts`)
- `navigation/` — `AppNavigator.tsx` using `createNativeStackNavigator`; routes: `login`, `result`, `displayDoc`, `search`, `viewer`, `DocumentDetails`
- `screens/` — One file per screen, corresponding to navigation routes
- `components/` — Shared UI components
- `store/` — Redux Toolkit store; currently only a `user` slice (`userSlice.ts`)
- `services/` — Business logic/service layer
- `theme/` — Theme exports for React Native Paper (`src/theme/index.ts`)
- `utils/` — Utility helpers
- `swagger/` — OpenAPI definitions

#### State Management

Redux Toolkit (`configureStore` + `createSlice`). Store is typed via `RootState` and `AppDispatch` exports from `src/store/index.ts`.

#### Theming

Two UI libraries are used together:

- **React Native Paper** (MD3) — primary component library; theme defined in `src/theme/index.ts` (green palette) and a `blueTheme` variant

Both providers wrap the app in `App.tsx`. When adding new components, prefer React Native Paper components.

#### Navigation

React Navigation v7 with a native stack. `AppNavigator.tsx` is the single navigator — add new screens there. Bottom tabs (`@react-navigation/bottom-tabs`) is installed but check current usage before adding tab navigators.

#### Document Handling

The app is built around document search and viewing. Key libraries: `react-native-pdf`, `@react-native-documents/viewer`, `react-native-fs`, `react-native-blob-util`.

#### Networking

Axios via `src/api/apiClient.ts`. Auth handled in `src/api/authApi.ts` with tokens persisted via `@react-native-async-storage/async-storage`.

#### Logging

`react-native-logs`.

#### Tech Stack

- Bare React Native CLI (no Expo)
- React Navigation
- Functional components, no unnecessary `useEffect`

#### Theme

```ts
primary: '#2F7F73'
lightAqua: '#E8F7F4'
background: '#F7F8FA'
textDark: '#333333'
textMuted: '#6F7F7C'
border: '#E0E4E7'
snackbarBg: '#2E2E2E'
warning: '#F7B731'
```

#### 1. Login

- Centered Logo
- Username input (floating label)
- Password input (floating label) with eye toggle icon
- Teal rounded **Sign In** button → navigates to Search
- DebugSnackbar at bottom

#### 2. Search

- Header
- Row: text input (`placeholder: Rechercher...`) + teal square search button (magnifying glass icon)
- Empty white content area
- Searching `bateau` transitions to Search Results state (same screen)

#### 3. Search Results (state of Search screen)

Shown below search bar after a search:

- Section header: rounded pale aqua pill, checklist icon, label `Search Results`
- Result card (white bg, border):

#### 4. Detail

- Large white card (subtle shadow):
  - Rounded aqua title pill: document icon + `Document`
  - Document details

#### Layout Notes

- Target: Android portrait
- Rounded buttons and inputs with light borders
- Generous spacing, respect safe areas
- Status bar: gray

### Additional requirements and version differences — source group 3

Applies to: [testClaude/ArcMobWord/SPEC.md](testClaude/ArcMobWord/SPEC.md).

All requirements in this source group are already included above.

### Additional requirements and version differences — source group 4

Applies to: [testClaude/ArcMobWord/.claude/worktrees/vigilant-hermann-2b897b/SPEC.md](testClaude/ArcMobWord/.claude/worktrees/vigilant-hermann-2b897b/SPEC.md), [testClaude/oldstuff/MobArc_Lp/.claude/worktrees/vigilant-hermann-2b897b/SPEC.md](testClaude/oldstuff/MobArc_Lp/.claude/worktrees/vigilant-hermann-2b897b/SPEC.md).

#### Architecture

- **Styling**: Tailwind CSS 4 with PostCSS
