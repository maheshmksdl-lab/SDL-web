import type { Media, Page } from './payload-types'

/**
 * Resolves the CMS link union to an href.
 *
 * The design hardcodes destinations (`ai-transformation.html`, `#contact`). Storing a
 * relationship instead means a page rename cannot break the nav, the footer or any card — but
 * only if resolution happens here rather than being reimplemented per component.
 */

export type CmsLink = {
  label?: string | null
  type?: ('internal' | 'external' | 'anchor') | null
  page?: (number | Page) | null
  url?: string | null
  anchor?: string | null
  newTab?: boolean | null
} | null | undefined

export type ResolvedLink = {
  href: string
  label: string
  external: boolean
  newTab: boolean
}

export function resolveLink(link: CmsLink): ResolvedLink | null {
  if (!link) return null

  const label = link.label ?? ''

  switch (link.type) {
    case 'anchor': {
      if (!link.anchor) return null
      return { href: `#${link.anchor}`, label, external: false, newTab: false }
    }

    case 'external': {
      if (!link.url) return null
      return { href: link.url, label, external: true, newTab: link.newTab ?? false }
    }

    case 'internal':
    default: {
      /*
       * `page` arrives as an id when the query ran at depth 0 and as an object when populated.
       * An unpopulated relationship has no pathname to resolve, so the link is dropped rather
       * than rendered pointing at "/" — a wrong destination is worse than a missing one.
       */
      if (!link.page || typeof link.page !== 'object') return null
      const pathname = link.page.pathname
      if (!pathname) return null
      return { href: pathname, label, external: false, newTab: false }
    }
  }
}

/** Every section anchor a page renders (`settings.anchorId`), for `anchorForPage`. */
export function layoutAnchors(layout: Page['layout']): Set<string> {
  const ids = new Set<string>()
  for (const block of layout ?? []) {
    const id = (block as { settings?: { anchorId?: string | null } | null }).settings?.anchorId
    if (id) ids.add(id)
  }
  return ids
}

/**
 * Re-points a header or footer link at an in-page anchor to the home page's copy of that section
 * when the current page does not render it.
 *
 * The header and footer are globals, so their "Let's talk" / "Contact us" links are stored once as
 * `#contact`. Only home and services carry a contact section; evoq.html, which has none, points
 * the same links at `index.html#contact` instead. Doing that for every page without the section
 * keeps the links from going nowhere.
 */
export function anchorForPage(href: string, pageAnchors: ReadonlySet<string>): string {
  if (!href.startsWith('#') || href.length < 2) return href
  return pageAnchors.has(href.slice(1)) ? href : `/${href}`
}

/** Props for an anchor, including rel hardening on external targets. */
export function linkProps(resolved: ResolvedLink) {
  return {
    href: resolved.href,
    ...(resolved.newTab
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : resolved.external
        ? { rel: 'noopener' }
        : {}),
  }
}

// ── Media ────────────────────────────────────────────────────────────────────

export type MediaLike = (number | Media) | null | undefined

type MediaSizeName = 'thumb' | 'insight' | 'logo' | 'avatar' | 'og'

export type ResolvedMedia = {
  src: string
  alt: string
  width?: number
  height?: number
}

/**
 * Picks a derivative, falling back to the original.
 *
 * The fallback matters: SVG and PDF uploads never have derivatives, and any record uploaded
 * before a size existed carries only the sizes present at the time. The reference project
 * documents exactly this, and the CMS sets `withoutEnlargement: false` so a derivative is
 * generated even for a small source — but records predating that still need the fallback.
 */
export function resolveMedia(media: MediaLike, size?: MediaSizeName): ResolvedMedia | null {
  if (!media || typeof media !== 'object') return null

  const sized = size ? media.sizes?.[size] : undefined
  const src = sized?.url ?? media.url
  if (!src) return null

  return {
    src,
    alt: media.alt ?? '',
    width: sized?.width ?? media.width ?? undefined,
    height: sized?.height ?? media.height ?? undefined,
  }
}
