import type { Metadata } from 'next'

import type { Media, Page, SiteSetting } from './payload-types'
import { resolveMedia } from './links'

/** The shared SEO group — identical on every publicly-addressable collection (fields/seo.ts). */
type SeoGroup = NonNullable<Page['seo']>

/** Any document that carries a title and the shared SEO group. */
export type SeoDocument = {
  title?: string | null
  seo?: (Partial<SeoGroup> & { image?: (number | Media) | null }) | null
  /** When set (insights), used as the OG type and to fill a missing description. */
  ogType?: 'website' | 'article'
  excerpt?: string | null
}

/**
 * Metadata, resolved through three levels: page SEO → the document's own fields → site defaults.
 *
 * Every SEO field in the CMS is optional, so the fallback chain is what makes leaving them empty
 * the sensible default rather than a mistake.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

/** Anything but production is noindex, so staging can never outrank the real site. */
const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === 'production'

export function absoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

export function buildMetadata({
  page,
  settings,
  pathname,
}: {
  page: SeoDocument
  settings: SiteSetting
  pathname: string
}): Metadata {
  const seo = page.seo ?? {}

  const title = seo.title || page.title || settings.defaultMetaTitle || 'Social DNA Labs'
  const description =
    seo.description || page.excerpt || settings.defaultMetaDescription || undefined

  const image = resolveMedia(seo.image, 'og') ?? resolveMedia(settings.defaultOgImage, 'og')
  const canonical = seo.canonicalOverride || absoluteUrl(pathname)

  const noIndex = Boolean(seo.noIndex) || settings.maintenanceMode === true || !IS_PRODUCTION

  return {
    title,
    description,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: page.ogType ?? 'website',
      url: canonical,
      title,
      description,
      siteName: settings.siteName || 'Social DNA Labs',
      ...(image
        ? { images: [{ url: image.src, width: image.width, height: image.height, alt: image.alt }] }
        : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image.src] } : {}),
    },
  }
}

// JSON-LD lives in lib/jsonld.ts. It imports `absoluteUrl` from here, so keeping it separate
// avoids a cycle and keeps this file about <head> metadata only.
