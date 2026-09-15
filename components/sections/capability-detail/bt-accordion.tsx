'use client'

import { useRef, useState } from 'react'

import type { Page } from '@/lib/payload-types'
import { resolveLink } from '@/lib/links'
import { pick } from '@/lib/registries/swatches'
import { SmartLink } from '@/components/ui/smart-link'

type Item = NonNullable<Extract<NonNullable<Page['layout']>[number], { blockType: 'capability-detail' }>['items']>[number]

const BT_ARC = 'M74 28A34 34 0 1 1 28 24'
const BT_ARROW = 'M18 10 L30 24 L14 30 Z'

/**
 * business-transformation.html `.bt-cap-list` — expandable accordion rows. Collapsed to a
 * name + one-line tagline; a click reveals the description (and, where set, a tech note and a
 * CTA). Ported from `BT_CAPABILITIES.forEach` — each row's open/closed state is independent
 * (no "close others" behaviour), and the panel opens by animating to its own measured
 * `scrollHeight` rather than a CSS-only `height: auto` transition, exactly as the design does.
 */
export function BtAccordion({ colors, items }: { colors: readonly (readonly [string, string])[]; items: Item[] }) {
  return (
    <div className="bt-cap-list reveal-group">
      {items.map((item, i) => (
        <BtRow key={item.id ?? i} item={item} index={i} colors={colors} />
      ))}
    </div>
  )
}

function BtRow({
  item,
  index,
  colors,
}: {
  item: Item
  index: number
  colors: readonly (readonly [string, string])[]
}) {
  const [open, setOpen] = useState(false)
  const innerRef = useRef<HTMLDivElement>(null)
  const [from, to] = pick(colors, index)
  const gradId = `btCapGrad${index}`
  const tech = item.tech?.filter(Boolean) ?? []
  const cta = resolveLink(item.link)

  return (
    <div className={`bt-cap-row${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="bt-cap-row-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bt-cap-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id={gradId} x1="10%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor={from} />
                <stop offset="100%" stopColor={to} />
              </linearGradient>
            </defs>
            <path d={BT_ARC} fill="none" stroke={`url(#${gradId})`} strokeWidth={14} strokeLinecap="round" />
            <path d={BT_ARROW} fill={`url(#${gradId})`} />
          </svg>
        </span>
        <span className="bt-cap-num">{String(index + 1).padStart(2, '0')}</span>
        <span className="bt-cap-text">
          <span className="bt-cap-title">{item.title}</span>
          {item.tagline ? <span className="bt-cap-tagline">{item.tagline}</span> : null}
        </span>
        <span className="bt-cap-toggle" aria-hidden="true">
          +
        </span>
      </button>

      <div
        className="bt-cap-panel"
        style={{ maxHeight: open ? `${innerRef.current?.scrollHeight ?? 1000}px` : undefined }}
      >
        <div className="bt-cap-panel-inner" ref={innerRef}>
          <div className="bt-cap-panel-spacer" />
          <div className="bt-cap-panel-content">
            {item.desc ? <p className="bt-cap-panel-desc">{item.desc}</p> : null}
            {tech.length ? (
              <p className="bt-cap-panel-tech">
                <strong>Commerce platforms:</strong> {tech.join(' · ')}
              </p>
            ) : null}
            {cta ? (
              <div className="bt-cap-panel-cta-row">
                <SmartLink link={cta} className="bt-cap-panel-cta">
                  Explore{' '}
                  <span className="bt-cap-panel-cta-arrow" aria-hidden="true">
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
