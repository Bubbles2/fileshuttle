---
name: clean-typescript
description: Write clean, correct TypeScript that reduces bugs and cognitive load. Use when defining or using types, designing function signatures, modelling state, or refactoring TS code.
version: 1.1.0
last_updated: 2026-05-08
---

# Clean TypeScript

We use **TypeScript as a correctness and clarity tool**, not as ceremony.
Types should reduce bugs and cognitive load — never the other way round.

This project uses `strict: true` on the client (`tsconfig.client.json`).
The server is plain JS with `allowJs` typechecking — apply this skill to client code primarily.

---

## When NOT to use

- Pure JavaScript files in `server/` — keep them idiomatic JS until/unless we migrate the whole server.
- Throwaway scripts under `scripts/`.
- Generated files (Vite output, `.d.ts` artifacts).

---

## Type philosophy

- **PREFER** explicit, readable types over clever or overly generic ones.
- **AVOID** `any`. Use `unknown` and narrow.
- **AVOID** unsafe assertions (`x as Foo`). Prefer narrowing via control flow.
- Let TS infer when inference is clear and stable; annotate at module boundaries.

```ts
// ❌
function format(value: any) { return String(value).toUpperCase(); }

// ✅
function format(value: unknown): string {
  if (typeof value === "string") return value.toUpperCase();
  if (typeof value === "number") return value.toString();
  return "";
}
```

---

## Types vs. interfaces

- **PREFER** `type` aliases for most shapes.
- Use `interface` only for public, extendable object shapes (e.g. plugin APIs).
- Keep types small, composable, and well-named. If a type doesn't fit on one screen, split it.

```ts
// ✅ tight, composable
type Money = { amount: number; currency: "EUR" | "USD" | "GBP" };
type LineItem = { sku: string; quantity: number; price: Money };
type Invoice = { id: string; lines: LineItem[] };
```

---

## Functions & APIs

- **PREFER** explicit return types for exported / cross-module functions.
- Avoid function overloads unless they meaningfully improve the API.
- Keep signatures simple and predictable.

```ts
// ❌ inferred return = boolean | undefined; callers can't tell
export function isOpen(order) {
  if (!order) return;
  return order.status === "OPEN";
}

// ✅
export function isOpen(order: Order | null): boolean {
  return order?.status === "OPEN";
}
```

---

## Nullability & safety

- Handle `null` and `undefined` explicitly.
- **DO NOT** rely on the non-null assertion (`!`) except as a last resort.
- Prefer narrowing via guards over assertion.

```ts
// ❌
const total = order!.lines!.reduce(sum);

// ✅
if (!order || !order.lines) return 0;
const total = order.lines.reduce(sum, 0);
```

---

## Enums & constants

- **AVOID** `enum`. They produce runtime objects and don't tree-shake well.
- **PREFER** union types or `as const` objects.

```ts
// ❌
enum Status { Open, Closed, Cancelled }

// ✅
type Status = "OPEN" | "CLOSED" | "CANCELLED";

// ✅ when you need iteration
const STATUSES = ["OPEN", "CLOSED", "CANCELLED"] as const;
type Status = typeof STATUSES[number];
```

---

## Error handling

- Type errors and error states explicitly.
- Prefer result objects or typed errors over throwing where appropriate.
- Don't hide failure modes behind broad types.

```ts
// ✅ result type at the boundary
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

async function loadSummary(): Promise<Result<Summary, "network" | "schema">> {
  try {
    const res = await fetch("/api/inventory/dashboard");
    if (!res.ok) return { ok: false, error: "network" };
    return { ok: true, value: await res.json() };
  } catch {
    return { ok: false, error: "network" };
  }
}
```

---

## RTK Query specifics

- The `error` field from RTK Query hooks is `unknown` — always narrow before reading `.data.error`. The project already uses this pattern, e.g. `getErrorMessage` in `inventory-dashboard.tsx`.

```ts
function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "error" in error.data &&
    typeof error.data.error === "string"
  ) {
    return error.data.error;
  }
  return "Unable to load dashboard.";
}
```

---

## General principles

- Types should explain intent.
- If a type is hard to understand, it's probably wrong.
- Favour maintainability over theoretical completeness.
- Prefer fewer, sharper types over many vague ones.

## Validation

```powershell
npm run typecheck      # tsc -p tsconfig.client.json + tsconfig.server.json
npm run lint
```
