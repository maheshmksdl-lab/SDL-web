'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import type { Insight, Product, Service } from '@/lib/payload-types'
import { resolveMedia } from '@/lib/links'
import { insightColors } from '@/lib/registries/swatches'
import { CONTENT_TYPES, categoryLabel, labelForKind } from '@/lib/insights'

/**
 * The /insights index: search, three facet groups, sort, and a numbered pager.
 *
 * Filtering runs in the browser over the full published set (see `getAllInsights`). The reason
 * is the design itself: it puts a COUNT beside every facet, and counts that stay honest while
 * you tick boxes are a per-facet aggregation. Doing that server-side is one query per facet on
 * every click; doing it here is one pass over an array the page has already loaded.
 *
 * The cards are the homepage "Think ahead" carousel's (`.sdl-insight-card`, styled verbatim in
 * insights-carousel.css) laid into a grid, so an article looks the same wherever it is listed.
 */

type FacetOption = { value: string; label: string; count: number }
type GroupKey = 'kind' | 'service' | 'product'
type Selection = Record<GroupKey, string[]>
type SortKey = 'newest' | 'oldest' | 'az'

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A–Z' },
]

// Four rows of the three-across grid; the pager takes over after that.
const PAGE_SIZE = 12

/** A relationship arrives as an id or the resolved document, depending on depth. */
function relIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) =>
      typeof entry === 'object' && entry !== null ? (entry as { id?: number | string }).id : entry,
    )
    .filter((id): id is number | string => id !== undefined && id !== null)
    .map(String)
}

function haystack(insight: Insight): string {
  return [insight.title, insight.excerpt, categoryLabel(insight), ...(insight.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const publishedTime = (insight: Insight) =>
  insight.publishedAt ? new Date(insight.publishedAt).getTime() : 0

/** Page numbers to show, with `null` standing for a gap: 1 … 4 5 6 … 12. */
function pageList(current: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const pages = new Set([1, count, current - 1, current, current + 1])
  const sorted = [...pages].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b)
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1]! > 1 ? [null, n] : [n]))
}

