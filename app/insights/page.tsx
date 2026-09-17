import type { Metadata } from 'next'

import { RenderBlocks } from '@/components/render-blocks'
import { SiteHeader } from '@/components/chrome/site-header'
import { SiteFooter } from '@/components/chrome/site-footer'
import { InsightsExplorer } from '@/components/insights/insights-explorer'
import { HeroVisual } from '@/components/sections/hero/hero-visual'
import { AccentLines, Kicker, type HeadingLine } from '@/components/ui/primitives'
import {
  getAllInsights, getFooter, getHeader, getOptionalPageByPathname, getProducts, getServices,
  getSiteSettings,
} from '@/lib/cms/queries'
import { resolveBlockData } from '@/lib/cms/resolvers'
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/seo'
import { themeForLayout } from '@/lib/theme'

/**
 * The insights index.
 *
 * Two halves, deliberately:
 *
 *   1. Everything ABOVE the listing is an ordinary CMS page at the pathname `/insights` — the
 *      same `layout` blocks every other page is built from, rendered through the same
 *      `RenderBlocks`. So the hero, its copy and its background image are edited exactly where
 *      an editor already edits every other hero, with no fields invented for this route.
 *   2. The listing itself is not a block. It is a filtered view of a collection, which is a
 *      route's job, not a page-builder section's — the same reasoning that makes
 *      /insights/[slug] the one collection-detail route.
 *
 * A static segment outranks the root catch-all in Next's router, so this file takes `/insights`
 * and `[[...slug]]` never sees it. If no `/insights` page exists in the CMS yet, the fallback
 * header below renders and the listing still works.
 */

const PATHNAME = '/insights'

const FALLBACK_TITLE = 'Insights'
const FALLBACK_INTRO =
  'Explore our collection of blogs, case studies, and whitepapers for valuable insights into the world of IT and digital transformation.'

/* Echoes the `insightsTitle` copy the design already uses for this section on other pages
   (src/seeds/design.ts), split into the two-line kicker + accent-heading shape EVOQ's own hero
   uses, so the banner reads as one more inner page rather than a bespoke one-off. */
const FALLBACK_HEADING_LINES: HeadingLine[] = [{ before: 'Ideas for' }, { accent: "what's next." }]

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

  const resolved = page ? await resolveBlockData(page.layout) : {}
  const theme = page ? themeForLayout(page.layout) : null
  const themeClass = theme ? ` sdl-theme--${theme}` : ''
  const ld = jsonLdScript([breadcrumbJsonLd(PATHNAME, { [PATHNAME]: page?.title ?? FALLBACK_TITLE })])

  return (
    <>
      <SiteHeader
        header={header}
        variant={page?.headerVariant === 'transparent' ? 'transparent' : 'default'}
      />

      <main id="main" className={`sdl-page sdl-page--insights${themeClass}`}>
        {page?.layout?.length ? (
          <RenderBlocks
            layout={page.layout}
            resolved={resolved}
            theme={theme}
            template={page.template ?? null}
          />
        ) : (
          /* Only until an editor creates the page — never a second place to edit this copy.
             Same `.sdl-hero` grid, kicker and heading structure RenderBlocks gives every other
             inner page's hero block (EVOQ's is the direct reference), so this reads as one more
             page in the set rather than a placeholder. */
          <header className="sdl-hero sdl-insights-hero">
            <div className="sdl-hero-copy-wrap">
              <div className="sdl-kicker-wrap">
                <Kicker>{FALLBACK_TITLE}</Kicker>
              </div>
              <AccentLines lines={FALLBACK_HEADING_LINES} as="h1" className="sdl-hero-copy" />
              <p className="sdl-hero-sub">{FALLBACK_INTRO}</p>
            </div>
            <HeroVisual visualKey="insights-feed" />
          </header>
        )}

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
