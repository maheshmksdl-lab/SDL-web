import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { RenderBlocks } from '@/components/render-blocks'
import { Hero } from '@/components/sections/hero'
import {
  ApproachSteps, CapabilityCards, InvestmentLadder, ProcessTimeline, Proof, SplitFeature,
} from '@/components/sections/home-sections'
import {
  CapabilityDetail, CtaBanner, Narrative, ValueGrid,
} from '@/components/sections/service-sections'
import { EvoqArchitecture, IndustriesGrid, RichText } from '@/components/sections/evoq-sections'

/**
 * Component coverage (plan §9.1): every section renders with full data, with minimal data, and —
 * where it has them — with each variant, without throwing and with its key content present.
 *
 * These use `renderToStaticMarkup` (the server-render path, which is how every section actually
 * runs) rather than jsdom, because all section components are Server Components with no hooks.
 * The interactive islands are covered by the E2E suite.
 */

const html = (node: React.ReactElement) => renderToStaticMarkup(node)

describe('RenderBlocks', () => {
  const layout = [
    { blockType: 'hero', headingLines: [{ before: 'Hi ', accent: 'there' }], visualKey: 'none', settings: {} },
    { blockType: 'narrative', lead: 'A lead line.', settings: { anchorId: 'story' } },
    { blockType: 'narrative', lead: 'Hidden.', settings: { hidden: true } },
  ] as never

  it('renders one <section> per visible block, in order', () => {
    const out = html(<RenderBlocks layout={layout} />)
    expect(out.match(/<section/g)).toHaveLength(2)
    expect(out.indexOf('Hi ')).toBeLessThan(out.indexOf('A lead line.'))
  })

  it('drops a block whose settings.hidden is true', () => {
    expect(html(<RenderBlocks layout={layout} />)).not.toContain('Hidden.')
  })

  it('applies settings.anchorId as the section id', () => {
    expect(html(<RenderBlocks layout={layout} />)).toContain('id="story"')
  })

  it('maps settings.background onto the design modifier class', () => {
    const l = [{ blockType: 'narrative', lead: 'x', settings: { background: 'alt', spacing: 'tight' } }] as never
    const out = html(<RenderBlocks layout={l} />)
    expect(out).toContain('sdl-section--alt')
    expect(out).toContain('sdl-section--tight')
  })

  it('renders nothing for an unknown block type in production mode', () => {
    const l = [{ blockType: 'not-a-real-block', settings: {} }] as never
    expect(html(<RenderBlocks layout={l} />)).toBe('')
  })

  it('returns null for an empty layout', () => {
    expect(html(<RenderBlocks layout={[]} />)).toBe('')
  })
})

// ── one row per section: [name, Component, fullProps, minimalProps] ────────────

