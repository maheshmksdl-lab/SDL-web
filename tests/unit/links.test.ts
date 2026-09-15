import { describe, expect, it } from 'vitest'

import { anchorForPage, layoutAnchors, linkProps, resolveLink, resolveMedia } from '@/lib/links'

describe('resolveLink', () => {
  it('resolves an internal link to the target page pathname', () => {
    const resolved = resolveLink({
      label: 'AI transformation',
      type: 'internal',
      page: { id: 1, pathname: '/services/ai-transformation' } as never,
    })
    expect(resolved).toEqual({
      href: '/services/ai-transformation',
      label: 'AI transformation',
      external: false,
      newTab: false,
    })
  })

  it('drops an internal link whose relationship was not populated (id only)', () => {
    expect(resolveLink({ label: 'x', type: 'internal', page: 5 })).toBeNull()
  })

  it('drops an internal link to a page with no pathname', () => {
    expect(resolveLink({ label: 'x', type: 'internal', page: { id: 1 } as never })).toBeNull()
  })

  it('resolves an anchor to a hash', () => {
    expect(resolveLink({ label: 'Contact', type: 'anchor', anchor: 'contact' })?.href).toBe('#contact')
  })

  it('resolves an external URL and carries newTab through', () => {
    const resolved = resolveLink({
      label: 'LinkedIn',
      type: 'external',
      url: 'https://linkedin.com',
      newTab: true,
    })
    expect(resolved).toMatchObject({ href: 'https://linkedin.com', external: true, newTab: true })
  })

  it('returns null for a nullish link', () => {
    expect(resolveLink(null)).toBeNull()
    expect(resolveLink(undefined)).toBeNull()
  })
})

describe('layoutAnchors', () => {
  it('collects every settings.anchorId in the layout', () => {
    const layout = [
      { blockType: 'hero', settings: { anchorId: null } },
      { blockType: 'cta-banner', settings: { anchorId: 'contact' } },
      { blockType: 'narrative' },
    ] as never
    expect([...layoutAnchors(layout)]).toEqual(['contact'])
  })

  it('returns an empty set for a missing layout', () => {
    expect(layoutAnchors(null).size).toBe(0)
  })
})

describe('anchorForPage', () => {
  it('keeps an anchor the page renders', () => {
    expect(anchorForPage('#contact', new Set(['contact']))).toBe('#contact')
  })

  it("points an anchor the page lacks at the home page's section", () => {
    expect(anchorForPage('#contact', new Set())).toBe('/#contact')
  })

  it('leaves paths, external URLs and a bare # alone', () => {
    expect(anchorForPage('/services', new Set())).toBe('/services')
    expect(anchorForPage('https://x.com', new Set())).toBe('https://x.com')
    expect(anchorForPage('#', new Set())).toBe('#')
  })
})

describe('linkProps', () => {
  it('hardens an external new-tab link with rel=noopener noreferrer', () => {
    expect(
      linkProps({ href: 'https://x.com', label: 'x', external: true, newTab: true }),
    ).toEqual({ href: 'https://x.com', target: '_blank', rel: 'noopener noreferrer' })
  })

  it('adds rel=noopener to a same-tab external link', () => {
    expect(linkProps({ href: 'https://x.com', label: 'x', external: true, newTab: false })).toEqual({
      href: 'https://x.com',
      rel: 'noopener',
    })
  })

  it('adds nothing to an internal link', () => {
    expect(linkProps({ href: '/about', label: 'About', external: false, newTab: false })).toEqual({
      href: '/about',
    })
  })
})

describe('resolveMedia', () => {
  const media = {
    id: 1,
    url: '/media/original.jpg',
    alt: 'A photo',
    width: 2400,
    height: 1600,
    sizes: { insight: { url: '/media/original-720x900.jpg', width: 720, height: 900 } },
  }

  it('picks the requested derivative', () => {
    expect(resolveMedia(media as never, 'insight')).toEqual({
      src: '/media/original-720x900.jpg',
      alt: 'A photo',
      width: 720,
      height: 900,
    })
  })

  it('falls back to the original when the derivative is missing', () => {
    expect(resolveMedia(media as never, 'og')?.src).toBe('/media/original.jpg')
  })

  it('returns null for an unpopulated (id-only) relationship', () => {
    expect(resolveMedia(3 as never)).toBeNull()
    expect(resolveMedia(null)).toBeNull()
  })
})
