import { cache } from 'react'

import { cmsFetch, query, type Paginated } from './client'
import { tags } from './tags'
import type {
  CaseStudy, Client, Footer, Form, Header, Insight, InsightCategory,
  Page, Product, Redirect, Service, SiteSetting, Testimonial,
} from '../payload-types'

/**
 * Every read the site performs.
 *
 * Each carries its own cache tags, so nothing outside this file needs to know the tag
 * vocabulary. Globals and listings take a fallback because a page can still render without a
 * logo strip; the page document itself deliberately does not — see client.ts.
 *
 * ── Why the per-request `cache()` wrappers ──
 *
 * Reads that happen more than once while rendering a single page are wrapped in React's
 * `cache()`, which memoises for the lifetime of one request.
 *
 * Next's own fetch cache already deduplicates in production, but NOT when a request is
 * `no-store` — which is every CMS read in development (client.ts). The dev log showed
 * `/api/globals/site-settings` fetched three times for one page render: once in the layout,
 * once in generateMetadata, once in the page. Three round trips per navigation is slow enough
 * to feel, and it makes the log unreadable when something goes wrong.
 *
 * Only the reads that genuinely repeat are wrapped. A one-per-page read gains nothing.
 */

// ── Pages ────────────────────────────────────────────────────────────────────

/** Called by both `generateMetadata` and the page component — always at least twice. */
export const getPageByPathname = cache(async (pathname: string): Promise<Page | null> => {
  const result = await cmsFetch<Paginated<Page>>(
    `/api/pages${query({ where: { pathname: { equals: pathname } }, limit: 1, depth: 2 })}`,
    { tags: [tags.page(pathname), tags.pages] },
  )
  return result.docs[0] ?? null
})

/** Pathnames for generateStaticParams. Published only — drafts are not pre-rendered. */
export async function getAllPagePathnames(): Promise<string[]> {
  const result = await cmsFetch<Paginated<Pick<Page, 'pathname'>>>(
    `/api/pages${query({ select: ['pathname'], limit: 1000, depth: 0 })}`,
    { tags: [tags.pages], draft: false, fallback: { docs: [], totalDocs: 0, page: 1, totalPages: 0, hasNextPage: false } },
  )
  return result.docs.map((d) => d.pathname).filter((p): p is string => typeof p === 'string')
}

export type SitemapEntry = { path: string; lastModified: string | null; noIndex: boolean }

const EMPTY_PAGE = { docs: [], totalDocs: 0, page: 1, totalPages: 0, hasNextPage: false }

/** Published pages for app/sitemap.ts. Drafts and noindex pages are excluded there. */
export async function getSitemapPages(): Promise<SitemapEntry[]> {
  const result = await cmsFetch<Paginated<Page>>(
    `/api/pages${query({ select: ['pathname', 'updatedAt', 'seo'], limit: 2000, depth: 0 })}`,
    { tags: [tags.pages], draft: false, fallback: EMPTY_PAGE as Paginated<Page> },
  )
  return result.docs
    .filter((d): d is Page & { pathname: string } => typeof d.pathname === 'string')
    .map((d) => ({
      path: d.pathname,
      lastModified: d.updatedAt ?? null,
      noIndex: Boolean(d.seo?.noIndex),
    }))
}

/** Published insights for the sitemap. */
export async function getSitemapInsights(): Promise<SitemapEntry[]> {
  const result = await cmsFetch<Paginated<Insight>>(
    `/api/insights${query({ select: ['slug', 'updatedAt', 'publishedAt', 'seo'], limit: 2000, depth: 0 })}`,
    { tags: [tags.insights], draft: false, fallback: EMPTY_PAGE as Paginated<Insight> },
  )
  return result.docs
    .filter((d): d is Insight & { slug: string } => typeof d.slug === 'string')
    .map((d) => ({
      path: `/insights/${d.slug}`,
      lastModified: d.updatedAt ?? d.publishedAt ?? null,
      noIndex: Boolean(d.seo?.noIndex),
    }))
}

// ── Globals ──────────────────────────────────────────────────────────────────

export const getHeader = cache(() =>
  cmsFetch<Header>('/api/globals/header' + query({ depth: 2 }), {
    tags: [tags.global('header'), tags.pages],
    fallback: {} as Header,
  }),
)

export const getFooter = cache(() =>
  cmsFetch<Footer>('/api/globals/footer' + query({ depth: 2 }), {
    tags: [tags.global('footer'), tags.pages],
    fallback: {} as Footer,
  }),
)

/** Read by the root layout, by generateMetadata, and by the page — three times per render. */
export const getSiteSettings = cache(() =>
  cmsFetch<SiteSetting>('/api/globals/site-settings' + query({ depth: 1 }), {
    tags: [tags.global('site-settings')],
    fallback: {} as SiteSetting,
  }),
)

// ── Collections the blocks pull from ─────────────────────────────────────────

const emptyPage = { docs: [], totalDocs: 0, page: 1, totalPages: 0, hasNextPage: false }

export async function getServices(limit = 6): Promise<Service[]> {
  const result = await cmsFetch<Paginated<Service>>(
    `/api/services${query({ sort: 'order', limit, depth: 1 })}`,
    { tags: [tags.services], fallback: emptyPage as Paginated<Service> },
  )
  return result.docs
}

