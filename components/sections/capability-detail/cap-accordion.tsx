'use client'

import { useRef, useState } from 'react'

import type { Page } from '@/lib/payload-types'
import { resolveLink } from '@/lib/links'
import { pick } from '@/lib/registries/swatches'
import { SmartLink } from '@/components/ui/smart-link'

type Item = NonNullable<Extract<NonNullable<Page['layout']>[number], { blockType: 'capability-detail' }>['items']>[number]

const CAP_ARC = 'M74 28A34 34 0 1 1 28 24'
const CAP_ARROW = 'M18 10 L30 24 L14 30 Z'

/**
 * The expandable capability rows — business-transformation.html's `.bt-cap-list`, reused under
 * their own prefix by zoho-consulting-implementation.html (`.zh-cap-list`) and
 * salesforce-implementation.html (`.sf-cap-list`).
 *
 * Collapsed to a name and one-line tagline; a click reveals the description (and, where set, a
 * tech note and a CTA). Ported from `BT_CAPABILITIES.forEach`: each row opens independently (no
 * "close others"), and the panel animates to its own measured `scrollHeight` rather than a
 * CSS-only `height: auto` transition, exactly as the design does. The gradient ids keep the
 * design's own `btCapGrad<n>` naming, which the two platform pages copied verbatim.
 */
export function CapAccordion({
  prefix,
  colors,
  items,
}: {
  prefix: string
  colors: readonly (readonly [string, string])[]
  items: Item[]
}) {
  return (
    <div className={`${prefix}-cap-list reveal-group`}>
      {items.map((item, i) => (
        <CapRow key={item.id ?? i} prefix={prefix} item={item} index={i} colors={colors} />
      ))}
    </div>
  )
}

function CapRow({
  prefix: p,
  item,
  index,
  colors,
}: {
  prefix: string
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
    <div className={`${p}-cap-row${open ? ' is-open' : ''}`}>
      <button type="button" className={`${p}-cap-row-head`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className={`${p}-cap-icon`}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id={gradId} x1="10%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor={from} />
                <stop offset="100%" stopColor={to} />
              </linearGradient>
            </defs>
            <path d={CAP_ARC} fill="none" stroke={`url(#${gradId})`} strokeWidth={14} strokeLinecap="round" />
            <path d={CAP_ARROW} fill={`url(#${gradId})`} />
          </svg>
        </span>
        <span className={`${p}-cap-num`}>{String(index + 1).padStart(2, '0')}</span>
        <span className={`${p}-cap-text`}>
          <span className={`${p}-cap-title`}>{item.title}</span>
          {item.tagline ? <span className={`${p}-cap-tagline`}>{item.tagline}</span> : null}
        </span>
        <span className={`${p}-cap-toggle`} aria-hidden="true">
          +
        </span>
      </button>

      <div
        className={`${p}-cap-panel`}
        style={{ maxHeight: open ? `${innerRef.current?.scrollHeight ?? 1000}px` : undefined }}
      >
        <div className={`${p}-cap-panel-inner`} ref={innerRef}>
          <div className={`${p}-cap-panel-spacer`} />
          <div className={`${p}-cap-panel-content`}>
            {item.desc ? <p className={`${p}-cap-panel-desc`}>{item.desc}</p> : null}
            {tech.length ? (
              <p className={`${p}-cap-panel-tech`}>
                <strong>Commerce platforms:</strong> {tech.join(' · ')}
              </p>
            ) : null}
            {cta ? (
              <div className={`${p}-cap-panel-cta-row`}>
                <SmartLink link={cta} className={`${p}-cap-panel-cta`}>
                  Explore{' '}
                  <span className={`${p}-cap-panel-cta-arrow`} aria-hidden="true">
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
