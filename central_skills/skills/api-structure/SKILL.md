---
name: api-structure
description: Scaffold or extend a per-domain REST API in an Express + Sequelize + PostgreSQL backend (ES modules). Use when the user asks to add an endpoint, add a domain, add a Sequelize model, or mirror the existing per-domain backend layout.
version: 2.0.0
last_updated: 2026-11-03
---

# API Structure — Express + Sequelize + PostgreSQL

## When to use

Invoke this skill when the user asks to:

- Create a new API domain (`/api/<domain>`) or add endpoints to an existing one
- Add or use a Sequelize model on the server
- Mirror the project's per-domain backend layout

## When NOT to use

- For client-side API calls — use the project's data-fetching library (RTK Query, TanStack Query, SWR, …).
- For a CommonJS (`require` / `module.exports`) backend — use `backend-api-structure` instead.
- For database migrations — only generate them if the project already uses `sequelize-cli` migrations; otherwise ask.

---

## Inputs

| Input            | Source                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Domain name      | User (e.g. `widget`) — singular, camelCase                             |
| Table or view    | User, or an existing model                                             |
| Operations       | User — default to full CRUD; read-only is fine if the user says so    |
| Response shape   | User, or derived from the model's columns                              |

## Outputs

For a new domain `widget`:

1. `server/api/widget/widgetController.js` — handlers
2. `server/api/widget/index.js` — router
3. `server/models/widget.js` — Sequelize model definition
4. Edit `server/models/index.js` — add the `getWidgetModels()` lazy accessor
5. Edit `server/api/index.js` — mount the router
6. Update the project's API docs if it keeps any (README, `SPEC.md`, OpenAPI file)
7. (Client follow-up) types + service for the frontend — flag to the user; outside this skill's scope

Before writing anything, read one existing domain in the repo and copy its conventions where they differ from the templates below.

---

## Folder layout (target)

```
server/
├── api/
│   ├── index.js                 # mounts every domain router
│   └── widget/
│       ├── widgetController.js
│       └── index.js
├── models/
│   ├── index.js                 # sequelize instance + lazy accessors
│   └── widget.js
└── utils/
    └── number.js                # toNumber() for Decimal columns
```

The folder name **must** match the domain name. The controller filename **must** be `<domain>Controller.js`.

---

## Templates

### Controller (`server/api/widget/widgetController.js`)

```js
import { getWidgetModels } from "../../models/index.js";
import { toNumber } from "../../utils/number.js";

function serialize(row) {
  return {
    id: row.id,
    name: row.name,
    amount: toNumber(row.amount),
  };
}

export async function index(req, res, next) {
  try {
    const { Widget } = getWidgetModels();
    const rows = await Widget.findAll({ order: [["name", "ASC"]], raw: true });
    return res.json(rows.map(serialize));
  } catch (error) {
    return next(error);
  }
}

export async function show(req, res, next) {
  try {
    const { Widget } = getWidgetModels();
    const row = await Widget.findByPk(req.params.id, { raw: true });
    if (!row) return res.status(404).json({ error: "Widget not found." });
    return res.json(serialize(row));
  } catch (error) {
    return next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { name, amount } = req.body;
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "name is required." });
    }
    const { Widget } = getWidgetModels();
    const row = await Widget.create({ name, amount });
    return res.status(201).json(serialize(row.get({ plain: true })));
  } catch (error) {
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { Widget } = getWidgetModels();
    const row = await Widget.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "Widget not found." });
    await row.update(req.body);
    return res.json(serialize(row.get({ plain: true })));
  } catch (error) {
    return next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const { Widget } = getWidgetModels();
    const deleted = await Widget.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Widget not found." });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
```

Rules:

- **Named exports only.** Never `module.exports`.
- **Use `Promise.all`** for independent reads in the same handler.
- **Aggregate in SQL** (`COUNT`, `SUM`, `COALESCE`) via `sequelize.fn` / `sequelize.query`, not in JS, for summary endpoints.
- **`toNumber()` every Decimal** before returning — `pg` serialises `DECIMAL`/`NUMERIC` as strings.
- **camelCase** all JSON keys.
- **Validate input** at the top of mutating handlers (or with a validator such as `zod` / `express-validator` if the project has one). Return `400` with a short message.
- **`next(error)`** for unexpected failures; let the central error middleware log and respond. Never leak Sequelize/Postgres detail to the client.

