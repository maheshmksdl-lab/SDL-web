'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { getIcon } from '@/lib/registries/icons'
import { getTechGroupMock } from '@/lib/registries/tech-group-mocks'

/**
 * The design's per-group accent is a four-value ramp, not a single colour: a solid for text and
 * borders, two gradient stops for the panel wash, and a soft tint for chips. All four are set
 * as custom properties so the CSS uses them exactly as the design does.
 */
export type TechAccent = {
  solid: string
  gradA: string
  gradB: string
  soft: string
}

export type TechGroup = {
  id: string
  label: string
  desc: string
  list: string[]
  mockType: string
  icon: string | null
  metric: { value: string; label: string } | null
  checklist: string[]
  accent: TechAccent
}

const CHECK_ICON =
  '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l5 5L20 6"/></svg>'

const ADVANCE_INTERVAL = 6600

/**
 * digital-engineering.html's `.de-tech-layout` — a left column of collapsible categories (one
 * open at a time, each auto-advancing to the next after 6.6s via `.de-tech-progress-fill`) beside
 * a right-side preview window whose interior illustration swaps per category's `mockType`.
 *
 * Ported from `selectDeTech`/`restartDeTechTimer`: hovering the category list pauses the timer,
 * a manual click both selects and restarts it, and `prefers-reduced-motion` disables both the
 * fill animation and the auto-advance entirely.
 */
export function TechGroupList({ groups }: { groups: TechGroup[] }) {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const restart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % groups.length)
    }, ADVANCE_INTERVAL)
  }, [groups.length])

  useEffect(() => {
    restart()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [restart])

  if (!groups.length) return null
  const current = groups[active]!

  const select = (i: number) => {
    setActive(i)
    restart()
  }

  const pause = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  return (
    <div className="de-tech-layout reveal">
      <div className="de-tech-cats" onMouseEnter={pause} onMouseLeave={restart}>
        {groups.map((group, i) => {
          const isActive = i === active
          return (
            <div
              className={`de-tech-cat${isActive ? ' is-active' : ''}`}
              style={{ '--tech-accent': group.accent.solid } as React.CSSProperties}
              key={group.id}
            >
              <button type="button" className="de-tech-cat-head" aria-expanded={isActive} onClick={() => select(i)}>
                <span className="de-tech-cat-name">{group.label}</span>
                <svg
                  className="de-tech-cat-head-arrow"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <div className="de-tech-cat-panel" style={{ maxHeight: isActive ? 500 : undefined }}>
                <div className="de-tech-cat-panel-inner">
                  <p className="de-tech-cat-desc">{group.desc}</p>
                  <div className="de-tech-chip-row">
                    {group.list.map((tech) => (
                      <span className="de-tech-chip" key={tech}>
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="de-tech-progress-track">
                    {isActive ? <div className="de-tech-progress-fill is-animating" key={active} /> : null}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="de-tech-visual"
        style={
          {
            '--tech-accent': current.accent.solid,
            '--tech-accent-soft': current.accent.soft,
            background: `linear-gradient(135deg, ${current.accent.gradA}, #FFFFFF 58%, ${current.accent.gradB})`,
          } as React.CSSProperties
        }
      >
        <div className="de-tech-mock">
          <div className="de-tech-mock-window">
            <div className="de-tech-mock-dots">
              <span className="de-tech-mock-dot" />
              <span className="de-tech-mock-dot" />
              <span className="de-tech-mock-dot" />
            </div>
            <div
              className={`de-tech-mock-body ${current.mockType}`}
              dangerouslySetInnerHTML={{ __html: getTechGroupMock(current.mockType) }}
            />
            {current.icon ? (
              <span className="de-tech-mock-badge">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: getIcon(current.icon) }}
                />
              </span>
            ) : null}
          </div>

          <div className="de-tech-mock-cards">
            {current.metric ? (
              <div className="de-tech-metric-card">
                {current.icon ? (
                  <span className="de-tech-metric-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: getIcon(current.icon) }}
                    />
                  </span>
                ) : null}
                <div className="de-tech-metric-value">{current.metric.value}</div>
                <div className="de-tech-metric-label">{current.metric.label}</div>
              </div>
            ) : null}

            {current.checklist.length ? (
              <div className="de-tech-checklist-card">
                <div className="de-tech-checklist-title">What it delivers</div>
                {current.checklist.map((item) => (
                  <div
                    className="de-tech-check-row"
                    key={item}
                  >
                    <span className="de-tech-check-icon" dangerouslySetInnerHTML={{ __html: CHECK_ICON }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
