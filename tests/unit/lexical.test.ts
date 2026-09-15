import { describe, expect, it } from 'vitest'

import { lexicalToPlainText } from '@/lib/lexical'

const doc = {
  root: {
    children: [
      { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'A heading' }] },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Some ' },
          { type: 'text', text: 'bold', format: 1 },
          { type: 'text', text: ' text.' },
        ],
      },
    ],
  },
}

describe('lexicalToPlainText', () => {
  it('flattens nodes to a single spaced string', () => {
    expect(lexicalToPlainText(doc as never)).toBe('A heading Some bold text.')
  })

  it('truncates to the limit', () => {
    expect(lexicalToPlainText(doc as never, 10).length).toBeLessThanOrEqual(10)
  })

  it('returns an empty string for empty content', () => {
    expect(lexicalToPlainText(null)).toBe('')
    expect(lexicalToPlainText({ root: { children: [] } } as never)).toBe('')
  })
})