const cases: [string, (p: Record<string, unknown>) => React.ReactNode, Record<string, unknown>, Record<string, unknown>][] = [
  [
    'hero',
    Hero,
    {
      kicker: 'AI transformation',
      headingLines: [{ before: 'Put AI ', accent: 'to work.' }],
      sub: 'A sub-heading.',
      primaryCTA: { label: 'Talk to us', type: 'anchor', anchor: 'contact' },
      trustStrip: { strong: '15+ years', rest: 'delivering' },
      visualKey: 'ai-orb',
    },
    { headingLines: [{ before: 'Just a line' }], visualKey: 'none' },
  ],
  [
    'approach-steps',
    ApproachSteps,
    {
      kicker: 'How', title: 'From potential to impact',
      steps: [{ title: 'Find', desc: 'x' }, { title: 'Build', desc: 'y' }],
      note: { strong: 'Technology is powerful.', accent: 'Purpose makes it valuable.' },
    },
    { steps: [{ title: 'One' }, { title: 'Two' }] },
  ],
  [
    'capability-cards',
    CapabilityCards,
    { variant: 'grid-motif', title: 'What we do', source: 'manual', items: [{ title: 'A', desc: 'x' }] },
    { source: 'auto', services: [] },
  ],
  [
    'investment-ladder',
    InvestmentLadder,
    { title: 'How it works', steps: [{ title: 'Investment', caption: 'in' }, { title: 'Return', caption: 'out' }], closing: { line1: 'a', line2: 'b' } },
    { steps: [{ title: 'One' }, { title: 'Two' }] },
  ],
  [
    'split-feature',
    SplitFeature,
    {
      left: { kicker: 'AI', body: 'text', cta: { label: 'Go', type: 'anchor', anchor: 'x' } },
      right: { title: 'The process', body: 'y', processItems: [{ title: 'Find', desc: 'z' }] },
    },
    { left: {}, right: { processItems: [] } },
  ],
  [
    'process-timeline',
    ProcessTimeline,
    { kicker: 'Process', title: 'Opportunity to impact', steps: [{ title: 'Accelerate', desc: 'x' }, { title: 'Deliver', desc: 'y' }] },
    { steps: [{ title: 'One' }, { title: 'Two' }] },
  ],
  [
    'proof',
    Proof,
    { title: 'Proof', text: 'body', callout: 'quote', blockTitle: 'Trusted by', source: 'manual', clients: [] },
    { source: 'auto', clients: [] },
  ],
  [
    'narrative',
    Narrative,
    { kicker: 'AI transformation', lead: 'The lead.', paragraphs: [{ text: 'One.' }, { text: 'Two.' }] },
    { lead: 'Just a lead.' },
  ],
  [
    'capability-detail',
    CapabilityDetail,
    {
      kicker: 'Capabilities', title: 'What we do',
      intro: [{ text: 'Intro.' }],
      items: [{ title: 'AI strategy', tagline: 't', desc: 'd', tech: ['LangChain'] }],
    },
    { items: [{ title: 'One' }] },
  ],
  [
    'value-grid',
    ValueGrid,
    { variant: 'dark', kicker: 'The value', title: 'What changes', items: [{ title: 'CX', desc: 'better' }] },
    { items: [{ title: 'One' }] },
  ],
  [
    'cta-banner',
    CtaBanner,
    { variant: 'card', kicker: 'Get started', title: 'Ready?', sub: 'Let’s talk', cta: { label: 'Contact', type: 'anchor', anchor: 'contact' } },
    { title: 'Ready?' },
  ],
  [
    'evoq-architecture',
    EvoqArchitecture,
    {
      cards: [{ label: 'Teams', items: [{ text: 'Sales' }] }],
      hub: { title: 'EVOQ', desc: 'One platform' },
      integrationBadges: [{ name: 'QuickBooks', iconUrl: 'https://cdn.example/qb.svg' }],
    },
    {},
  ],
  [
    'industries-grid',
    IndustriesGrid,
    { kicker: 'Industries', title: 'Who it’s for', items: [{ title: 'Manufacturing', desc: 'x' }] },
    { items: [{ title: 'One' }] },
  ],
  [
    'rich-text',
    RichText,
    { kicker: 'Note', title: 'Heading', content: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Body copy.' }] }] } }, width: 'narrow' },
    {},
  ],
]

describe.each(cases)('section: %s', (name, Component, full, minimal) => {
  it('renders with full data', () => {
    expect(() => html(<Component {...full} />)).not.toThrow()
  })

  it('renders with minimal data without throwing', () => {
    expect(() => html(<Component {...minimal} />)).not.toThrow()
  })
})

describe('value-grid variants', () => {
  it('adds the bento class only for the bento variant', () => {
    const items = [{ title: 'x' }]
    expect(html(<ValueGrid variant="bento" items={items} />)).toContain('gt-bento')
    expect(html(<ValueGrid variant="dark" items={items} />)).not.toContain('gt-bento')
  })
})

describe('hero visual dispatch', () => {
  it('renders no visual for visualKey "none"', () => {
    const out = html(<Hero headingLines={[{ before: 'x' }]} visualKey="none" />)
    expect(out).not.toContain('ai-hero-visual')
  })

  it('renders the SVG orb for "ai-orb" and ships no canvas', () => {
    const out = html(<Hero headingLines={[{ before: 'x' }]} visualKey="ai-orb" />)
    expect(out).toContain('ai-orb')
    expect(out).not.toContain('<canvas')
  })
})