### Router (`server/api/widget/index.js`)

```js
import express from "express";
import { index, show, create, update, remove } from "./widgetController.js";

const router = express.Router();

router.get("/", index);
router.get("/:id", show);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
```

Opening this file should reveal the whole public surface of the domain. Domain-specific actions use clear verbs as sub-resources: `router.post("/:id/approve", approve)`.

### Model (`server/models/widget.js`)

```js
import { DataTypes } from "sequelize";

export function initWidgetModels(sequelize) {
  const Widget = sequelize.define(
    "Widget",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      amount: DataTypes.DECIMAL,
    },
    {
      tableName: "widgets",
      freezeTableName: true,
      // Set timestamps: false if the table has no createdAt/updatedAt columns.
    },
  );

  return { Widget };
}
```

Rules:

- `freezeTableName: true` — the model name is never pluralised behind your back; `tableName` is explicit.
- Match the table: set `timestamps: false` when the table has no `createdAt`/`updatedAt`; use `underscored: true` when columns are `snake_case`.
- When the schema is owned by another system (a view, a legacy database), add `constraints: false` on associations and don't `sync()`.
- Views need an explicit primary key — use `primaryKey: true` on one or more columns.
- Pass `schema` in the model options only if the project uses a non-default Postgres schema; read it from config, never build SQL by string-concatenating an env var.

### Lazy accessor (`server/models/index.js`)

```js
import { Sequelize } from "sequelize";
import { initWidgetModels } from "./widget.js";

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

let widgetModels;

export function getWidgetModels() {
  if (!widgetModels) {
    widgetModels = initWidgetModels(sequelize);
  }
  return widgetModels;
}
```

Models are initialised on first use so importing a controller never opens a connection at module load (keeps tests and CLI scripts fast and side-effect free).

### Router registration (`server/api/index.js`)

```js
import express from "express";
import widgetRoutes from "./widget/index.js";

const router = express.Router();

router.use("/widget", widgetRoutes);

export default router;
```

`app.js` mounts this once: `app.use("/api", apiRouter)`, so the final URL is `/api/widget/:id`.

### Decimal helper (`server/utils/number.js`) — create if missing

```js
export function toNumber(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}
```

### Central error middleware (`server/app.js`) — create if missing

```js
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: "An unexpected server error occurred." });
});
```

---

## Definition of done

- [ ] `server/api/<domain>/<domain>Controller.js` exists with named-export handlers.
- [ ] `server/api/<domain>/index.js` registers the routes; the file reads as the domain's API surface.
- [ ] Sequelize model defined with explicit `tableName` and `freezeTableName: true`; `timestamps` matches the table.
- [ ] Lazy `getXxxModels()` added to `server/models/index.js`.
- [ ] Router mounted from `server/api/index.js`.
- [ ] All `DECIMAL`/`NUMERIC` fields piped through `toNumber()`.
- [ ] Response keys camelCase; errors use the generic `{ error: "<message>" }` envelope.
- [ ] Mutating handlers validate input and return `400` on bad input, `404` when the row doesn't exist.
- [ ] Raw SQL (if any) uses `replacements` / bind parameters — never interpolated user input.
- [ ] Project API docs updated if the repo keeps any.
- [ ] `npm run lint` (and `npm run typecheck` / `npm test` if the project has them) clean.

---

## Pitfalls

- **Importing a model file directly** (`import { Widget } from "../../models/widget.js"`) bypasses the lazy accessor and instantiates Sequelize at import time. Always go through `getXxxModels()`.
- **`await sequelize.authenticate()` inside controllers** — unnecessary; the pool connects lazily.
- **Returning Decimals raw** — clients receive strings and arithmetic silently breaks.
- **Interpolating env vars or request data into SQL strings** — use Sequelize query methods, `replacements`, or validate identifiers against a strict allowlist regex.
- **`sequelize.sync()` against a database you don't own** — it will try to alter tables. Only sync in projects that explicitly rely on it.
- **Forgetting `express.json()`** in `app.js` — `req.body` is `undefined` in POST/PUT handlers.
