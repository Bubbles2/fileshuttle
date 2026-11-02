---
name: digitech-design
description: Use this skill to generate well-branded interfaces and assets for Digitech, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference
- **Tokens:** `colors_and_type.css` — import this in any HTML you create.
- **Logos:** `assets/digitech-mark.png`, `assets/digitech-logo.png`.
- **Components:** `ui_kits/governance-console/components.jsx` — copy-paste primitives (Button, Badge, Input, Card, Avatar, Toggle, Icon).
- **Reference screens:** `ui_kits/governance-console/index.html`.
- **Preview cards:** `preview/*.html` — atomic specimens of every token & component state.

## Non-negotiables
- **Geist** is the only font.
- **Teal `#1E7D73`** is the only primary action colour.
- **No gradients, no glows, no neon, no emoji** in product UI.
- 4 px baseline grid; 12 px radii on cards/buttons; soft directional shadows only.
- Motion: `180ms cubic-bezier(0.2, 0.8, 0.2, 1)` — no bounces.
- Voice: declarative, imperative, technical. "Review unresolved governance conflicts." not "Supercharge your workflow."
