'use client'

import { useEffect } from 'react'

/**
 * Scroll-reveal, ported from the design's `initScrollReveal`.
 *
 * One observer for the whole page, mounted once in the layout — not one per section. The design
 * does the same, and it matters: an observer per section would mean dozens of them competing on
 * every scroll frame.
 *
 * Values are the design's exactly: threshold 0.15, rootMargin '0px 0px -60px 0px', add
 * `.is-visible`, then unobserve. The CSS (chrome.css) owns the animation and the staggering.
 */
export function RevealObserver() {
  useEffect(() => {
    const targets = document.querySelectorAll('.reveal, .reveal-group')
    if (!targets.length) return

    /*
     * Two fallbacks, both from the design:
     *   - no IntersectionObserver: reveal everything immediately rather than leaving the page
     *     blank, since the elements start at opacity 0.
     *   - reduced motion: same, and the CSS also disables the animation with !important.
     *     Doing it here as well means the class is never added, so nothing animates even if a
     *     future stylesheet edit weakens that rule.
     */
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          obs.unobserve(entry.target)
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    /*
     * No dependency array, deliberately.
     *
     * This component takes no props and renders null, so it only re-runs when the layout
     * re-renders — which is exactly what a client-side navigation does. Re-running is required
     * there: the new page's `.reveal` elements did not exist when the previous observer was
     * created, and with `[]` they would stay at opacity 0 forever. The cleanup disconnects the
     * old observer first, so observers never accumulate.
     */
  })

  return null
}
