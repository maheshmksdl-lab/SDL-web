# Sections

One folder per page-builder block, named for the block slug. Each is the render half of a block
defined in `cms/src/blocks/`.

```
sections/
├─ hero/index.tsx
├─ approach-steps/index.tsx
├─ capability-cards/index.tsx
│   └─ pillar-card.tsx          sub-components stay local to their section
└─ …
```

Stylesheets do **not** live here — they are in `web/styles/sections/<slug>.css` and imported
through the ordered chain in `app/globals.css`. See `web/styles/README.md` for why.

## Contract

Every section component:

1. **Is a Server Component** unless it is one of the nine sanctioned client islands
   (`MegaMenu`, `MobileNav`, `HeroCanvas`, `InsightsCarousel`, `ProductFilterTabs`,
   `TechGroupTabs`, `ContactForm`, `RevealObserver`, `ServicesDnaVisual`). If a new section needs
   interactivity, isolate the interactive part into a small client child rather than marking the
   whole section `'use client'`.

2. **Takes the block's typed props**, from the generated `payload-types.ts`.

3. **Does not read `settings`.** `render-blocks.tsx` owns `sectionSettings`: it filters on
   `hidden`, applies `background` and `spacing` to the wrapper, sets `id` from `anchorId`, and adds
   the reveal class. Sections receive content, not layout chrome.

4. **Renders the design's exact class names and DOM shape.** The parity harness compares element
   counts and class sets per section (Layer 3), so an extra wrapper `<div>` is a test failure, not
   a stylistic choice.

5. **Handles missing optional data.** Every optional field can be absent — an editor may leave a
   sub-heading, image or CTA empty. Render nothing for it, never a gap or a placeholder string.

6. **Reads artwork from `lib/registries/`** by the key the CMS supplied, with a fallback.

## Headings

Several design sections mark up headings as `<div>`. Render them as `<h2>` / `<h3>` with the same
class. The visual output is identical because the CSS sets size and weight explicitly, and the
document outline becomes correct. This is an accessibility remediation, not a design change
(plan §6.11).

## Tests

Each section carries component tests covering: full data, minimal data (every optional field
empty), and each variant. Add them alongside the section in `web/tests/`.
