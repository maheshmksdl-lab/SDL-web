'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { AiEngineeringMock as Mock } from '@/lib/registries/ai-engineering-mocks'

const SPARKLE_BADGE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4z" />
    <path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9z" />
  </svg>
)

function Dots({ className, dotClassName }: { className: string; dotClassName: string }) {
  return (
    <div className={className}>
      <span className={dotClassName} />
      <span className={dotClassName} />
      <span className={dotClassName} />
    </div>
  )
}

/**
 * The animated step-through mock beside the AI-engineering copy.
 *
 * Ported from each page's own cycler (`selectDeAiStep` / `restartDeAiTimer` and their four
 * namesakes): auto-advances every 3.6s, never starts under `prefers-reduced-motion: reduce`, and a
 * click on a dot jumps to that step and restarts the timer from there.
 *
 * The frame around the steps is the one thing that differs structurally between pages, so it is
 * chosen by prefix, exactly as each design page writes it:
 *
 *   de, wae  a code window with traffic-light dots and a sparkle badge
 *   ce       a dark console
 *   qe       a "Test Run" card with a live dot
 *   me       a phone, whose screen the step renders into, with the label outside it
 *
 * The step and particle markup itself comes from lib/registries/ai-engineering-mocks.ts,
 * generated from the design; the CMS only ever supplies the lookup key.
 */
export function AiEngineeringMock({ prefix: p, mock }: { prefix: string; mock: Mock }) {
  const { steps } = mock
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const restart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % steps.length)
    }, 3600)
  }, [steps.length])

  useEffect(() => {
    restart()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [restart])

  if (!steps.length) return null
  const step = steps[active]!

  const select = (i: number) => {
    setActive(i)
    restart()
  }

  const stepLabel = <div className={`${p}-ai-step-label`}>{`Step ${active + 1} of ${steps.length} — ${step.label}`}</div>
  const stage = <div className={`${p}-ai-stage`} dangerouslySetInnerHTML={{ __html: step.html }} />

  let frame: React.ReactNode
  if (p === 'me') {
    frame = (
      <>
        <div className="me-ai-phone">
          <div className="me-ai-screen" dangerouslySetInnerHTML={{ __html: `<div class="me-ai-screen-notch"></div>${step.html}` }} />
        </div>
        {stepLabel}
      </>
    )
  } else if (p === 'ce') {
    frame = (
      <div className="ce-ai-console">
        <Dots className="ce-ai-console-dots" dotClassName="ce-ai-console-dot" />
        {stepLabel}
        {stage}
      </div>
    )
  } else if (p === 'qe') {
    frame = (
      <div className="qe-ai-card">
        <div className="qe-ai-card-head">
          <span className="qe-ai-card-head-title">Test Run #482</span>
          <span className="qe-ai-card-head-dot" />
        </div>
        {stepLabel}
        {stage}
      </div>
    )
  } else {
    frame = (
      <div className={`${p}-ai-window`}>
        <Dots className={`${p}-ai-window-dots`} dotClassName={`${p}-ai-window-dot`} />
        {stepLabel}
        {stage}
        <div className={`${p}-ai-badge`}>{SPARKLE_BADGE}</div>
      </div>
    )
  }

  return (
    <div className={`${p}-ai-visual reveal`} aria-hidden="true">
      {frame}

      <div className={`${p}-ai-steps`}>
        {steps.map((s, i) => (
          <span
            key={s.label}
            className={`${p}-ai-step-dot${i === active ? ' is-active' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`Show step ${i + 1}: ${s.label}`}
            onClick={() => select(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') select(i)
            }}
          />
        ))}
      </div>

      <svg
        className={`${p}-ai-particles`}
        viewBox={mock.particlesViewBox}
        aria-hidden="true"
        // Generated from the design's own particle field — never CMS input.
        dangerouslySetInnerHTML={{ __html: mock.particles }}
      />
    </div>
  )
}
