import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { SiteHeader } from '@/components/chrome/site-header'
import { SiteFooter } from '@/components/chrome/site-footer'
import {
  getAllInsights, getFooter, getHeader, getInsightBySlug, getInsightSlugs, getSiteSettings,
} from '@/lib/cms/queries'
import {
  CONTENT_TYPES, categoryLabel, formatLongDate, formatShortDate, labelForKind,
} from '@/lib/insights'
import type { Insight } from '@/lib/payload-types'
import { resolveMedia } from '@/lib/links'
import { articleJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/jsonld'
import { RichText, lexicalToPlainText } from '@/lib/lexical'
import { buildMetadata } from '@/lib/seo'

/**
 * Insight / article detail.
 *
 * The one collection-detail route (plan §6.4) — everything else is the page builder. Laid out
 * as the reference blog post: a grey title bar with the breadcrumb, then the article (image,
 * title, byline, body and previous/next) beside a rail of grey panels — content types, search,
 * related reading and the article's tags. The rail's styles live with the /insights index's
 * (insights-index.css), so the two routes share one sidebar vocabulary.
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

function categoryId(insight: Insight): number | string | null {
  return typeof insight.category === 'object' && insight.category
    ? insight.category.id
    : (insight.category ?? null)
}

export default async function InsightPage(props: PageProps<'/insights/[slug]'>) {
  const { slug } = await props.params

  // The full published set is the index's own cached read; one pass over it gives the related
  // list, the previous/next neighbours and which content types have anything to link to.
  const [insight, all, header, footer, settings] = await Promise.all([
    getInsightBySlug(slug),
    getAllInsights(),
    getHeader(),
    getFooter(),
    getSiteSettings(),
  ])

  if (!insight) notFound()

  const category = categoryLabel(insight)
  const hero = resolveMedia(insight.thumbnail, 'og') ?? resolveMedia(insight.thumbnail)
  const published = formatLongDate(insight.publishedAt)
  const swatch = swatchVar[insight.swatch ?? 'accent'] ?? swatchVar.accent
  const tags = (insight.tags ?? []).filter((tag): tag is string => Boolean(tag?.trim()))

  /*
   * Related reading, preferring the same category before falling back to the newest.
   *
   * "Same category" can legitimately be empty — a category with a single article — and a rail
   * that empties itself in that case looks broken, hence the newest as a fallback.
   */
  const ownCategory = categoryId(insight)
  const others = all.filter((item) => item.slug !== insight.slug)
  const related = [
    ...(ownCategory ? others.filter((item) => categoryId(item) === ownCategory).slice(0, 6) : []),
    ...others.slice(0, 8),
  ]
    .filter((item, index, list) => list.findIndex((other) => other.id === item.id) === index)
    .slice(0, 5)

  // `all` is newest first, so the entry before this one is newer and the one after is older.
  const position = all.findIndex((item) => item.slug === insight.slug)
  const newer = position > 0 ? all[position - 1] : undefined
  const older = position >= 0 ? all[position + 1] : undefined

  // Only types with something in them: each links into a filtered index, never an empty one.
  const kinds = CONTENT_TYPES.filter((type) =>
    all.some((item) => (item.kind ?? 'blog') === type.value),
  )

  const ld = jsonLdScript([
    breadcrumbJsonLd(`/insights/${slug}`, { [`/insights/${slug}`]: insight.title }),
    articleJsonLd(insight, settings),
  ])

  return (
    <>
      <SiteHeader header={header} />

      <main id="main" className="sdl-page sdl-page--article">
        <div className="sdl-article-titlebar">
          <div className="sdl-section-inner sdl-article-titlebar__inner">
            <p className="sdl-article-titlebar__title">{labelForKind(insight.kind)}</p>
            <nav className="sdl-article-crumbs" aria-label="Breadcrumb">
              <ol>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <Link href="/insights">Insights</Link>
                </li>
                <li aria-current="page">{insight.title}</li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="sdl-section sdl-section--white sdl-article-section">
          <div className="sdl-section-inner sdl-article-layout">
            <article className="sdl-article">
              {hero ? (
                <div className="sdl-article-figure">
                  <Image
                    src={hero.src}
                    alt={hero.alt || insight.title}
                    width={hero.width ?? 1200}
                    height={hero.height ?? 630}
                    sizes="(max-width: 960px) 100vw, 880px"
                    priority
                  />
                </div>
              ) : (
                <div
                  className="sdl-article-figure sdl-article-figure--swatch"
                  style={{ '--swatch': swatch } as React.CSSProperties}
                />
              )}

              <header className="sdl-article-header">
                <h1 className="sdl-article-title">{insight.title}</h1>
                <p className="sdl-article-meta">
                  {insight.author ? <span>By {insight.author}</span> : null}
                  {published ? (
                    <time dateTime={insight.publishedAt ?? undefined}>{published}</time>
                  ) : null}
                  {category ? <span>{category}</span> : null}
                  {insight.readTime ? <span>{insight.readTime}</span> : null}
                </p>
              </header>

              <div className="sdl-article-body">
                {insight.excerpt ? (
                  <p className="sdl-article-standfirst">{insight.excerpt}</p>
                ) : null}
                <RichText content={insight.body} />
              </div>

              {newer || older ? (
                <footer className="sdl-article-footer">
                  <nav className="sdl-article-pager" aria-label="More insights">
                    {older ? (
                      <Link
                        href={`/insights/${older.slug}`}
                        rel="prev"
                        aria-label={`Previous insight: ${older.title}`}
                      >
                        <span aria-hidden="true">←</span> Previous
                      </Link>
                    ) : null}
                    {newer ? (
                      <Link
                        href={`/insights/${newer.slug}`}
                        rel="next"
                        aria-label={`Next insight: ${newer.title}`}
                      >
                        Next <span aria-hidden="true">→</span>
                      </Link>
                    ) : null}
                  </nav>
                </footer>
              ) : null}
            </article>

            <aside className="sdl-article-aside" aria-label="More from Insights">
              {kinds.length ? (
                <section className="sdl-insights-panel">
                  <h2 className="sdl-insights-panel__title">Content Types</h2>
                  <ul className="sdl-insights-panel__list">
                    {kinds.map((type) => (
                      <li key={type.value}>
                        <Link
                          href={`/insights?type=${type.value}`}
                          className="sdl-insights-panel__link"
                          aria-current={
                            (insight.kind ?? 'blog') === type.value ? 'true' : undefined
                          }
                        >
                          {type.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* A plain GET into the index, which reads `?q=` on arrival — no script needed. */}
              <form
                className="sdl-insights-search sdl-insights-search--outline"
                action="/insights"
                method="get"
                role="search"
              >
                <input type="search" name="q" placeholder="Search..." aria-label="Search insights" />
                <button type="submit" aria-label="Search">
                  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                    <circle cx="9" cy="9" r="6" />
                    <line x1="13.5" y1="13.5" x2="18" y2="18" />
                  </svg>
                </button>
              </form>

              {related.length ? (
                <section className="sdl-insights-panel">
                  <h2 className="sdl-insights-panel__title">Related Blogs</h2>
                  <ol className="sdl-insights-recent">
                    {related.map((item, index) => {
                      const date = formatShortDate(item.publishedAt)
                      return (
                        <li key={item.id}>
                          <span className="sdl-insights-recent__num" aria-hidden="true">
                            {index + 1}
                          </span>
                          <div className="sdl-insights-recent__body">
                            <Link href={`/insights/${item.slug}`}>{item.title}</Link>
                            <span className="sdl-insights-recent__meta">
                              {labelForKind(item.kind)}
                              {date ? ` - ${date}` : null}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </section>
              ) : null}

              {/* The article's own `tags` from the CMS. Each opens the index searched for that
                  tag, which the search already matches against. */}
              {tags.length ? (
                <section className="sdl-insights-panel">
                  <h2 className="sdl-insights-panel__title">Tags</h2>
                  <ul className="sdl-insights-tags">
                    {tags.map((tag) => (
                      <li key={tag}>
                        <Link href={`/insights?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter footer={footer} />

      {ld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} /> : null}
    </>
  )
}
