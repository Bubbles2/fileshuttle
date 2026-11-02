---
name: modern-browser-apis
description: Prefer native, widely-supported browser APIs over libraries or custom implementations when they reduce bundle size, simplify logic, or improve performance. Use when reaching for a UI/perf/IO concern that has a built-in equivalent.
version: 1.1.0
last_updated: 2026-05-08
---

# Modern Browser APIs

We prefer native, modern browser APIs — _standardised, widely supported, high-leverage_ — to heavy external libraries or custom fallbacks.
Use them to simplify logic, improve perf, and reduce bundle size where appropriate.

---

## When NOT to use

- For server / Node code — these APIs are browser-only.
- For experimental APIs (e.g. WebGPU, WebTransport) in **production code** for this project — the demo doesn't need them and the cross-browser support burden isn't worth it.
- When a one-line library use is genuinely simpler than wiring up the API + fallback.

---

## Decision flow

```
Need to do X?
  ├─ Native API exists? → check Baseline / caniuse
  │     ├─ widely supported → use native
  │     └─ partial support → native + fallback, OR library
  └─ No native API → library
```

Always combine native usage with **feature detection**:

```js
if ("IntersectionObserver" in window) {
  // use it
} else {
  // fallback
}
```

---

## Project-relevant APIs

These are the APIs likely to come up in this dashboard project. Other useful APIs are listed below for awareness only.

### Already used here

- **`Intl.NumberFormat`** — see `components/<domain>-domain/<domain>-formatters.ts`. Use this for any new locale-aware formatting; do not pull in `numeral.js` or similar.
- **`Intl.DateTimeFormat`** — same file. Use for date display.
- **`Promise.all`** — used heavily server-side; equally idiomatic on the client.

### Probably useful soon

- **IntersectionObserver** — when any "recent orders" or "low stock" list grows beyond a screenful, use it for lazy rendering instead of windowing libraries.
- **ResizeObserver** — for any panel that needs to react to its own size (charts, sticky headers).
- **View Transitions API** — could replace the abrupt landing-↔-dashboard switch in `wrapper.tsx` with a smooth transition. Native, no dependency.
- **`URLPattern`** — if/when we add proper routing; cleaner than regex matching.
- **AbortController / signal** — pair with `fetch` and RTK Query's `signal` for cancellable requests.

### Specialised — only when justified

- **BroadcastChannel** — multi-tab sync. Out of scope for now.
- **Web Locks** — coordinate async writes; not relevant in a read-only app.
- **Clipboard async API** — only if we add "copy SQL" / "copy JSON" affordances.
- **Web Share API** — mobile share sheets. Out of scope.
- **File System Access** — we don't write local files.
- **Web Workers / OffscreenCanvas** — only when we add charts that block the main thread.
- **WebGPU / WebRTC / Web Speech** — out of scope for this project. Mention to user before adding.

---

## Best practices

- **Async first**: prefer promise / async APIs to avoid blocking the UI.
- **Permissions UI**: convey clearly to users when the browser will ask for access (files, clipboard, sharing).
- **Performance-aware**: observe and prioritise main-thread work using `PerformanceObserver` or the Scheduling API rather than guessing.
- **Secure contexts**: many APIs require HTTPS. Keep that in mind for any future deployment.
- **Progressive enhancement**: always design for the no-API path first, then enhance.

---

## Fallback template

```ts
function lazyObserve(el: Element, onEnter: () => void) {
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          onEnter();
          io.disconnect();
        }
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }

  // Fallback — eager
  onEnter();
  return () => {};
}
```

---

## General principles

- Write code for browsers as platforms, not just JS engines.
- Prefer native semantics (e.g. lazy-loading via `loading="lazy"` on `<img>` over `IntersectionObserver` over scroll listeners).
- Reduce external dependencies where modern browser APIs suffice.
- Document API usage and fallback patterns inline; keep the failure path obvious.
