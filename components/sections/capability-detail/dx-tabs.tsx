'use client'

import { useId, useState } from 'react'

import type { Page } from '@/lib/payload-types'
import { pick } from '@/lib/registries/swatches'

type Item = NonNullable<Extract<NonNullable<Page['layout']>[number], { blockType: 'capability-detail' }>['items']>[number]

const DX_CURSOR = 'M22 8 L22 84 L41 67 L53 92 L66 86 L54 61 L78 61 Z'

function CursorIcon({ from, to, gradId }: { from: string; to: string; gradId: string }) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path fill={`url(#${gradId})`} d={DX_CURSOR} />
    </svg>
  )
}

/**
 * digital-experience.html `.dx-cap-tabs` — a tab list on the left, the selected capability's
 * detail on the right. Ported from `selectCapability` / the `dxCapTabs.forEach` build: index 0
 * is active on load, a click swaps both the active tab's styling and the panel content (an
 * instant swap in the design, no transition), and each tab/panel pair share the same cursor-glyph
 * icon recoloured per index from `dxCapShapeColors`.
 */
export function DxTabs({ colors, items }: { colors: readonly (readonly [string, string])[]; items: Item[] }) {
  const [active, setActive] = useState(0)
  const uid = useId()
  if (!items.length) return null
  const current = items[active]!
  const [from, to] = pick(colors, active)

  return (
    <div className="dx-cap-tabs reveal">
      <div className="dx-cap-tab-list" role="tablist">
        {items.map((item, i) => {
          const [tf, tt] = pick(colors, i)
          return (
            <button
              key={item.id ?? i}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`dx-cap-tab${i === active ? ' is-active' : ''}`}
              onClick={() => setActive(i)}
            >
              <span className="dx-cap-tab-icon">
                <CursorIcon from={tf} to={tt} gradId={`${uid}-tab-${i}`} />
              </span>
              <span className="dx-cap-tab-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="dx-cap-tab-title">{item.title}</span>
            </button>
          )
        })}
      </div>

      <div className="dx-cap-panel">
        <div className="dx-cap-panel-icon">
          <CursorIcon from={from} to={to} gradId={`${uid}-panel`} />
        </div>
        <div className="dx-cap-panel-num">{String(active + 1).padStart(2, '0')}</div>
        <div className="dx-cap-panel-title">{current.title}</div>
        {current.desc ? <p className="dx-cap-panel-desc">{current.desc}</p> : null}
      </div>
    </div>
  )
}
