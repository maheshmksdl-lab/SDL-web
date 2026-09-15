import type { Insight, Page, Service, SiteSetting } from './payload-types'
import { resolveMedia } from './links'
import { absoluteUrl } from './seo'

/**
 * Structured data (schema.org JSON-LD).
 *
 * Organisation + WebSite go in the root layout; the per-route graphs (BreadcrumbList, Article,
 * Service) are emitted by the page that has the data. Everything is server-generated from CMS
 * content — no user input is interpolated into a script tag.
 *
 * See plan §6.9.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

type JsonLdNode = Record<string, unknown>

/** Organisation and WebSite — the site-wide graph, rendered once in the layout. */
export function organisationJsonLd(settings: SiteSetting): JsonLdNode {
  const logo = resolveMedia(settings.organisationLogo)
  const sameAs = [
    settings.linkedinUrl,
    settings.twitterUrl,
    settings.youtubeUrl,
    settings.instagramUrl,
  ].filter((url): url is string => Boolean(url))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: settings.legalName || settings.siteName || 'Social DNA Labs',
        url: SITE_URL,
        ...(logo ? { logo: logo.src } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(settings.supportEmail ? { email: settings.supportEmail } : {}),
        ...(settings.supportPhone ? { telephone: settings.supportPhone } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: settings.siteName || 'Social DNA Labs',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  }
}

/** BreadcrumbList from a pathname. `/services/ai-transformation` → Home › Services › AI… */
export function breadcrumbJsonLd(pathname: string, titleByPath: Record<string, string> = {}): JsonLdNode | null {
  if (pathname === '/') return null

  const segments = pathname.replace(/^\/|\/$/g, '').split('/')
  const items = [{ name: 'Home', path: '/' }]

  let acc = ''
  for (const segment of segments) {
    acc += `/${segment}`
    items.push({
      name: titleByPath[acc] ?? toTitleCase(segment),
      path: acc,
    })
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/** Article graph for an insight detail page. */
export function articleJsonLd(insight: Insight, settings: SiteSetting): JsonLdNode {
  const image = resolveMedia(insight.thumbnail, 'og') ?? resolveMedia(insight.thumbnail)
  return {
    '@context': 'https://schema.org',
    '@type': insight.kind === 'whitepaper' ? 'Report' : 'Article',
    headline: insight.seo?.title || insight.title,
    description: insight.seo?.description || insight.excerpt || undefined,
    url: absoluteUrl(`/insights/${insight.slug}`),
    ...(image ? { image: [image.src] } : {}),
    ...(insight.publishedAt ? { datePublished: insight.publishedAt } : {}),
    ...(insight.updatedAt ? { dateModified: insight.updatedAt } : {}),
    ...(insight.author ? { author: { '@type': 'Person', name: insight.author } } : {}),
    publisher: {
      '@type': 'Organization',
      name: settings.legalName || settings.siteName || 'Social DNA Labs',
    },
  }
}

/** Service graph for a service-detail page. */
export function serviceJsonLd(page: Pick<Page, 'title' | 'pathname'>, service: Service | null, settings: SiteSetting): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service?.title || page.title,
    ...(service?.shortDesc ? { description: service.shortDesc } : {}),
    url: absoluteUrl(page.pathname ?? '/'),
    provider: {
      '@type': 'Organization',
      name: settings.legalName || settings.siteName || 'Social DNA Labs',
      url: SITE_URL,
    },
  }
}

/** Serialises a node (or array of nodes) for a <script type="application/ld+json">. */
export function jsonLdScript(node: JsonLdNode | (JsonLdNode | null)[] | null): string {
  const nodes = Array.isArray(node) ? node.filter(Boolean) : node ? [node] : []
  if (!nodes.length) return ''
  return JSON.stringify(nodes.length === 1 ? nodes[0] : nodes)
}

/** Sentence case from a slug — only a fallback; the leaf segment normally gets the real title. */
function toTitleCase(slug: string): string {
  const words = slug.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
