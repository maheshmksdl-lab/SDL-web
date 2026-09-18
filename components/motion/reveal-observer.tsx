'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

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
  /*
   * `usePathname()` as the effect's dependency, not "no array".
   *
   * The App Router keeps this root layout mounted across a client-side navigation — that is the
   * whole point of a layout — so the component itself never unmounts and, with no dependency
   * array, the effect only re-ran on the very first mount. Every page reached via `next/link`
   * (or the browser back/forward buttons, which the router also intercepts) rendered its
   * `.reveal` / `.reveal-group` elements at `opacity: 0` with no observer ever watching them —
   * permanently invisible until a hard reload remounted the layout from scratch. `usePathname()`
   * changes on every one of those transitions, so listing it here makes the effect re-run (and
   * the cleanup below tear down the previous observer) exactly when a new page's elements need
   * to be (re)watched.
   */
  const pathname = usePathname()

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
    // Tears down THIS pathname's observer before the effect re-runs for the next one, so
    // observers never accumulate across a session of client-side navigations.
    return () => observer.disconnect()
  }, [pathname])

  return null
}
