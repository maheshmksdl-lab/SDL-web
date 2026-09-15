'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { backgroundImage } from '@/lib/media'

export type InsightCard = {
  id: string
  href: string
  category: string
  title: string
  readTime: string
  thumbUrl?: string
  swatchBg?: string
  swatchText?: 'dark' | 'light'
}

/**
 * The scrolling track, its arrows and the live `NN / NN Perspectives` counter.
 *
 * Ported from index.html: step by one card width plus the 20px gap, smooth-scroll, and
 * recompute the index on both `scroll` and `resize`.
 *
 * Accessibility additions over the design (plan §6.11), none of which change the visuals:
 * the counter is `aria-live="polite"` so a screen-reader user hears the position change, the
 * arrows get `aria-controls` and are disabled at each end, and the track is focusable so it can
 * be scrolled with the keyboard.
 */
export function CarouselTrack({ cards }: { cards: InsightCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(1)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const step = useCallback(() => {
    const track = trackRef.current
    const first = track?.firstElementChild
    if (!track || !first) return track?.clientWidth ?? 0
    return first.getBoundingClientRect().width + 20
  }, [])

  const update = useCallback(() => {
    const track = trackRef.current
    const first = track?.firstElementChild
    if (!track || !first) return

    const cardStep = first.getBoundingClientRect().width + 20
    const maxScroll = track.scrollWidth - track.clientWidth
    const scrollLeft = track.scrollLeft

    let next: number
    if (maxScroll <= 0) next = 1
    else if (scrollLeft >= maxScroll - 2) next = cards.length
    else next = Math.round(scrollLeft / cardStep) + 1

    setIndex(Math.max(1, Math.min(cards.length, next)))
    setAtStart(scrollLeft <= 2)
    setAtEnd(maxScroll <= 0 || scrollLeft >= maxScroll - 2)
  }, [cards.length])

  useEffect(() => {
    update()
    const track = trackRef.current
    if (!track) return
    track.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      track.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  const scrollBy = (direction: -1 | 1) =>
    trackRef.current?.scrollBy({ left: direction * step(), behavior: 'smooth' })

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <>
      <div className="sdl-insights-nav-row">
        <div className="sdl-kicker" id="insightsCount" aria-live="polite">
          {pad(index)} / {pad(cards.length)} Perspectives
        </div>
        <div className="sdl-insights-arrows">
          <button
            type="button"
            className="sdl-arrow-btn"
            id="insightsPrev"
            aria-label="Previous insights"
            aria-controls="insightsGrid"
            disabled={atStart}
            onClick={() => scrollBy(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="sdl-arrow-btn"
            id="insightsNext"
            aria-label="Next insights"
            aria-controls="insightsGrid"
            disabled={atEnd}
            onClick={() => scrollBy(1)}
          >
            ›
          </button>
        </div>
      </div>

      <div
        className="sdl-insights-scroll reveal-group"
        id="insightsGrid"
        ref={trackRef}
        tabIndex={0}
        role="group"
        aria-label="Insights"
      >
        {cards.map((card) => {
          const isSwatch = !card.thumbUrl
          const className = isSwatch
            ? `sdl-insight-card sdl-insight-card--color sdl-insight-card--${card.swatchText}`
            : 'sdl-insight-card'

          return (
            <Link
              key={card.id}
              href={card.href}
              className={className}
              style={
                isSwatch
                  ? { background: card.swatchBg }
                  : { backgroundImage: backgroundImage(card.thumbUrl, 750) }
              }
            >
              <div className="sdl-insight-top-row">
                <span className="sdl-insight-thumb-badge">{card.category}</span>
                <span className="sdl-insight-link-icon">↗</span>
              </div>
              <div className="sdl-insight-body">
                <div className="sdl-insight-title">{card.title}</div>
                <div className="sdl-insight-meta">
                  <span>{card.readTime}</span>
                  <span className="read-link">Read perspective ↗</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