export function InsightsExplorer({
  insights,
  services,
  products,
}: {
  insights: Insight[]
  services: Service[]
  products: Product[]
}) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Selection>({ kind: [], service: [], product: [] })
  const resultsRef = useRef<HTMLDivElement>(null)

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    kind: true,
    service: true,
    product: true,
  })

  /*
   * Deep links: /insights?type=case-study, ?q=cloud, ?tag=AI transformation.
   *
   * This is what lets the header's "Case studies" nav item mean something, and what makes the
   * tag chips and search box on an article lead somewhere.
   *
   * Read from window.location rather than `useSearchParams`, deliberately: that hook opts the
   * whole route out of static rendering unless it is wrapped in Suspense, and this page is
   * prerendered. The parameters only refine an already-complete list, so applying them a frame
   * after mount costs nothing — the full set renders first either way.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const types = (params.get('type') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => CONTENT_TYPES.some((type) => type.value === value))

    // A tag is not a facet — it is a label on the article — so it seeds the search box, which
    // already matches against tags.
    const term = params.get('q') ?? params.get('tag') ?? ''

    if (types.length) setSelected((current) => ({ ...current, kind: types }))
    if (term) setSearch(term)
  }, [])

  // Stacked above the results on a narrow screen, the two long facet lists would push the first
  // card a screen and a half down, so there they start closed. Server HTML is always the open,
  // desktop rendering; this only folds it after mount.
  useEffect(() => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setOpenGroups((current) => ({ ...current, service: false, product: false }))
    }
  }, [])

  // Indexed once so neither filtering nor counting re-walks the relationship arrays.
  const indexed = useMemo(
    () =>
      insights.map((insight) => ({
        insight,
        kind: insight.kind ?? 'blog',
        services: relIds(insight.services),
        products: relIds(insight.products),
        text: haystack(insight),
      })),
    [insights],
  )

  const term = search.trim().toLowerCase()

  const searched = useMemo(
    () => (term ? indexed.filter((row) => row.text.includes(term)) : indexed),
    [indexed, term],
  )

  const matchesGroup = (
    row: (typeof indexed)[number],
    group: GroupKey,
    chosen: Selection,
  ): boolean => {
    const picks = chosen[group]
    if (!picks.length) return true
    if (group === 'kind') return picks.includes(row.kind)
    if (group === 'service') return row.services.some((id) => picks.includes(id))
    return row.products.some((id) => picks.includes(id))
  }

  const matching = useMemo(
    () =>
      searched.filter(
        (row) =>
          matchesGroup(row, 'kind', selected) &&
          matchesGroup(row, 'service', selected) &&
          matchesGroup(row, 'product', selected),
      ),
    [searched, selected],
  )

  /*
   * Counts for one group are taken with that group's OWN selection lifted, which is what makes
   * a facet list usable: ticking "Blog" must not collapse every other content type to (0), or
   * you could never widen the selection without first clearing it.
   */
  function countsFor(group: GroupKey, options: { value: string; label: string }[]): FacetOption[] {
    const others: Selection = { ...selected, [group]: [] }
    const pool = searched.filter(
      (row) =>
        matchesGroup(row, 'kind', others) &&
        matchesGroup(row, 'service', others) &&
        matchesGroup(row, 'product', others),
    )

    return options.map((option) => ({
      ...option,
      count: pool.filter((row) =>
        group === 'kind'
          ? row.kind === option.value
          : (group === 'service' ? row.services : row.products).includes(option.value),
      ).length,
    }))
  }

  const groups: { key: GroupKey; title: string; options: FacetOption[] }[] = [
    { key: 'kind', title: 'Content Types', options: countsFor('kind', CONTENT_TYPES) },
    {
      key: 'service',
      title: 'Services',
      options: countsFor(
        'service',
        services.map((service) => ({ value: String(service.id), label: service.title })),
      ),
    },
    {
      key: 'product',
      title: 'Products',
      options: countsFor(
        'product',
        products.map((product) => ({ value: String(product.id), label: product.label })),
      ),
    },
  ]

  /*
   * Sorted, then given the homepage carousel's fallback swatch: cards WITHOUT a thumbnail cycle
   * through `insightColors`, and the counter advances only on those — the same rule the
   * carousel applies, so a swatch card reads the same here as it does on the homepage.
   */
  const sorted = useMemo(() => {
    const rows = [...matching]
    if (sort === 'az') rows.sort((a, b) => a.insight.title.localeCompare(b.insight.title))
    else if (sort === 'oldest') rows.sort((a, b) => publishedTime(a.insight) - publishedTime(b.insight))
    else rows.sort((a, b) => publishedTime(b.insight) - publishedTime(a.insight))

    let colorIndex = 0
    return rows.map((row) => {
      const image =
        resolveMedia(row.insight.thumbnail, 'insight') ?? resolveMedia(row.insight.thumbnail)
      if (image) return { ...row, image, swatch: null }
      const swatch = insightColors[colorIndex % insightColors.length]!
      colorIndex += 1
      return { ...row, image: null, swatch }
    })
  }, [matching, sort])

  // A narrower result set should start on its first page, not part-way through the old one.
  function restart() {
    setPage(1)
  }

  function toggle(group: GroupKey, value: string) {
    setSelected((current) => {
      const picks = current[group]
      return {
        ...current,
        [group]: picks.includes(value) ? picks.filter((v) => v !== value) : [...picks, value],
      }
    })
    restart()
  }

  function goTo(next: number) {
    setPage(next)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
  }

  const activeCount = selected.kind.length + selected.service.length + selected.product.length
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const first = (current - 1) * PAGE_SIZE
  const shown = sorted.slice(first, first + PAGE_SIZE)

  return (
    <div className="sdl-insights-index">
      <aside className="sdl-insights-sidebar" aria-label="Filter insights">
        <div className="sdl-insights-search">
          <input
            type="search"
            value={search}
            placeholder="Search..."
            aria-label="Search insights"
            onChange={(event) => {
              setSearch(event.target.value)
              restart()
            }}
          />
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <circle cx="9" cy="9" r="6" />
            <line x1="13.5" y1="13.5" x2="18" y2="18" />
          </svg>
        </div>

        {groups.map((group) => {
          const open = openGroups[group.key] !== false
          const listId = `sdl-insights-facet-${group.key}`
          return (
            <section key={group.key} className="sdl-insights-panel">
              <h2 className="sdl-insights-panel__title">
                <button
                  type="button"
                  className="sdl-insights-panel__toggle"
                  aria-expanded={open}
                  aria-controls={listId}
                  onClick={() =>
                    setOpenGroups((state) => ({ ...state, [group.key]: !open }))
                  }
                >
                  <span>{group.title}</span>
                  <svg viewBox="0 0 16 16" aria-hidden="true" data-open={open} focusable="false">
                    <path d="M3 10l5-5 5 5" />
                  </svg>
                </button>
              </h2>

              {open ? (
                <ul className="sdl-insights-panel__list" id={listId}>
                  {group.options.map((option) => {
                    const checked = selected[group.key].includes(option.value)
                    return (
                      <li key={option.value}>
                        <label
                          className="sdl-insights-option"
                          /* Zero results stay visible and selectable — they tell the visitor
                             the category exists but is empty. */
                          data-empty={option.count === 0 && !checked ? 'true' : undefined}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(group.key, option.value)}
                          />
                          <span className="sdl-insights-option__box" aria-hidden="true" />
                          <span className="sdl-insights-option__label">{option.label}</span>
                          <span className="sdl-insights-option__count">{option.count}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </section>
          )
        })}
      </aside>

      <div className="sdl-insights-results" ref={resultsRef}>
        <h2 className="sdl-visually-hidden">All insights</h2>

        <div className="sdl-insights-toolbar">
          <p className="sdl-insights-toolbar__count" role="status">
            {sorted.length
              ? `Showing ${first + 1}–${first + shown.length} of ${sorted.length} ${
                  sorted.length === 1 ? 'insight' : 'insights'
                }`
              : 'No insights found'}
          </p>
          <div className="sdl-insights-toolbar__actions">
            {activeCount > 0 ? (
              <button
                type="button"
                className="sdl-insights-toolbar__clear"
                onClick={() => {
                  setSelected({ kind: [], service: [], product: [] })
                  restart()
                }}
              >
                Clear filters
              </button>
            ) : null}
            <label className="sdl-insights-sort">
              <span>Sort by</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortKey)
                  restart()
                }}
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="sdl-insights-empty">
            No insights match those filters yet. Try clearing a filter or searching for something
            broader.
          </p>
        ) : (
          <ul className="sdl-insights-grid">
            {shown.map(({ insight, image, swatch }) => {
              const tag = categoryLabel(insight) ?? labelForKind(insight.kind)
              return (
                <li key={insight.id} className="sdl-insights-grid__item">
                  <Link
                    href={`/insights/${insight.slug}`}
                    className={
                      swatch
                        ? `sdl-insight-card sdl-insight-card--color sdl-insight-card--${swatch.text}`
                        : 'sdl-insight-card'
                    }
                    style={swatch ? { background: swatch.bg } : undefined}
                  >
                    {image ? (
                      /* An <Image> under the carousel's own overlay rather than its CSS
                         background, so the grid gets responsive sizes and lazy loading. The
                         title is the link's text, so the picture itself is decorative. */
                      <Image
                        className="sdl-insights-card__image"
                        src={image.src}
                        alt=""
                        fill
                        sizes="(max-width: 520px) 100vw, (max-width: 1100px) 50vw, 300px"
                      />
                    ) : null}

                    <div className="sdl-insight-top-row">
                      <span className="sdl-insight-thumb-badge">{tag}</span>
                      <span className="sdl-insight-link-icon" aria-hidden="true">
                        ↗
                      </span>
                    </div>

                    <div className="sdl-insight-body">
                      <h3 className="sdl-insight-title">{insight.title}</h3>
                      <div className="sdl-insight-meta">
                        {insight.readTime ? (
                          <span className="sdl-insights-card__time">
                            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                              <circle cx="8" cy="8" r="6.2" />
                              <path d="M8 4.6V8l2.4 1.6" />
                            </svg>
                            {insight.readTime}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="read-link">
                          Read More <span aria-hidden="true">↗</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {pageCount > 1 ? (
          <nav className="sdl-insights-pager" aria-label="Insights pages">
            <ul>
              {current > 1 ? (
                <li>
                  <button type="button" aria-label="Previous page" onClick={() => goTo(current - 1)}>
                    ‹
                  </button>
                </li>
              ) : null}
              {pageList(current, pageCount).map((n, index) =>
                n === null ? (
                  <li key={`gap-${index}`} className="sdl-insights-pager__gap" aria-hidden="true">
                    …
                  </li>
                ) : (
                  <li key={n}>
                    <button
                      type="button"
                      aria-label={`Page ${n}`}
                      aria-current={n === current ? 'page' : undefined}
                      onClick={() => goTo(n)}
                    >
                      {n}
                    </button>
                  </li>
                ),
              )}
              {current < pageCount ? (
                <li>
                  <button type="button" aria-label="Next page" onClick={() => goTo(current + 1)}>
                    ›
                  </button>
                </li>
              ) : null}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  )
}

export default InsightsExplorer
