'use client'

import { useRef, useState } from 'react'

import { SmartLink } from '@/components/ui/smart-link'
import type { ResolvedLink } from '@/lib/links'

type Item = {
  title: string
  tagline?: string | null
  shortDesc?: string | null
  tags?: (string | null)[] | null
  cta?: ResolvedLink | null
}

/**
 * services.html `.svc-cap-list` — the services-overview page's own capability accordion.
 * Structurally the same expandable-row pattern as business-transformation's (see
 * `BtAccordion`), minus the per-row icon: tags render as one `•`-joined line rather than chips,
 * and every row carries a CTA (no conditional flag).
 */
export function SvcCapAccordion({ items }: { items: Item[] }) {
  return (
    <div className="svc-cap-list reveal-group" id="pillarsGrid">
      {items.map((item, i) => (
        <SvcCapRow key={item.title} item={item} index={i} />
      ))}
    </div>
  )
}

function SvcCapRow({ item, index }: { item: Item; index: number }) {
  const [open, setOpen] = useState(false)
  const innerRef = useRef<HTMLDivElement>(null)
  const tags = item.tags?.filter(Boolean) ?? []

  return (
    <div className={`svc-cap-row${open ? ' is-open' : ''}`}>
      <button type="button" className="svc-cap-row-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="svc-cap-num">{String(index + 1).padStart(2, '0')}</span>
        <span className="svc-cap-text">
          <span className="svc-cap-title">{item.title}</span>
          {item.tagline ? <span className="svc-cap-tagline">{item.tagline}</span> : null}
        </span>
        <span className="svc-cap-toggle" aria-hidden="true">
          +
        </span>
      </button>

      <div
        className="svc-cap-panel"
        style={{ maxHeight: open ? `${innerRef.current?.scrollHeight ?? 1000}px` : undefined }}
      >
        <div className="svc-cap-panel-inner" ref={innerRef}>
          <div className="svc-cap-panel-spacer" />
          <div className="svc-cap-panel-content">
            {item.shortDesc ? <p className="svc-cap-desc">{item.shortDesc}</p> : null}
            {tags.length ? <div className="svc-cap-tags">{tags.join('  •  ')}</div> : null}
            {item.cta ? (
              <div className="svc-cap-cta-row">
                <SmartLink link={item.cta} className="svc-cap-cta">
                  Explore{' '}
                  <span className="svc-cap-cta-arrow" aria-hidden="true">
                    ↗
                  </span>
                </SmartLink>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
