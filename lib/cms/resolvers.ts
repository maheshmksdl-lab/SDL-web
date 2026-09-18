import type { Page } from '../payload-types'
import {
  getCaseStudy, getClients, getForm, getInsights, getServices, getTestimonials,
} from './queries'

/**
 * Extra data a block needs beyond its own fields.
 *
 * This exists so the route never grows slug-conditional branches. The reference project's
 * catch-all page.tsx reached ~380 lines of `if (fullSlug === 'contact')` — and worse, several
 * of those branches OVERWROTE CMS content with hardcoded strings, so editors' changes were
 * silently discarded. See plan §3.3.
 *
 * The rule: a block that needs collection data declares how to get it HERE. The route only
 * resolves, fetches and renders, and adding a dynamic block never touches it.
 */

export type ResolvedBlockData = Record<number, Record<string, unknown>>

type LayoutBlock = NonNullable<Page['layout']>[number]
type Resolver = (block: LayoutBlock) => Promise<Record<string, unknown>>

/** Reads a field off a block without narrowing the whole generated union. */
const field = <T,>(block: LayoutBlock, key: string): T | undefined =>
  (block as unknown as Record<string, unknown>)[key] as T | undefined

/** Relationships arrive as ids at depth 0 and objects when populated. */
const idOf = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: number | string }).id
  }
  return undefined
}

const blockResolvers: Partial<Record<string, Resolver>> = {
  'capability-cards': async (block) => {
    // Manual picks arrive populated; inline cards are written on the block. Neither needs a fetch.
    const source = field<string>(block, 'source')
    if (source === 'manual' || source === 'inline') return {}
    return { services: await getServices(field<number>(block, 'limit') ?? 6) }
  },

  'insights-carousel': async (block) => {
    const source = field<string>(block, 'source') ?? 'latest'
    if (source === 'manual') return {}
    const limit = field<number>(block, 'limit') ?? 6
    const categoryId = source === 'category' ? idOf(field(block, 'category')) : undefined
    return { insights: await getInsights({ limit, categoryId }) }
  },

  testimonials: async (block) => {
    if (field<string>(block, 'source') === 'manual') return {}
    return { testimonials: await getTestimonials(true, field<number>(block, 'limit') ?? 2) }
  },

  proof: async (block) => {
    if (field<string>(block, 'source') === 'manual') return {}
    return { clients: await getClients(true) }
  },

  'case-study': async (block) => {
    if (field<string>(block, 'source') !== 'reference') return {}
    const id = idOf(field(block, 'study'))
    return id ? { study: await getCaseStudy(id) } : {}
  },

  'contact-form': async (block) => {
    const id = idOf(field(block, 'form'))
    return id ? { formDefinition: await getForm(id) } : {}
  },

  // The Contact Us page's section renders the same Form record, on its own panel.
  'contact-offices': async (block) => {
    const id = idOf(field(block, 'form'))
    return id ? { formDefinition: await getForm(id) } : {}
  },
}

/**
 * Runs every resolver a layout needs, in parallel.
 *
 * Results are keyed by block INDEX rather than by type, because the same block type can appear
 * more than once on a page with different settings — two insight carousels filtered to different
 * categories, for instance.
 */
export async function resolveBlockData(layout: Page['layout']): Promise<ResolvedBlockData> {
  if (!layout?.length) return {}

  const jobs = layout
    .map((block, index) => {
      const resolver = blockResolvers[block.blockType]
      return resolver ? { index, promise: resolver(block) } : null
    })
    .filter((job): job is { index: number; promise: Promise<Record<string, unknown>> } => job !== null)

  if (!jobs.length) return {}

  const settled = await Promise.allSettled(jobs.map((j) => j.promise))

  const resolved: ResolvedBlockData = {}
  settled.forEach((result, i) => {
    const job = jobs[i]
    if (!job) return
    if (result.status === 'fulfilled') {
      resolved[job.index] = result.value
    } else {
      /*
       * A failed resolver degrades that ONE section rather than the page. These are all
       * supplementary listings — a logo strip, a carousel — and a page missing its testimonials
       * is far better than a page that 500s. The page document itself still throws (client.ts),
       * because a page with no content is not a page.
       */
      console.warn(`[resolvers] block ${job.index} failed:`, result.reason)
      resolved[job.index] = {}
    }
  })

  return resolved
}
