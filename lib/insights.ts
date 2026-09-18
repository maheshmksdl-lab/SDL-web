import type { Insight } from '@/lib/payload-types'

/**
 * Insight vocabulary shared by the /insights index (a client component) and the article route
 * (a server component). It lives outside both because a value exported from a 'use client'
 * module reaches the server only as a client reference, not as the value itself.
 */

/** The four content types, and the only place their labels are spelled for the visitor. */
export const CONTENT_TYPES: { value: string; label: string }[] = [
  { value: 'blog', label: 'Blog' },
  { value: 'case-study', label: 'Case Studies' },
  { value: 'whitepaper', label: 'White Papers' },
  { value: 'featured-project', label: 'Featured Projects' },
]

export function labelForKind(kind?: string | null): string {
  return CONTENT_TYPES.find((type) => type.value === kind)?.label ?? 'Blog'
}

export function categoryLabel(insight: Pick<Insight, 'category'>): string | null {
  return typeof insight.category === 'object' && insight.category ? insight.category.label : null
}

/** "17 September 2026" — the article byline. */
export function formatLongDate(value?: string | null): string | null {
  const date = parse(value)
  return date
    ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : null
}

/** "Sep 17, 2026" — the compact date under a list entry, set in caps by the stylesheet.
 *  Both formats pin UTC: the index renders on the server and again in the browser, and two time
 *  zones would disagree about the day and break hydration. */
export function formatShortDate(value?: string | null): string | null {
  const date = parse(value)
  return date
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : null
}

function parse(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