/** One service by slug — used for Service JSON-LD on a service-detail page. */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const result = await cmsFetch<Paginated<Service>>(
    `/api/services${query({ where: { slug: { equals: slug } }, limit: 1, depth: 0 })}`,
    { tags: [tags.services], fallback: emptyPage as Paginated<Service> },
  )
  return result.docs[0] ?? null
}

export async function getInsights(opts: { limit?: number; categoryId?: number | string } = {}): Promise<Insight[]> {
  const where = opts.categoryId ? { category: { equals: opts.categoryId } } : undefined
  const result = await cmsFetch<Paginated<Insight>>(
    `/api/insights${query({ where, sort: '-publishedAt', limit: opts.limit ?? 6, depth: 1 })}`,
    { tags: [tags.insights], fallback: emptyPage as Paginated<Insight> },
  )
  return result.docs
}

export async function getInsightBySlug(slug: string): Promise<Insight | null> {
  const result = await cmsFetch<Paginated<Insight>>(
    `/api/insights${query({ where: { slug: { equals: slug } }, limit: 1, depth: 2 })}`,
    { tags: [tags.insight(slug), tags.insights] },
  )
  return result.docs[0] ?? null
}

export async function getInsightSlugs(): Promise<string[]> {
  const result = await cmsFetch<Paginated<Pick<Insight, 'slug'>>>(
    `/api/insights${query({ select: ['slug'], limit: 1000, depth: 0 })}`,
    { tags: [tags.insights], draft: false, fallback: emptyPage as Paginated<Pick<Insight, 'slug'>> },
  )
  return result.docs.map((d) => d.slug).filter((s): s is string => typeof s === 'string')
}

/**
 * Every published insight, for the index at /insights.
 *
 * The whole set in one read, filtered in the browser rather than per-request on the server.
 * That is a deliberate trade and it rests on two things the reference design asks for: a COUNT
 * beside every facet, and combinations across three groups. Counting server-side means one
 * query per facet per render, and each additional checkbox is another round trip with a visible
 * pause — for a marketing archive of a few hundred articles the entire payload is smaller than
 * one of the card images.
 *
 * `depth: 1` resolves category, services, products and the thumbnail, which is everything a
 * card and a facet need. If this ever outgrows a single page, the seam is here: swap for a
 * paged, server-filtered query and move the counts into a Payload aggregation endpoint.
 */
export async function getAllInsights(): Promise<Insight[]> {
  const result = await cmsFetch<Paginated<Insight>>(
    `/api/insights${query({ sort: '-publishedAt', limit: 1000, depth: 1 })}`,
    { tags: [tags.insights], fallback: emptyPage as Paginated<Insight> },
  )
  return result.docs
}

export async function getProducts(): Promise<Product[]> {
  const result = await cmsFetch<Paginated<Product>>(
    `/api/products${query({ sort: 'order', limit: 100, depth: 0 })}`,
    { tags: [tags.products], fallback: emptyPage as Paginated<Product> },
  )
  return result.docs
}

export async function getInsightCategories(): Promise<InsightCategory[]> {
  const result = await cmsFetch<Paginated<InsightCategory>>(
    `/api/insight-categories${query({ sort: 'order', limit: 50, depth: 0 })}`,
    { tags: [tags.insightCategories], fallback: emptyPage as Paginated<InsightCategory> },
  )
  return result.docs
}

export async function getClients(featuredOnly = true): Promise<Client[]> {
  const result = await cmsFetch<Paginated<Client>>(
    `/api/clients${query({
      where: featuredOnly ? { featured: { equals: true } } : undefined,
      sort: 'order', limit: 24, depth: 1,
    })}`,
    { tags: [tags.clients], fallback: emptyPage as Paginated<Client> },
  )
  return result.docs
}

export async function getTestimonials(featuredOnly = true, limit = 6): Promise<Testimonial[]> {
  const result = await cmsFetch<Paginated<Testimonial>>(
    `/api/testimonials${query({
      where: featuredOnly ? { featured: { equals: true } } : undefined,
      sort: 'order', limit, depth: 1,
    })}`,
    { tags: [tags.testimonials], fallback: emptyPage as Paginated<Testimonial> },
  )
  return result.docs
}

export async function getCaseStudy(id: number | string): Promise<CaseStudy | null> {
  return cmsFetch<CaseStudy | null>(`/api/case-studies/${id}${query({ depth: 1 })}`, {
    tags: [tags.caseStudies],
    fallback: null,
  })
}

export async function getForm(slugOrId: string | number): Promise<Form | null> {
  if (typeof slugOrId === 'number') {
    return cmsFetch<Form | null>(`/api/forms/${slugOrId}${query({ depth: 1 })}`, {
      tags: [tags.forms], fallback: null,
    })
  }
  const result = await cmsFetch<Paginated<Form>>(
    `/api/forms${query({ where: { slug: { equals: slugOrId } }, limit: 1, depth: 1 })}`,
    { tags: [tags.form(slugOrId), tags.forms], fallback: emptyPage as Paginated<Form> },
  )
  return result.docs[0] ?? null
}

/** Checked before serving a 404, so a renamed page does not leave a dead inbound link. */
export async function getRedirect(from: string): Promise<Redirect | null> {
  const result = await cmsFetch<Paginated<Redirect>>(
    `/api/redirects${query({ where: { from: { equals: from } }, limit: 1, depth: 0 })}`,
    { tags: [tags.redirects], fallback: emptyPage as Paginated<Redirect> },
  )
  return result.docs[0] ?? null
}
