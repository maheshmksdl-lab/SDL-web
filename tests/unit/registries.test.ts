import { describe, expect, it } from 'vitest'

import { getIcon, iconDefault, iconOptions, icons } from '@/lib/registries/icons'
import { getMotif, motifOptions } from '@/lib/registries/motifs'
import { getProductMock, productMockOptions } from '@/lib/registries/mocks'
import { heroVisualOptions } from '@/lib/registries/visuals'
import { insightColors, pick } from '@/lib/registries/swatches'

/**
 * The registries are the single source of truth for artwork keyed by a CMS string. These tests
 * lock down the two properties the plan relies on (§7.3): a known key resolves, and an unknown
 * key returns a documented default rather than throwing.
 */

describe('icon registry', () => {
  it('resolves a known key to SVG path data', () => {
    expect(getIcon('ai-transformation')).toContain('<path')
  })

  it('falls back to the design default for an unknown key', () => {
    expect(getIcon('does-not-exist')).toBe(iconDefault)
    expect(getIcon(null)).toBe(iconDefault)
    expect(getIcon(undefined)).toBe(iconDefault)
  })

  it('exposes an options array that matches its lookup keys exactly', () => {
    expect(iconOptions.map((o) => o.value).sort()).toEqual(Object.keys(icons).sort())
  })
})

describe('motif registry', () => {
  it('returns null (not a default) for an unknown motif — the card just omits the glyph', () => {
    expect(getMotif('nope')).toBeNull()
  })

  it('lists the animated orb plus every static motif', () => {
    expect(motifOptions.some((o) => o.value === 'ai-transformation')).toBe(true)
  })
})

describe('product mock registry', () => {
  it('resolves a known product and defaults an unknown one', () => {
    expect(typeof getProductMock('crm')).toBe('string')
    expect(getProductMock('unknown')).toBe(getProductMock(null))
  })

  it('every option key resolves', () => {
    for (const { value } of productMockOptions) {
      expect(getProductMock(value).length).toBeGreaterThan(0)
    }
  })
})

describe('hero visual options', () => {
  it('includes every key the CMS block can store', () => {
    const values = heroVisualOptions.map((o) => o.value)
    for (const key of ['home-canvas', 'services-dna', 'ai-orb', 'evoq-suite', 'none']) {
      expect(values).toContain(key)
    }
  })
})

describe('swatch ramp', () => {
  it('cycles when the index exceeds the ramp length', () => {
    expect(pick(insightColors, 0)).toBe(insightColors[0])
    expect(pick(insightColors, insightColors.length)).toBe(insightColors[0])
    expect(pick(insightColors, insightColors.length + 1)).toBe(insightColors[1])
  })
})
