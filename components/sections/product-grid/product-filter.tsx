'use client'

import { useEffect, useRef, useState } from 'react'

import { getProductMock } from '@/lib/registries/mocks'
import { evoqProductColors } from '@/lib/registries/swatches'

export type ProductCard = {
  id: string
  title: string
  category: string
  desc: string
  iconKey: string | null
  mockKey: string | null
  /** A photograph behind the mock panels — the design alternates photo and gradient cards. */
  photoUrl: string | null
}

/** evoq.html `EVOQ_CATEGORY_ICONS` — the pill icon is per-category, not per-product. */
const CATEGORY_ICON: Record<string, string> = {
  Growth: '<path d="M3 17l5-6 4 4 8-9"/><path d="M16 6h4v4"/>',
  Operations:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2"/>',
  People:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20c.6-3.6 3-6 6-6s5.4 2.4 6 6"/><circle cx="17" cy="9" r="2.2"/><path d="M15.2 20c.4-2.4 1.6-4.2 3.2-4.2"/>',
}

/** `EVOQ_CATEGORY_COLORS` — the fallback when a product has no colour of its own below. */
const CATEGORY_COLOR: Record<string, string> = { Growth: '#3E5FE0', Operations: '#2B8FDB', People: '#C9941F' }

/** `EVOQ_PRODUCT_COLORS` — each product gets its own brand colour, not just its category's. */
const PRODUCT_COLOR: Record<string, string> = evoqProductColors

const SEARCH_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>'
const ARROW_LEFT = '<path d="M15 18l-6-6 6-6"/>'
const ARROW_RIGHT = '<path d="M9 6l6 6-6 6"/>'

/**
 * The EVOQ product suite: a search box, category tabs, and a horizontally scrolling card row
 * with prev/next arrows — not a wrapping grid. Ported from `renderEvoqProducts` / the arrow
 * `scrollBy` handlers: each arrow scrolls 85% of the row's visible width, and both arrows
 * disable themselves at the corresponding scroll boundary.
 */
export function ProductFilter({ tabs, products }: { tabs: string[]; products: ProductCard[] }) {
  const [active, setActive] = useState(tabs[0] ?? 'All')
  const [term, setTerm] = useState('')
  const rowRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  const showAll = active === (tabs[0] ?? 'All')
  const needle = term.trim().toLowerCase()
  const visible = products.filter((p) => {
    if (!showAll && p.category !== active) return false
    if (!needle) return true
    return p.title.toLowerCase().includes(needle) || p.desc.toLowerCase().includes(needle)
  })

  const updateArrows = () => {
    const row = rowRef.current
    if (!row) return
    const maxScroll = row.scrollWidth - row.clientWidth
    setAtStart(row.scrollLeft <= 4)
    setAtEnd(row.scrollLeft >= maxScroll - 4)
  }

  // Re-measure whenever the filtered set changes size (row width shrinks/grows with it).
  useEffect(updateArrows, [visible.length])

  const scrollByPage = (dir: 1 | -1) => {
    const row = rowRef.current
    if (!row) return
    row.scrollBy({ left: dir * row.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <>
      <div className="evoq-toolbar reveal">
        <div className="evoq-search">
          <span dangerouslySetInnerHTML={{ __html: SEARCH_ICON }} />
          <input
            type="text"
            id="evoqSearchInput"
            placeholder="Search products..."
            aria-label="Search EVOQ products"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        <div className="evoq-filter-tabs" id="evoqFilterTabs" role="tablist" aria-label="Filter products by category">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={tab === active}
              className={`evoq-filter-tab${tab === active ? ' is-active' : ''}`}
              onClick={() => setActive(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="evoq-product-results" id="evoqProductResults">
        {visible.length ? (
          <div className="evoq-product-row-wrap">
            <div className="evoq-product-row" ref={rowRef} onScroll={updateArrows}>
              {visible.map((product) => {
                const mock = product.mockKey ? getProductMock(product.mockKey) : ''
                const color = PRODUCT_COLOR[product.title] ?? CATEGORY_COLOR[product.category] ?? '#5636C7'
                return (
                  <a
                    className="evoq-product-card"
                    href="#"
                    key={product.id}
                    style={{ '--cat-color': color, '--cat-soft': `${color}26` } as React.CSSProperties}
                  >
                    <span
                      className={`evoq-product-card-image${product.photoUrl ? ' evoq-product-card-image--photo' : ''}`}
                      style={product.photoUrl ? { backgroundImage: `url('${product.photoUrl}')` } : undefined}
                    >
                      {mock ? <span className="evoq-mk" aria-hidden="true" dangerouslySetInnerHTML={{ __html: mock }} /> : null}
                    </span>

                    <div className="evoq-product-card-body">
                      <span className="evoq-product-card-pill">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          dangerouslySetInnerHTML={{ __html: CATEGORY_ICON[product.category] ?? '' }}
                        />
                        <span>{product.category}</span>
                      </span>
                      <div className="evoq-product-card-title">{product.title}</div>
                      <p className="evoq-product-card-desc">{product.desc}</p>
                    </div>
                  </a>
                )
              })}
            </div>

            <button
              type="button"
              className="evoq-product-row-arrow evoq-product-row-arrow--prev"
              aria-label="Scroll products left"
              disabled={atStart}
              onClick={() => scrollByPage(-1)}
              dangerouslySetInnerHTML={{
                __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ARROW_LEFT}</svg>`,
              }}
            />
            <button
              type="button"
              className="evoq-product-row-arrow evoq-product-row-arrow--next"
              aria-label="Scroll products right"
              disabled={atEnd}
              onClick={() => scrollByPage(1)}
              dangerouslySetInnerHTML={{
                __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ARROW_RIGHT}</svg>`,
              }}
            />
          </div>
        ) : (
          <p className="evoq-no-results" role="status">
            No products match your search.
          </p>
        )}
      </div>
    </>
  )
}
