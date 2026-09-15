import type { Page } from '@playwright/test'

import { SUBPIXEL_TOLERANCE, TRACKED_PROPERTIES } from './config'

/** A single readable difference. */
export type Diff = { selector: string; property: string; expected: string; actual: string }

/** Freezes animations so screenshots and computed styles are deterministic. */
export async function freeze(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      caret-color: transparent !important;
    }`,
  })
  // Force every scroll-reveal target visible so layout does not depend on scroll position.
  await page.evaluate(() => {
    document.querySelectorAll('.reveal, .reveal-group > *').forEach((el) => el.classList.add('is-visible'))
  })
}

/** Reads the tracked computed-style set for every element matching a selector. */
export async function computedStyles(
  page: Page,
  selectors: string[],
): Promise<Record<string, Record<string, string>>> {
  return page.evaluate(
    ({ selectors, properties }) => {
      const out: Record<string, Record<string, string>> = {}
      for (const selector of selectors) {
        const el = document.querySelector(selector)
        if (!el) continue
        const cs = getComputedStyle(el)
        const record: Record<string, string> = {}
        for (const prop of properties) record[prop] = cs.getPropertyValue(prop).trim()
        out[selector] = record
      }
      return out
    },
    { selectors, properties: TRACKED_PROPERTIES },
  )
}

const numeric = /^-?\d*\.?\d+px$/

/** Compares two computed-style maps, tolerating sub-pixel drift and the font-family deviation. */
export function diffStyles(
  design: Record<string, Record<string, string>>,
  target: Record<string, Record<string, string>>,
): Diff[] {
  const diffs: Diff[] = []

  for (const selector of Object.keys(design)) {
    const a = design[selector] ?? {}
    const b = target[selector]
    if (!b) {
      diffs.push({ selector, property: '(element)', expected: 'present', actual: 'missing' })
      continue
    }
    for (const property of TRACKED_PROPERTIES) {
      const expected = a[property] ?? ''
      const actual = b[property] ?? ''
      if (expected === actual) continue

      if (property === 'font-family') {
        // Sanctioned deviation: compare the first resolved family, ignoring the injected
        // `var(--font-*)` alias the design does not have.
        const first = (s: string) =>
          (s.split(',')[0] ?? '').replace(/^['"]|['"]$/g, '').trim().toLowerCase()
        const strip = (s: string) => first(s.replace(/var\(--font-[a-z]+\),?\s*/i, ''))
        if (strip(expected) === strip(actual)) continue
      }

      if (numeric.test(expected) && numeric.test(actual)) {
        if (Math.abs(parseFloat(expected) - parseFloat(actual)) <= SUBPIXEL_TOLERANCE) continue
      }

      diffs.push({ selector, property, expected, actual })
    }
  }

  return diffs
}

/** Structural fingerprint of a page (Layer 3). */
export async function structure(page: Page): Promise<{
  sectionCount: number
  classes: string[]
  headings: string[]
  hrefs: string[]
  imagesWithoutAlt: number
}> {
  return page.evaluate(() => {
    // Inlined rather than extracted to a named helper: tsx/esbuild wraps top-level named
    // functions in this callback with an injected `__name(...)` call for stack-trace fidelity,
    // but `page.evaluate` serializes the callback source into a browser context where that
    // helper does not exist, throwing `ReferenceError: __name is not defined`.
    return {
      // Not scoped to `main`: the design's static HTML never wraps sections in one (they are
      // direct children of `body`), while the Next.js app correctly does — scoping this to
      // `main > section` would read as 0 on the design side on every single page.
      sectionCount: document.querySelectorAll('section').length,
      classes: [
        ...new Set(
          [...document.querySelectorAll('main [class]')].flatMap((el) => [...el.classList]),
        ),
      ].sort(),
      headings: [...document.querySelectorAll('h1, h2, h3')]
        .map((h) => (h.textContent ?? '').replace(/\s+/g, ' ').trim())
        .filter(Boolean),
      hrefs: [...new Set([...document.querySelectorAll('a[href]')].map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''))].sort(),
      imagesWithoutAlt: [...document.querySelectorAll('img')].filter((img) => !img.hasAttribute('alt')).length,
    }
  })
}

export async function reachable(url: string): Promise<boolean> {
  try {
    // A cold Turbopack dev-server route compile can take several seconds on first request;
    // 3s was tight enough to make this flaky on an otherwise-healthy server.
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    return res.ok || res.status === 404
  } catch {
    return false
  }
}
