import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'

import { SiteHeader } from '@/components/chrome/site-header'
import { SiteFooter } from '@/components/chrome/site-footer'
import { Kicker } from '@/components/ui/primitives'
import {
  getFooter, getHeader, getInsightBySlug, getInsightSlugs, getInsights, getSiteSettings,
} from '@/lib/cms/queries'
import { resolveMedia } from '@/lib/links'
import { articleJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/jsonld'
import { RichText, lexicalToPlainText } from '@/lib/lexical'
import { buildMetadata } from '@/lib/seo'

/**
 * Insight / article detail.
 *
 * The one collection-detail route (plan §6.4) — everything else is the page builder. The
 * design ships no layout for this, so it is built from the design's own primitives (`.sdl-section`,
 * `.sdl-kicker`) plus a small prose stylesheet.
 */

export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getInsightSlugs()
  return slugs.map((slug) => ({ slug }))
}

const swatchVar: Record<string, string> = {
  accent: 'var(--accent)',
  success: 'var(--success)',
  attention: 'var(--attention)',
}

export async function generateMetadata(props: PageProps<'/insights/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const [insight, settings] = await Promise.all([getInsightBySlug(slug), getSiteSettings()])
  if (!insight) return {}

  return buildMetadata({
    page: {
      title: insight.title,
      seo: insight.seo,
      ogType: 'article',
      excerpt: insight.excerpt || lexicalToPlainText(insight.body, 160) || null,
    },
    settings,
    pathname: `/insights/${slug}`,
  })
}

function formatDate(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function InsightPage(props: PageProps<'/insights/[slug]'>) {
  const { slug } = await props.params

  const [insight, header, footer, settings] = await Promise.all([
    getInsightBySlug(slug),
    getHeader(),
    getFooter(),
    getSiteSettings(),
  ])

  if (!insight) notFound()

  const category =
    typeof insight.category === 'object' && insight.category ? insight.category.label : null
  const hero = resolveMedia(insight.thumbnail, 'og') ?? resolveMedia(insight.thumbnail)
  const published = formatDate(insight.publishedAt)
  const swatch = swatchVar[insight.swatch ?? 'accent'] ?? swatchVar.accent

  const related = (await getInsights({ limit: 4 }))
    .filter((i) => i.slug !== insight.slug)
    .slice(0, 3)

  const ld = jsonLdScript([
    breadcrumbJsonLd(`/insights/${slug}`, { [`/insights/${slug}`]: insight.title }),
    articleJsonLd(insight, settings),
  ])

  return (
    <>
      <SiteHeader header={header} />

      <main id="main" className="sdl-page">
        <article className="sdl-article">
          <header className="sdl-section sdl-section--white sdl-article-header">
            <div className="sdl-section-inner">
              {category ? <Kicker>{category}</Kicker> : null}
              <h1 className="sdl-article-title">{insight.title}</h1>
              {insight.excerpt ? <p className="sdl-article-standfirst">{insight.excerpt}</p> : null}
              <p className="sdl-article-meta">
                {insight.author ? <span>{insight.author}</span> : null}
                {insight.author && published ? <span aria-hidden="true"> · </span> : null}
                {published ? <time dateTime={insight.publishedAt ?? undefined}>{published}</time> : null}
                {insight.readTime ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span>{insight.readTime}</span>
                  </>
                ) : null}
              </p>
            </div>
          </header>

          {hero ? (
            <div className="sdl-article-figure sdl-section-inner">
              <Image
                src={hero.src}
                alt={hero.alt || insight.title}
                width={hero.width ?? 1200}
                height={hero.height ?? 630}
                sizes="(max-width: 900px) 100vw, 1120px"
                priority
              />
            </div>
          ) : (
            <div
              className="sdl-article-figure sdl-article-figure--swatch sdl-section-inner"
              style={{ '--swatch': swatch } as React.CSSProperties}
            />
          )}

          <div className="sdl-section sdl-section--white sdl-article-body-section">
            <div className="sdl-article-body sdl-section-inner">
              <RichText content={insight.body} />
            </div>
          </div>
        </article>

        {related.length ? (
          <section className="sdl-section sdl-section--alt">
            <div className="sdl-section-inner">
              <Kicker>More insights</Kicker>
              <ul className="sdl-article-related">
                {related.map((item) => (
                  <li key={item.id}>
                    <a href={`/insights/${item.slug}`}>{item.title}</a>
                    {item.readTime ? <span>{item.readTime}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter footer={footer} />

      {ld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} /> : null}
    </>
  )
}
