'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import type { Insight, Product, Service } from '@/lib/payload-types'
import { resolveMedia } from '@/lib/links'

/**
 * The /insights index: search, three facet groups, sort, and a Load More pager.
 *
 * Filtering runs in the browser over the full published set (see `getAllInsights`). The reason
 * is the design itself: it puts a COUNT beside every facet, and counts that stay honest while
 * you tick boxes are a per-facet aggregation. Doing that server-side is one query per facet on
 * every click; doing it here is one pass over an array the page has already loaded.
 */

type FacetOption = { value: string; label: string; count: number }
type GroupKey = 'kind' | 'service' | 'product'
type Selection = Record<GroupKey, string[]>
type SortKey = 'newest' | 'oldest' | 'az'

/** The four content types, and the only place their labels are spelled for the visitor. */
const CONTENT_TYPES: { value: string; label: string }[] = [
  { value: 'blog', label: 'Blog' },
  { value: 'case-study', label: 'Case Studies' },
  { value: 'whitepaper', label: 'White Papers' },
  { value: 'featured-project', label: 'Featured Projects' },
]

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A–Z' },
]

const PAGE_SIZE = 9

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

function labelForKind(kind?: string | null): string {
  return CONTENT_TYPES.find((type) => type.value === kind)?.label ?? 'Blog'
}

function haystack(insight: Insight): string {
  const category =
    typeof insight.category === 'object' && insight.category ? insight.category.label : ''
  return [insight.title, insight.excerpt, category, ...(insight.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
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
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState<Selection>({ kind: [], service: [], product: [] })
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    kind: true,
    service: true,
    product: true,
  })

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

  const sorted = useMemo(() => {
    const rows = [...matching]
    const time = (insight: Insight) =>
      insight.publishedAt ? new Date(insight.publishedAt).getTime() : 0
    if (sort === 'az') rows.sort((a, b) => a.insight.title.localeCompare(b.insight.title))
    else if (sort === 'oldest') rows.sort((a, b) => time(a.insight) - time(b.insight))
    else rows.sort((a, b) => time(b.insight) - time(a.insight))
    return rows
  }, [matching, sort])

  function toggle(group: GroupKey, value: string) {
    setSelected((current) => {
      const picks = current[group]
      return {
        ...current,
        [group]: picks.includes(value) ? picks.filter((v) => v !== value) : [...picks, value],
      }
    })
    // A narrower result set should start at the top, not mid-way down a previous "load more".
    setVisible(PAGE_SIZE)
  }

  const activeCount = selected.kind.length + selected.service.length + selected.product.length
  const shown = sorted.slice(0, visible)

  return (
    <div className="sdl-insights-index">
      <aside className="sdl-insights-sidebar" aria-label="Filter insights">
        <div className="sdl-insights-search">
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <circle cx="9" cy="9" r="6" />
            <line x1="13.5" y1="13.5" x2="18" y2="18" />
          </svg>
          <input
            type="search"
            value={search}
            placeholder="Search insights..."
            aria-label="Search insights"
            onChange={(event) => {
              setSearch(event.target.value)
              setVisible(PAGE_SIZE)
            }}
          />
        </div>

        <div className="sdl-insights-filters">
          <div className="sdl-insights-filters__head">
            <span className="sdl-insights-filters__icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" focusable="false">
                <path d="M2 4h16l-6 7v5l-4 2v-7z" />
              </svg>
            </span>
            <h2>Filter By</h2>
            {activeCount > 0 ? (
              <button
                type="button"
                className="sdl-insights-filters__clear"
                onClick={() => {
                  setSelected({ kind: [], service: [], product: [] })
                  setVisible(PAGE_SIZE)
                }}
              >
                Clear
              </button>
            ) : null}
          </div>

          {groups.map((group) => {
            const open = openGroups[group.key] !== false
            return (
              <section key={group.key} className="sdl-insights-group">
                <button
                  type="button"
                  className="sdl-insights-group__toggle"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenGroups((current) => ({ ...current, [group.key]: !open }))
                  }
                >
                  <span>{group.title}</span>
                  <svg viewBox="0 0 16 16" aria-hidden="true" data-open={open} focusable="false">
                    <path d="M3 10l5-5 5 5" />
                  </svg>
                </button>

                {open ? (
                  <ul className="sdl-insights-group__list">
                    {group.options.map((option) => {
                      const checked = selected[group.key].includes(option.value)
                      return (
                        <li key={option.value}>
                          <label
                            className="sdl-insights-option"
                            /* Zero results stay visible and selectable, as the design shows —
                               they tell the visitor the category exists but is empty. */
                            data-empty={option.count === 0 && !checked ? 'true' : undefined}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(group.key, option.value)}
                            />
                            <span className="sdl-insights-option__box" aria-hidden="true" />
                            <span className="sdl-insights-option__label">{option.label}</span>
                            <span className="sdl-insights-option__count">({option.count})</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </section>
            )
          })}
        </div>
      </aside>

      <div className="sdl-insights-results">
        <div className="sdl-insights-results__head">
          <h2 className="sdl-insights-results__title">All Insights</h2>
          <label className="sdl-insights-sort">
            <span>Sort by:</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {shown.length === 0 ? (
          <p className="sdl-insights-empty" role="status">
            No insights match those filters yet. Try clearing a filter or searching for something
            broader.
          </p>
        ) : (
          <ul className="sdl-insights-grid">
            {shown.map(({ insight }) => {
              const image = resolveMedia(insight.thumbnail, 'insight') ?? resolveMedia(insight.thumbnail)
              return (
                <li key={insight.id} className="sdl-insights-card">
                  <Link href={`/insights/${insight.slug}`} className="sdl-insights-card__media">
                    {image ? (
                      <Image
                        src={image.src}
                        alt={image.alt || insight.title}
                        width={image.width ?? 720}
                        height={image.height ?? 900}
                        sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 320px"
                      />
                    ) : (
                      <span
                        className="sdl-insights-card__swatch"
                        data-swatch={insight.swatch ?? 'accent'}
                        aria-hidden="true"
                      />
                    )}
                  </Link>

                  <div className="sdl-insights-card__body">
                    <div className="sdl-insights-card__meta">
                      <span className="sdl-insights-card__badge">{labelForKind(insight.kind)}</span>
                      {insight.readTime ? (
                        <span className="sdl-insights-card__time">
                          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                            <circle cx="8" cy="8" r="6.2" />
                            <path d="M8 4.6V8l2.4 1.6" />
                          </svg>
                          {insight.readTime}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="sdl-insights-card__title">
                      <Link href={`/insights/${insight.slug}`}>{insight.title}</Link>
                    </h3>

                    {insight.excerpt ? (
                      <p className="sdl-insights-card__excerpt">{insight.excerpt}</p>
                    ) : null}

                    <Link href={`/insights/${insight.slug}`} className="sdl-insights-card__cta">
                      Read More
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {sorted.length > visible ? (
          <div className="sdl-insights-more">
            <button type="button" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
              Load More Insights
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default InsightsExplorer
