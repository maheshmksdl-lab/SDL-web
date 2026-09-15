# Styles

CSS lifted **verbatim** from the design files in `sdl-2.0`, with the original class names and
values intact. See plan §6.3 and `docs/DECISIONS.md` #3.

```
styles/
├─ tokens.css        :root custom properties — the design's own token block
├─ base.css          resets, element defaults, body ground
├─ chrome.css        header, footer, .sdl-section*, .sdl-kicker, .sdl-cta*, form, reveal
├─ sections/         one file per block, named for the block slug
└─ pages/            one file per design page — that page's own prefixed rules (see below)
```

`tokens.css` + `base.css` + `chrome.css` are the ~45% that the nine design pages share. Extracting
it once rather than duplicating it nine times is one of the three sanctioned deviations — the
values do not change, only the file boundary.

## Import order is load-bearing

The cascade must match the design's own source order. That is guaranteed by a single ordered chain
in `app/globals.css`:

```css
@import '../styles/tokens.css';
@import '../styles/base.css';
@import '../styles/chrome.css';

@import '../styles/sections/hero.css';
@import '../styles/sections/approach-steps.css';
/* … one line per section, in design source order … */
```

Do not import a section stylesheet from its component. Per-component imports make ordering
dependent on module resolution, which is not stable, and specificity conflicts then appear only in
production builds.

## Page stylesheets and themes

`pages/<theme>.css` holds each design page's own rules — every rule whose selector carries that
page's class prefix (`.bt-*`, `.sdl-hero--bt`, `@keyframes btArcTurn`) — lifted verbatim by
`tools/visual-parity/lift-page-css.mjs`. The section components render those class names from the
page theme (`lib/theme.ts`, derived from the hero visual). Prefixes never collide, so the page
files sit in the import chain after `sections/` in any order.

When a design page changes, re-run the lift rather than editing a page file:

```bash
node tools/visual-parity/lift-page-css.mjs --dry-run   # report what would move
node tools/visual-parity/lift-page-css.mjs
```

It rewrites every `pages/*.css` and removes the stale copies of those rules from the shared files.
The few values a page sets on shared, unprefixed selectors (a sub-service page's hero accent,
EVOQ's dotted section grounds) are scoped by `.sdl-theme--<theme>` at the end of `variants.css`.
See `docs/DECISIONS.md` #21.

## Editing rules

**Do not reformat.** Do not reorder declarations, normalise the one-off breakpoints
(`1300 / 1100 / 1060 / 900 / 720 / 700 / 600 / 560 / 480`), collapse shorthand, or convert values
to a scale. Every one of those is a visual change the parity harness will flag, and the source
formatting is part of the fidelity record. `.editorconfig` disables trailing-whitespace trimming
here for the same reason.

**Only three deviations are sanctioned:**

1. `next/font` — the two `font-family` declarations become
   `var(--font-inter), 'Inter', sans-serif`.
2. De-duplication of the shared chrome, above.
3. Additive `:focus-visible` rules. Additive only — never alter an existing declaration.

Anything else is a defect. `pnpm parity` from `web/` is what catches it.
