import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteHeader } from '@/components/chrome/site-header'
import { SiteFooter } from '@/components/chrome/site-footer'
import { InsightsExplorer } from '@/components/insights/insights-explorer'
import {
  getAllInsights, getFooter, getHeader, getOptionalPageByPathname, getProducts, getServices,
  getSiteSettings,
} from '@/lib/cms/queries'
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/seo'

/**
 * The insights index.
 *
 * Two halves, deliberately:
 *
 *   1. The banner is the SAME title bar + breadcrumb `/insights/[slug]` opens with (`.sdl-article-titlebar` —
 *      see styles/sections/article.css), built the same way: plain JSX, computed from route data,
 *      not a page-builder block. The two routes are one collection (Insights) presented two ways
 *      — a listing and a detail — and reusing the detail page's own banner implementation is what
 *      keeps them looking like one feature rather than two.
 *   2. The listing itself is not a block. It is a filtered view of a collection, which is a
 *      route's job, not a page-builder section's — the same reasoning that makes
 *      /insights/[slug] the one collection-detail route.
 *
 * A static segment outranks the root catch-all in Next's router, so this file takes `/insights`
 * and `[[...slug]]` never sees it. `getOptionalPageByPathname` is kept only for the rare case an
 * editor wants this route's SEO fields or footer overridden from the CMS — it does not drive the
 * banner, which is fixed on purpose (see point 1 above).
 */

const PATHNAME = '/insights'

const FALLBACK_TITLE = 'Insights'
const FALLBACK_INTRO =
  'Explore our collection of blogs, case studies, and whitepapers for valuable insights into the world of IT and digital transformation.'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getOptionalPageByPathname(PATHNAME), getSiteSettings()])

  return buildMetadata({
    page: page ?? { title: FALLBACK_TITLE, excerpt: FALLBACK_INTRO, seo: null },
    settings,
    pathname: PATHNAME,
  })
}

export default async function InsightsIndexPage() {
  const [page, header, footer, insights, services, products] = await Promise.all([
    getOptionalPageByPathname(PATHNAME),
    getHeader(),
    getFooter(),
    getAllInsights(),
    getServices(50),
    getProducts(),
  ])

  const title = page?.title || FALLBACK_TITLE
  const ld = jsonLdScript([breadcrumbJsonLd(PATHNAME, { [PATHNAME]: title })])

  return (
    <>
      <SiteHeader
        header={header}
        variant={page?.headerVariant === 'transparent' ? 'transparent' : 'default'}
      />

      <main id="main" className="sdl-page sdl-page--insights">
        {/* Identical markup and classes to /insights/[slug]'s title bar (article.css owns the
            styling) — the listing is this route's "current page", so its breadcrumb stops one
            level short of the detail page's Home / Insights / <article>. */}
        <div className="sdl-article-titlebar">
          <div className="sdl-section-inner sdl-article-titlebar__inner">
            <p className="sdl-article-titlebar__title">{title}</p>
            <nav className="sdl-article-crumbs" aria-label="Breadcrumb">
              <ol>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li aria-current="page">{title}</li>
              </ol>
            </nav>
          </div>
        </div>

        <section className="sdl-section sdl-section--white sdl-insights-section">
          <div className="sdl-section-inner">
            <InsightsExplorer insights={insights} services={services} products={products} />
          </div>
        </section>
      </main>

      {page?.hideFooter ? null : <SiteFooter footer={footer} />}

      {ld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} /> : null}
    </>
  )
}
