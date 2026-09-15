import { describe, expect, it } from 'vitest'

import {
  articleJsonLd, breadcrumbJsonLd, jsonLdScript, organisationJsonLd, serviceJsonLd,
} from '@/lib/jsonld'
import type { Insight, Service, SiteSetting } from '@/lib/payload-types'

const settings = { siteName: 'Social DNA Labs', legalName: 'Social DNA Labs' } as SiteSetting

describe('breadcrumbJsonLd', () => {
  it('is null for the home page (no breadcrumb)', () => {
    expect(breadcrumbJsonLd('/')).toBeNull()
  })

  it('builds Home › Services › AI transformation from the pathname', () => {
    const ld = breadcrumbJsonLd('/services/ai-transformation') as {
      itemListElement: { position: number; name: string }[]
    }
    expect(ld.itemListElement.map((i) => i.name)).toEqual(['Home', 'Services', 'Ai transformation'])
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2, 3])
  })

  it('uses a supplied title for the leaf segment', () => {
    const ld = breadcrumbJsonLd('/insights/my-post', { '/insights/my-post': 'My Post' }) as {
      itemListElement: { name: string }[]
    }
    expect(ld.itemListElement.at(-1)?.name).toBe('My Post')
  })
})

describe('articleJsonLd', () => {
  it('emits an Article with the author and dates', () => {
    const insight = {
      title: 'A post',
      slug: 'a-post',
      kind: 'blog',
      excerpt: 'Summary',
      author: 'Jane Doe',
      publishedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    } as Insight
    const ld = articleJsonLd(insight, settings) as Record<string, unknown>
    expect(ld['@type']).toBe('Article')
    expect(ld.author).toEqual({ '@type': 'Person', name: 'Jane Doe' })
    expect(ld.datePublished).toBe('2026-01-01T00:00:00.000Z')
  })

  it('emits a Report for a whitepaper', () => {
    const insight = { title: 'WP', slug: 'wp', kind: 'whitepaper' } as Insight
    expect((articleJsonLd(insight, settings) as Record<string, unknown>)['@type']).toBe('Report')
  })
})

describe('serviceJsonLd', () => {
  it('names the service and its provider', () => {
    const ld = serviceJsonLd(
      { title: 'AI transformation', pathname: '/services/ai-transformation' },
      { title: 'AI transformation', shortDesc: 'Put AI to work.' } as Service,
      settings,
    ) as Record<string, unknown>
    expect(ld['@type']).toBe('Service')
    expect(ld.name).toBe('AI transformation')
    expect((ld.provider as { name: string }).name).toBe('Social DNA Labs')
  })
})

describe('organisationJsonLd', () => {
  it('emits an Organization + WebSite graph', () => {
    const ld = organisationJsonLd(settings) as { '@graph': { '@type': string }[] }
    expect(ld['@graph'].map((n) => n['@type'])).toEqual(['Organization', 'WebSite'])
  })
})

describe('jsonLdScript', () => {
  it('drops null graphs and unwraps a single node', () => {
    expect(jsonLdScript([null, null])).toBe('')
    const one = jsonLdScript([{ '@type': 'X' }, null])
    expect(JSON.parse(one)).toEqual({ '@type': 'X' })
  })
})
