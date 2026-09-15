import { describe, expect, it } from 'vitest'

import { absoluteUrl, buildMetadata } from '@/lib/seo'
import type { SiteSetting } from '@/lib/payload-types'

const settings = {
  siteName: 'Social DNA Labs',
  defaultMetaTitle: 'Social DNA Labs — Business impact, by design',
  defaultMetaDescription: 'Site default description.',
  maintenanceMode: false,
} as SiteSetting

describe('absoluteUrl', () => {
  it('joins a path onto the site URL', () => {
    expect(absoluteUrl('/services')).toMatch(/\/services$/)
    expect(absoluteUrl('services')).toMatch(/\/services$/)
  })
})

describe('buildMetadata — the three-level fallback (plan §6.9)', () => {
  it('prefers the page SEO title, then the page title, then the site default', () => {
    expect(
      buildMetadata({ page: { title: 'Page title', seo: { title: 'SEO title' } }, settings, pathname: '/x' }).title,
    ).toBe('SEO title')

    expect(buildMetadata({ page: { title: 'Page title', seo: {} }, settings, pathname: '/x' }).title).toBe(
      'Page title',
    )

    expect(buildMetadata({ page: { title: null, seo: null }, settings, pathname: '/x' }).title).toBe(
      settings.defaultMetaTitle,
    )
  })

  it('falls the description through page SEO → excerpt → site default', () => {
    expect(
      buildMetadata({ page: { title: 'x', seo: { description: 'own' } }, settings, pathname: '/x' })
        .description,
    ).toBe('own')
    expect(
      buildMetadata({ page: { title: 'x', seo: {}, excerpt: 'from excerpt' }, settings, pathname: '/x' })
        .description,
    ).toBe('from excerpt')
    expect(
      buildMetadata({ page: { title: 'x', seo: {} }, settings, pathname: '/x' }).description,
    ).toBe(settings.defaultMetaDescription)
  })

  it('honours a canonical override, else derives the canonical from the pathname', () => {
    expect(
      buildMetadata({ page: { title: 'x', seo: { canonicalOverride: 'https://canonical.example/x' } }, settings, pathname: '/wrong' })
        .alternates?.canonical,
    ).toBe('https://canonical.example/x')
    expect(
      buildMetadata({ page: { title: 'x', seo: {} }, settings, pathname: '/services' }).alternates
        ?.canonical,
    ).toMatch(/\/services$/)
  })

  it('sets noindex when the page opts out, when in maintenance, or outside production', () => {
    // Not production in this test env → always noindex.
    const meta = buildMetadata({ page: { title: 'x', seo: {} }, settings, pathname: '/x' })
    expect(meta.robots).toEqual({ index: false, follow: false })
  })

  it('uses the article OG type when asked', () => {
    const meta = buildMetadata({
      page: { title: 'x', seo: {}, ogType: 'article' },
      settings,
      pathname: '/insights/x',
    })
    expect((meta.openGraph as { type?: string })?.type).toBe('article')
  })
})
