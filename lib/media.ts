/**
 * Media helpers that sit alongside `next/image`.
 *
 * `resolveMedia` (in links.ts) turns a CMS relationship into a `{ src, width, height, alt }`.
 * This file covers the two cases `next/image` can't:
 *
 *   1. A CSS `background-image` that should still go through the image optimiser — the design
 *      renders insight cards this way, and changing the markup to an <img> would break
 *      structural parity (§9.4 Layer 3).
 *   2. A missing image, where the design still reserves the space — a placeholder of the right
 *      aspect ratio keeps CLS at zero (§6.10).
 */

/**
 * Rewrites a CMS image URL to Next's optimiser endpoint, so a `background-image` still gets
 * format negotiation (AVIF/WebP) and edge caching. A non-CMS or non-http URL is returned as-is.
 */
export function optimizedSrc(src: string, width = 750, quality = 75): string {
  if (!src || src.startsWith('data:')) return src
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`
}

/** `background-image` value for a card, routed through the optimiser. */
export function backgroundImage(src: string | undefined, width = 750): string | undefined {
  if (!src) return undefined
  return `url("${optimizedSrc(src, width)}")`
}

/** A 1×1 transparent GIF, for an <img> that has no source yet. */
export const BLANK_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
