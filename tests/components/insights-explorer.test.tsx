import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { InsightsExplorer } from '@/components/insights/insights-explorer'
import type { Insight } from '@/lib/payload-types'

/**
 * The /insights index's pager: four rows of three (12 cards) per page, and the pager only once
 * there is more than a page. Unlike the section components this is a client island with state,
 * so it renders in jsdom and is driven through clicks.
 */

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

beforeAll(() => {
  // Changing page scrolls the grid back into view; jsdom has no layout to scroll.
  Element.prototype.scrollIntoView = vi.fn()
})

function insights(count: number): Insight[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    slug: `insight-${i + 1}`,
    title: `Insight ${i + 1}`,
    kind: i === 0 ? 'case-study' : 'blog',
    readTime: '5 min read',
    // Newest first, one day apart, so the default sort keeps this order.
    publishedAt: new Date(Date.UTC(2026, 8, 30 - i)).toISOString(),
    updatedAt: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
  })) as unknown as Insight[]
}

const cards = () => screen.queryAllByRole('heading', { level: 3 })
const pager = () => screen.queryByRole('navigation', { name: 'Insights pages' })

describe('InsightsExplorer pagination', () => {
  it('shows all twelve of a twelve-insight set on one page, with no pager', () => {
    render(<InsightsExplorer insights={insights(12)} services={[]} products={[]} />)

    expect(cards()).toHaveLength(12)
    expect(pager()).toBeNull()
  })

  it('shows four rows of three, then pages the rest', () => {
    render(<InsightsExplorer insights={insights(13)} services={[]} products={[]} />)

    expect(cards()).toHaveLength(12)
    expect(screen.getByText('Showing 1–12 of 13 insights')).toBeTruthy()

    const nav = pager()!
    expect(within(nav).getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe(
      'page',
    )

    fireEvent.click(within(nav).getByRole('button', { name: 'Page 2' }))

    expect(cards().map((card) => card.textContent)).toEqual(['Insight 13'])
    expect(screen.getByText('Showing 13–13 of 13 insights')).toBeTruthy()
    expect(within(pager()!).getByRole('button', { name: 'Previous page' })).toBeTruthy()
    expect(within(pager()!).queryByRole('button', { name: 'Next page' })).toBeNull()
  })

  it('returns to the first page when a filter narrows the results', () => {
    render(<InsightsExplorer insights={insights(13)} services={[]} products={[]} />)

    fireEvent.click(within(pager()!).getByRole('button', { name: 'Page 2' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Case Studies/ }))

    expect(cards().map((card) => card.textContent)).toEqual(['Insight 1'])
    expect(pager()).toBeNull()
  })
})
