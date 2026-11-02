---
name: web-security
description: Enforce baseline web security and avoid common vulnerabilities. Use when handling user input, building auth, working on the connection tester, accepting query strings, or anything that crosses a trust boundary.
version: 1.1.0
last_updated: 2026-05-08
---

# Web Security

We treat **web security as a core requirement**, not an afterthought.
Assume hostile input and untrusted environments by default.

---

## When NOT to use

- For pure client-side rendering of fixed dashboard data — there's nothing user-controlled to validate. (But if you add user-controlled state to a query, this skill applies.)
- For policy / legal review — out of scope.

---

## Core principles

- **NEVER** trust user input.
- **ALWAYS** validate and sanitise data at boundaries.
- **PREFER** secure defaults over configurability.
- Simplicity reduces attack surface.
- If unsure, choose the more restrictive option.

---

## XSS & injection

- **AVOID** `dangerouslySetInnerHTML` and raw HTML injection.
- Escape and encode dynamic content properly. React escapes JSX text by default — exploit that.
- Never interpolate untrusted data into HTML, CSS, or JS contexts.
- For SQL: prefer parameterised queries (`sequelize.query(sql, { replacements })`). When raw SQL is unavoidable, validate every interpolated identifier against an allowlist.

```js
// ❌ schema name interpolated unchecked
const sql = `select * from ${process.env.JDE_SCHEMA}.tbl`;

// ✅ project pattern — schemaTable() validates against ^[a-zA-Z_][a-zA-Z0-9_]*$
import { schemaTable } from "../../config/schema.js";
const sql = `select * from ${schemaTable("tbl")}`;
```

---

## Authentication & authorisation

- Don't store secrets or tokens in insecure locations.
- **AVOID** `localStorage` for sensitive credentials when possible.
- Use HTTP-only, secure cookies for session tokens.
- Always enforce authorisation **on the server**. Client checks are UX, not security.
- Treat absence of auth as a deployment blocker, not a feature.

---

## Browser security APIs

- Respect CORS, CSP, and browser security boundaries.
- Use Content Security Policy to restrict script and resource execution.
- Avoid inline scripts and styles when CSP is enabled.
- Set `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: same-origin` at the edge.

---

## Data handling

- Minimise data exposure — only return fields the UI uses.
- Don't log sensitive information (passwords, tokens, full request bodies).
- Generic error messages to clients; detailed errors to server logs.

```js
// ✅ project pattern
} catch (error) {
  console.error("Inventory dashboard failed.", error);
  return res.status(500).json({ error: "Unable to load inventory dashboard." });
}
```

---

## Dependencies & supply chain

- Avoid unnecessary packages.
- Treat third-party code as untrusted input.
- Run `npm audit` periodically. Pin major versions in `package.json` and review minor bumps.
- Avoid `npm install` at deploy time without a lockfile.

---

## Project-specific appendix

These rules apply to **this** repo (JDE Demo ERP) on top of the generic guidance above.

### Read-only contract

- **Database is read-only.** The configured user (`readonly_user`) must have only `SELECT` privileges. Any code path that issues `INSERT/UPDATE/DELETE/TRUNCATE/DROP/CREATE` is a bug.
- The `/api/connection/test` endpoint guards this with a regex: `^\s*(select|show)\b`. **Do not loosen** it (e.g. to permit `WITH`) without explicit user approval and a documented threat model.
- The same endpoint blocks multi-statement SQL by rejecting any string containing `;` other than a trailing one. Don't relax this.

### Schema interpolation

- `JDE_SCHEMA` is interpolated into raw SQL via `schemaTable()`. The validation regex (`^[a-zA-Z_][a-zA-Z0-9_]*$`) is the only thing standing between the env var and a SQL injection. **Don't change it without changing the threat model.**

### Listen address

- Express binds to `127.0.0.1` only. The app has **no auth**. Binding to `0.0.0.0` would expose every dashboard to anyone on the LAN.

### Secrets

- `.env` is gitignored. `.env.example` ships with placeholder values only.
- `.codex/config.toml` currently contains a **literal Postgres password** (`postgres`). Even though it's a dev cred for `readonly_user` on localhost, it should not live in version control. Flag for rotation if you touch the file.

### Generic error envelopes

- All controllers return `{ error: "<short generic message>" }` on failure. Never surface raw Sequelize errors, stack traces, or schema names to clients.

### Validation

- The `connectionController.create` handler validates `host/port/database/user` are present and that the SQL passes the read-only regex. Mirror that pattern in any new endpoint that accepts input.
- Consider `zod` for any future endpoint that accepts a non-trivial body shape.

---

## General principles

- Simplicity reduces attack surface.
- If unsure, choose the more restrictive option.
- Document every trust boundary so the next agent doesn't accidentally widen it.
