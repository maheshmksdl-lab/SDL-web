/* Pillar motif registry — full SVG elements, coloured via currentColor.
 *
 * Generated from the design's own data by tools/visual-parity/gen-registries.mjs.
 * Source: index.html PILLAR_GLYPHS
 *
 * The CMS stores the KEY; this file owns the artwork. Editors never paste SVG.
 * Each registry exports its lookup and an `options` array — cms/src/lib imports the same
 * options so an admin dropdown cannot drift from the code that renders it. */

export const motifs: Record<string, string> = {
  'digital-engineering': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M50 4L84 25L84 75L50 96L16 75L16 25Z M50 30A20 20 0 1 0 50.01 30Z"/></svg>',
  'business-transformation': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M74 28A34 34 0 1 1 28 24" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round"/><path d="M18 10 L30 24 L14 30 Z" fill="currentColor"/></svg>',
  'digital-experience': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M22 8 L22 84 L41 67 L53 92 L66 86 L54 61 L78 61 Z" fill="currentColor"/></svg>',
  'growth-transformation': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M18 82 L82 18" stroke="currentColor" stroke-width="14" stroke-linecap="round" fill="none"/><path d="M46 18 L82 18 L82 54" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  'products-and-platforms': '<svg viewBox="0 0 100 116" xmlns="http://www.w3.org/2000/svg"><polygon points="50,6 92,28 50,50 8,28" fill="currentColor"/><polygon points="50,36 92,58 50,80 8,58" fill="currentColor" opacity="0.7"/><polygon points="50,66 92,88 50,110 8,88" fill="currentColor" opacity="0.45"/></svg>',
}

/** 'AI transformation' renders the animated orb instead of a static glyph. */
export const ORB_MOTIF = 'ai-transformation'

export function getMotif(key?: string | null): string | null {
  if (!key || key === ORB_MOTIF) return null
  return motifs[key] ?? null
}

export const motifOptions = [ORB_MOTIF, ...Object.keys(motifs)].map((value) => ({ value, label: value }))
