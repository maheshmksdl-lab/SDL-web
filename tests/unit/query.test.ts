import { describe, expect, it } from 'vitest'

import { query } from '@/lib/cms/query'

/**
 * The query builder is what turns a resolver's intent into a Payload REST URL. A bug here is a
 * silent one — the wrong documents come back and nothing errors.
 */
describe('query', () => {
  it('encodes a nested where clause in Payload bracket notation', () => {
    expect(query({ where: { pathname: { equals: '/services' } } })).toBe(
      '?where%5Bpathname%5D%5Bequals%5D=%2Fservices',
    )
  })

  it('projects fields with select[field]=true', () => {
    expect(query({ select: ['slug', 'pathname'] })).toBe('?select%5Bslug%5D=true&select%5Bpathname%5D=true')
  })

  it('passes sort, limit and depth through', () => {
    const qs = new URLSearchParams(query({ sort: '-publishedAt', limit: 6, depth: 1 }).slice(1))
    expect(qs.get('sort')).toBe('-publishedAt')
    expect(qs.get('limit')).toBe('6')
    expect(qs.get('depth')).toBe('1')
  })

  it('is empty for no params', () => {
    expect(query({})).toBe('')
  })

  it('serialises an array value with indexed keys', () => {
    expect(query({ where: { id: { in: [1, 2] } } })).toContain('where%5Bid%5D%5Bin%5D%5B0%5D=1')
  })
})
