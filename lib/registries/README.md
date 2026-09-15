# Registries

Code-side lookups for artwork the CMS references by **string key**. The database stores the key;
this directory owns the SVG. Plan §7.3.

| File | Keys | Consumed by |
|---|---|---|
| `icons.ts` | `ICONS` map from the design — `AI transformation`, `Digital engineering`, `Blogs`, `Careers`, … plus per-item icon paths | mega menu, `value-grid`, `capability-detail`, `approach-steps` |
| `motifs.ts` | `PILLAR_GLYPHS` — the five pillar silhouettes plus the AI orb | `capability-cards` (grid-motif) |
| `swatches.ts` | `PILLAR_MOTIF_COLORS` (6 pairs), `INSIGHT_COLORS` (3), `DE_VALUE_ACCENT_COLORS`, `WAE_ACCENT_COLORS`, `CAP_SHAPE_COLORS`, `DE_TECH_ACCENTS` | cards, insight cards, value grids |
| `mocks.ts` | EVOQ product mockups by product name; DE `mockType` (`ui`, `server`, `code`); the AI case-study mock | `product-grid`, `tech-groups`, `case-study` |
| `visuals.ts` | Hero visual per variant — `home-canvas`, `service-orb`, `services-dna`, `evoq`, `plain` | `hero` |

## Why keys and not markup

The design already works this way: it looks artwork up in a map by title
(`ICONS[item.title] || ICON_DEFAULT`). Keeping that boundary means editors never paste SVG into a
text field, a glyph can be redrawn without a content migration, and the markup stays in version
control where it can be reviewed.

## Each registry exports two things

```ts
export const icons: Record<string, string> = { /* … */ }

export const iconOptions = Object.keys(icons).map((k) => ({ label: k, value: k }))
```

`cms/src/lib/` mirrors the `options` export so Payload `select` fields are populated from the same
source. **Adding a glyph adds the admin option automatically** — the dropdown cannot drift from the
code that renders it.

## Always provide a fallback

A key can be missing: content outlives a refactor, and a seed can carry a stale value. Every
lookup returns a documented default rather than throwing or rendering nothing — the design does
exactly this with `ICON_DEFAULT`.
