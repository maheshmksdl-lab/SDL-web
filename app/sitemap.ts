import type { MetadataRoute } from 'next'

import { getSitemapInsights, getSitemapPages } from '@/lib/cms/queries'
import { absoluteUrl } from '@/lib/seo'

/**
 * XML sitemap, enumerated from the CMS.
 *
 * Published pages and insights only (the queries pass `draft: false`), and `noindex` entries are
 * dropped — listing a page you have told crawlers not to index is a mixed signal. Non-production
 * environments emit an empty sitemap to match robots.ts blocking everything.
 *
 * Revalidates on the `pages` / `insights` tags like every other CMS read, so publishing a page
 * updates the sitemap within one revalidation cycle rather than at the next build.
 */

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === 'production'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!IS_PRODUCTION) return []

  const [pages, insights] = await Promise.all([getSitemapPages(), getSitemapInsights()])

  const seen = new Set<string>()
  const entries: MetadataRoute.Sitemap = []

  for (const entry of [...pages, ...insights]) {
    if (entry.noIndex || seen.has(entry.path)) continue
    seen.add(entry.path)
    entries.push({
      url: absoluteUrl(entry.path),
      lastModified: entry.lastModified ? new Date(entry.lastModified) : undefined,
      changeFrequency: entry.path === '/' ? 'weekly' : 'monthly',
      priority: entry.path === '/' ? 1 : entry.path.startsWith('/insights/') ? 0.5 : 0.7,
    })
  }

  return entries
}
