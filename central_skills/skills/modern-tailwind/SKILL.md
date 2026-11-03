---
name: modern-tailwind
description: Write clean, modern, concise Tailwind CSS v4 code (v3 fallbacks noted). Use whenever working on or reviewing Tailwind CSS code.
---

# Check the Tailwind version first

Look at `package.json`. The shorthand below needs **Tailwind CSS v4**; on v3 keep the `[var(--x)]` form.

# Variables in arbitrary values

When using variables in arbitrary values, use the modern, shorter syntax (v4).

Instead of:

```html
<div class="bg-[var(--color)]" />
```

write:

```html
<div class="bg-(--color)" />
```

# Layout best practices

Prefer grid for 2D layouts.
Prefer flex for 1D alignment.

Examples:

```html
<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  <div class="flex items-center justify-between"></div>
</div>
```
