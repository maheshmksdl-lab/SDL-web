import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

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

  /*
   * Related reading, preferring the same category before falling back to the newest.
   *
   * Two reads rather than one filtered read because "same category" can legitimately return
   * nothing — a category with a single article — and a sidebar that empties itself in that case
   * looks broken. The fallback is queried unconditionally so both are in flight together.
   */
  const categoryId =
    typeof insight.category === 'object' && insight.category
      ? insight.category.id
      : (insight.category ?? null)

  const [sameCategory, newest] = await Promise.all([
    categoryId ? getInsights({ limit: 6, categoryId }) : Promise.resolve([]),
    getInsights({ limit: 8 }),
  ])

  const related = [...sameCategory, ...newest]
    .filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index)
    .filter((item) => item.slug !== insight.slug)
    .slice(0, 5)

  const tags = (insight.tags ?? []).filter((tag): tag is string => Boolean(tag?.trim()))

  const ld = jsonLdScript([
    breadcrumbJsonLd(`/insights/${slug}`, { [`/insights/${slug}`]: insight.title }),
    articleJsonLd(insight, settings),
  ])

  return (
    <>
      <SiteHeader header={header} />

      <main id="main" className="sdl-page sdl-page--article">
        <article className="sdl-article">
          {/* Title beside the hero image, as the design lays it out. */}
          <header className="sdl-article-header">
            <div className="sdl-section-inner sdl-article-header__inner">
              <div className="sdl-article-header__text">
                {category ? <Kicker>{category}</Kicker> : null}
                <h1 className="sdl-article-title">{insight.title}</h1>
                <p className="sdl-article-meta">
                  {published ? (
                    <time dateTime={insight.publishedAt ?? undefined}>{published}</time>
                  ) : null}
                  {published && insight.author ? <span aria-hidden="true">·</span> : null}
                  {insight.author ? <span>By {insight.author}</span> : null}
                  {insight.readTime ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{insight.readTime}</span>
                    </>
                  ) : null}
                </p>
              </div>

              {hero ? (
                <div className="sdl-article-header__figure">
                  <Image
                    src={hero.src}
                    alt={hero.alt || insight.title}
                    width={hero.width ?? 1200}
                    height={hero.height ?? 630}
                    sizes="(max-width: 900px) 100vw, 560px"
                    priority
                  />
                </div>
              ) : (
                <div
                  className="sdl-article-header__figure sdl-article-figure--swatch"
                  style={{ '--swatch': swatch } as React.CSSProperties}
                />
              )}
            </div>
          </header>

          <nav className="sdl-article-crumbs" aria-label="Breadcrumb">
            <div className="sdl-section-inner">
              <ol>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <Link href="/insights">Insights</Link>
                </li>
                <li aria-current="page">{insight.title}</li>
              </ol>
            </div>
          </nav>

          <div className="sdl-section sdl-section--white sdl-article-body-section">
            <div className="sdl-section-inner sdl-article-layout">
              <div className="sdl-article-body">
                {insight.excerpt ? (
                  <p className="sdl-article-standfirst">{insight.excerpt}</p>
                ) : null}
                <RichText content={insight.body} />
              </div>

              {/* Rendered only when it has something in it, so an article with neither
                  related reading nor tags keeps the full column width. */}
              {related.length || tags.length ? (
                <aside className="sdl-article-aside">
                  {related.length ? (
                    <section className="sdl-article-aside__card">
                      <h2>Related Blogs</h2>
                      <ul className="sdl-article-related">
                        {related.map((item) => (
                          <li key={item.id}>
                            <Link href={`/insights/${item.slug}`}>{item.title}</Link>
                            {formatDate(item.publishedAt) ? (
                              <time dateTime={item.publishedAt ?? undefined}>
                                {formatDate(item.publishedAt)}
                              </time>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {tags.length ? (
                    <section className="sdl-article-aside__card">
                      <h2>Tags</h2>
                      <ul className="sdl-article-tags">
                        {tags.map((tag) => (
                          <li key={tag}>
                            <Link href={`/insights?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </aside>
              ) : null}
            </div>
          </div>
        </article>
      </main>

      <SiteFooter footer={footer} />

      {ld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} /> : null}
    </>
  )
}
