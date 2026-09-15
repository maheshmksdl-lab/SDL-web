import type { Page } from '@/lib/payload-types'

/**
 * Page themes — the class prefix each design page owns.
 *
 * Every service-detail page in the design writes its sections with its own prefix
 * (`.bt-kicker`, `.ce-cap-card`, `.evoq-cta-btn`) and colours them from its own palette. The
 * sections here render that same markup, so they need to know which prefix the current page uses.
 *
 * The theme is not a separate CMS field: it is implied by the page's hero visual, which is already
 * the one per-page choice that identifies the design page (`bt-arc` IS the business-transformation
 * hero). Deriving it keeps a single source of truth and means an editor cannot pick a hero from one
 * page and a palette from another.
 *
 * Mirrors PAGE_PREFIX in tools/visual-parity/lift-page-css.mjs, which lifts each prefix's rules
 * into web/styles/pages/<prefix>.css.
 */

export type Theme = 'ai' | 'bt' | 'de' | 'dx' | 'gt' | 'wae' | 'ce' | 'me' | 'qe' | 'evoq' | 'zh' | 'sf'

const THEME_BY_VISUAL: Record<string, Theme> = {
  'ai-orb': 'ai',
  'bt-arc': 'bt',
  'de-hex': 'de',
  'dx-cursor': 'dx',
  'gt-chart': 'gt',
  'wae-windows': 'wae',
  'ce-cloud': 'ce',
  'me-phone': 'me',
  'qe-pipeline': 'qe',
  'evoq-suite': 'evoq',
  'zh-logo-card': 'zh',
  'sf-logo-card': 'sf',
}

/** The engineering sub-service family: same section structure, one prefix each. */
export const SUB_SERVICE_THEMES: ReadonlySet<Theme> = new Set(['wae', 'ce', 'me', 'qe'])

/** Pages whose hero carries the design's `sdl-hero--<prefix>` modifier. */
export const HERO_MODIFIER_THEMES: ReadonlySet<Theme> = new Set(['ai', 'bt', 'de', 'dx', 'gt', 'evoq', 'zh', 'sf'])

export function themeForVisual(visualKey?: string | null): Theme | null {
  return (visualKey && THEME_BY_VISUAL[visualKey]) || null
}

/** The theme of a page, read from its first hero block. `null` for home, services and articles. */
export function themeForLayout(layout: Page['layout'] | null | undefined): Theme | null {
  const hero = layout?.find((block) => block.blockType === 'hero') as { visualKey?: string | null } | undefined
  return themeForVisual(hero?.visualKey)
}

export const isSubService = (theme: Theme | null | undefined): theme is Theme =>
  Boolean(theme && SUB_SERVICE_THEMES.has(theme))
