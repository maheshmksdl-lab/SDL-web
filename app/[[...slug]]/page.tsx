import type { Metadata } from 'next'
import { notFound, redirect, permanentRedirect } from 'next/navigation'

import { RenderBlocks } from '@/components/render-blocks'
import { SiteHeader } from '@/components/chrome/site-header'
import { SiteFooter } from '@/components/chrome/site-footer'
import {
  getAllPagePathnames, getFooter, getHeader, getPageByPathname, getRedirect,
  getServiceBySlug, getSiteSettings,
} from '@/lib/cms/queries'
import { resolveBlockData } from '@/lib/cms/resolvers'
import { breadcrumbJsonLd, jsonLdScript, serviceJsonLd } from '@/lib/jsonld'
import { layoutAnchors } from '@/lib/links'
import { buildMetadata } from '@/lib/seo'
import { themeForLayout } from '@/lib/theme'

/**
 * The only page route.
 *
 * Every CMS page resolves here through a single indexed lookup on `pathname`. There are NO
 * slug conditionals in this file, and there must never be: a block that needs collection data
 * declares a resolver in lib/cms/resolvers.ts instead. See plan §3.3 for what happens otherwise.
 */

export const dynamicParams = true

/** Pre-renders every published page at build; anything published later renders on first hit. */
export async function generateStaticParams() {
  const pathnames = await getAllPagePathnames()
  return pathnames.map((pathname) => ({
    // '/' is the index route, which the optional catch-all expresses as no segments at all.
    slug: pathname === '/' ? [] : pathname.replace(/^\//, '').split('/'),
  }))
}

function toPathname(slug: string[] | undefined): string {
  if (!slug?.length) return '/'
  return `/${slug.join('/')}`
}

/**
 * Requests that are plainly for a file, not a page.
 *
 * A root-level optional catch-all matches EVERYTHING, so a browser asking for `/favicon.ico`,
 * a crawler probing `/robots.txt`, or any 404'd asset reference all arrive here and would
 * otherwise cost a CMS round trip each before 404ing. Observed in the dev log as
 * `GET /favicon.ico 500`.
 *
 * A CMS page slug can never contain a dot (the Pages collection validates
 * `^[a-z0-9]+(?:-[a-z0-9]+)*$`), so a dot in the final segment is an unambiguous signal.
 */
function isAssetRequest(slug: string[] | undefined): boolean {
  const last = slug?.[slug.length - 1]
  return typeof last === 'string' && last.includes('.')
}

/**
 * Resolves a page, or ends the request with a redirect or a 404.
 *
 * ── Why there is no route-level `loading.tsx` ──
 *
 * A `loading.tsx` beside this file puts a Suspense boundary ABOVE the page. Next then starts
 * streaming the shell — committing the HTTP status as 200 — before this function resolves, so a
 * `notFound()` renders the 404 body under a **200** status and search engines index missing
 * pages as real ones.
 *
 * Measured, with `/nope`:
 *
 *     with app/loading.tsx ............ 200   (404 body, wrong status)
 *     resolving in generateMetadata ... 200   (does NOT help — see below)
 *     without app/loading.tsx ......... 404   ✓
 *
 * Resolving here and calling it from `generateMetadata` was tried on the theory that metadata
 * runs before the shell is flushed. It does not help: Next runs metadata and the page render
 * concurrently, so streaming still starts first. Only removing the boundary fixes the status.
 *
 * Per-section loading UI still belongs in the design — `app/_loading-skeleton.tsx` holds the
 * skeleton markup, to be used inside <Suspense> around individual slow sections, where a
 * boundary below the page cannot affect its status.
 *
 * generateMetadata still calls this so both paths share one code path; both hit the same cache
 * entry, so it costs one CMS request rather than two.
 */
async function resolvePageOrExit(pathname: string) {
  const page = await getPageByPathname(pathname)
  if (page) return page

  // Check the redirect map before 404ing, so a renamed page does not strand inbound links.
  const rule = await getRedirect(pathname)
  if (rule) {
    if (rule.type === '302') redirect(rule.to)
    permanentRedirect(rule.to)
  }

  notFound()
}

export async function generateMetadata(props: PageProps<'/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await props.params
  if (isAssetRequest(slug)) return {}

  const pathname = toPathname(slug)
  const [page, settings] = await Promise.all([resolvePageOrExit(pathname), getSiteSettings()])

  return buildMetadata({ page, settings, pathname })
}

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const { slug } = await props.params
  if (isAssetRequest(slug)) notFound()

  const pathname = toPathname(slug)

  // generateMetadata has normally already ended the request for an unknown path; this is the
  // backstop for any path where it did not run.
  const page = await resolvePageOrExit(pathname)

  const isServicePage = page.template === 'service' || page.template === 'sub-service'
  const serviceSlug = pathname.split('/').pop() ?? ''

  const [header, footer, settings, service, resolved] = await Promise.all([
    getHeader(),
    getFooter(),
    getSiteSettings(),
    isServicePage && serviceSlug ? getServiceBySlug(serviceSlug) : Promise.resolve(null),
    resolveBlockData(page.layout),
  ])

  const graphs = [
    breadcrumbJsonLd(pathname),
    isServicePage ? serviceJsonLd(page, service, settings) : null,
  ]
  const ld = jsonLdScript(graphs)

  /*
   * The page-template class carries the four type scales the design uses. Without it every page
   * would render at the service-page scale, because that is the majority value the shared
   * stylesheet holds. See web/styles/variants.css.
   */
  const templateClass = page.template && page.template !== 'service' ? ` sdl-page--${page.template}` : ''

  /*
   * The page theme — the class prefix the design page owns (`bt`, `ce`, `evoq`, …), derived from
   * the hero visual. Sections use it to render the design's own prefixed markup; the class here
   * scopes the few unprefixed values a page changes (its accent colour, EVOQ's dotted grounds).
   * See lib/theme.ts and styles/variants.css.
   */
  const theme = themeForLayout(page.layout)
  const themeClass = theme ? ` sdl-theme--${theme}` : ''
  const pageAnchors = layoutAnchors(page.layout)

  return (
    <>
      <SiteHeader
        header={header}
        variant={page.headerVariant === 'transparent' ? 'transparent' : 'default'}
        pageAnchors={pageAnchors}
      />
      <main id="main" className={`sdl-page${templateClass}${themeClass}`}>
        <RenderBlocks layout={page.layout} resolved={resolved} theme={theme} template={page.template ?? null} />
      </main>
      {page.hideFooter ? null : <SiteFooter footer={footer} pageAnchors={pageAnchors} />}
      {ld ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
      ) : null}
    </>
  )
}
