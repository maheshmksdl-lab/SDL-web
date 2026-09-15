import type { MetadataRoute } from 'next'

import { getSiteSettings } from '@/lib/cms/queries'
import { absoluteUrl } from '@/lib/seo'

/**
 * robots.txt.
 *
 * Blocks everything unless this is the production environment AND maintenance mode is off — so a
 * staging deploy, a preview build, or a site mid-maintenance can never be indexed and outrank
 * the real thing. In production it allows crawling and points at the sitemap.
 *
 * `robotsTxtAdditions` from Site Settings is read as extra paths to disallow, one per line, each
 * starting with `/`. That is the case editors actually need (hide a section from search);
 * anything more exotic belongs in the CDN/edge config, not a content field. See plan §6.9.
 */

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === 'production'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings()
  const blocked = !IS_PRODUCTION || settings.maintenanceMode === true

  if (blocked) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  const extraDisallow = (settings.robotsTxtAdditions ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('/'))

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', ...extraDisallow],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
