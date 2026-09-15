import type { Page } from '@/lib/payload-types'
import type { ResolvedBlockData } from '@/lib/cms/resolvers'
import { HERO_MODIFIER_THEMES, isSubService, themeForVisual, type Theme } from '@/lib/theme'

import { Hero } from './sections/hero'
import {
  CapabilityDetail, CaseStudy, CtaBanner, Narrative, ValueGrid,
} from './sections/service-sections'
import {
  ApproachSteps, CapabilityCards, InvestmentLadder, ProcessTimeline, Proof,
  SplitFeature, Testimonials,
} from './sections/home-sections'
import { CategoryGrid, PlatformRow } from './sections/platform-sections'
import { InsightsCarousel } from './sections/insights-carousel'
import { ContactForm } from './sections/contact-form'
import { AiEngineering } from './sections/ai-engineering'
import {
  EvoqArchitecture, IndustriesGrid, IntegrationsShowcase, ProductGrid, RichText, TechGroups,
} from './sections/evoq-sections'

type LayoutBlock = NonNullable<Page['layout']>[number]

/**
 * Turns a page's layout into sections.
 *
 * This component owns `settings` — every block carries the group, and applying it in one place
 * is what keeps section components concerned only with content. A section that read
 * `settings.background` itself would have to be kept in step with every other section.
 */

type SectionSettings = {
  anchorId?: string | null
  hidden?: boolean | null
  background?: ('default' | 'white' | 'alt' | 'dark') | null
  spacing?: ('default' | 'tight' | 'flush') | null
  reveal?: boolean | null
}

/**
 * The root class each block's <section> carries.
 *
 * Most sections in the design are `.sdl-section` with a background modifier, but several own
 * their own class and their own padding — `.sdl-hero` is `84px 48px 56px` where `.sdl-section`
 * is `96px 48px 108px`, so wrapping one in the other would apply both and shift the whole page.
 *
 * Anything not listed here gets `.sdl-section`, which is the common case.
 */
const SECTION_ROOT_CLASS: Partial<Record<string, string>> = {
  hero: 'sdl-hero',
  'approach-steps': 'sdl-explain',
  'capability-cards': 'sdl-pillars',
  'value-grid': 'ai-value-section',
  'cta-banner': 'ai-cta-section',
  'process-timeline': 'svc-timeline-section',
  // The contact section layers its own class ON TOP of .sdl-section, which is how the design
  // writes it. Because the string is not exactly 'sdl-section', background and spacing
  // modifiers are skipped — correct here, since .sdl-contact-section paints its own surface.
  'contact-form': 'sdl-section sdl-contact-section',
}

/**
 * Maps settings onto the design's own modifiers. No new CSS: `.sdl-section--white`,
 * `--alt` and `--tight` already exist in the extracted stylesheets.
 *
 * Background and spacing modifiers only apply to `.sdl-section` roots — a bespoke root such as
 * `.sdl-hero` defines its own surface, and `--white` on it would paint over the design.
 */
function sectionClassName(settings: SectionSettings | undefined, base: string): string {
  const classes = [base]

  if (base !== 'sdl-section') {
    // A bespoke root owns its own background and padding; only the reveal class is layered on.
    return classes.join(' ')
  }

  switch (settings?.background) {
    case 'white': classes.push('sdl-section--white'); break
    case 'alt': classes.push('sdl-section--alt'); break
    case 'dark': classes.push('sdl-section--dark'); break
    default: break
  }

  if (settings?.spacing === 'tight') classes.push('sdl-section--tight')
  if (settings?.spacing === 'flush') classes.push('sdl-section--flush')

  return classes.join(' ')
}

/*
 * blockType → component.
 *
 * A STATIC map, deliberately. A `registerSection()` side-effect API would be tidier to write
 * but is unreliable here: registration depends on a module being imported for its side effect,
 * and neither import order nor module identity is guaranteed once the bundler splits server and
 * client graphs. A section registered from a chunk that has not loaded yet is silently missing.
 *
 * Typed loosely on purpose — each block's props come from the generated union, and narrowing
 * here would mean re-declaring every block's shape a second time.
 *
 * Phase 5 adds one import and one entry per section.
 */
type SectionComponent = (props: Record<string, unknown>) => React.ReactNode

const sectionComponents: Partial<Record<string, SectionComponent>> = {
  hero: Hero,

  // Service-detail sections — these five plus the hero cover all six service pages.
  narrative: Narrative,
  'capability-detail': CapabilityDetail,
  'value-grid': ValueGrid,
  'case-study': CaseStudy,
  'ai-engineering': AiEngineering,
  'platform-row': PlatformRow,
  'category-grid': CategoryGrid,
  'cta-banner': CtaBanner,

  // Home and services sections.
  'approach-steps': ApproachSteps,
  'capability-cards': CapabilityCards,
  'investment-ladder': InvestmentLadder,
  'split-feature': SplitFeature,
  'process-timeline': ProcessTimeline,
  proof: Proof,
  testimonials: Testimonials,

  // The two client islands.
  'insights-carousel': InsightsCarousel,
  'contact-form': ContactForm,

  // EVOQ and digital-engineering.
  'tech-groups': TechGroups,
  'evoq-architecture': EvoqArchitecture,
  'product-grid': ProductGrid,
  'industries-grid': IndustriesGrid,
  'integrations-showcase': IntegrationsShowcase,

  // The escape hatch.
  'rich-text': RichText,
}

export function RenderBlocks({
  layout,
  resolved,
  theme = null,
  template = null,
}: {
  layout: Page['layout']
  /** Collection data fetched for blocks that declared a resolver. Keyed by block index. */
  resolved?: ResolvedBlockData
  /** The page theme (lib/theme.ts). Passed to every section so it can render prefixed markup. */
  theme?: Theme | null
  /**
   * The page template. The home and services pages share some blocks but write their section
   * heads differently (services.html's `.svc-section-head`), so sections that differ read it.
   */
  template?: Page['template'] | null
}) {
  if (!layout?.length) return null

  return (
    <>
      {layout.map((block: LayoutBlock, index: number) => {
        const settings = (block as { settings?: SectionSettings }).settings

        // Hidden sections stay in the CMS and stay editable — they just do not render.
        if (settings?.hidden) return null

        // index.html renders Proof and the Testimonials after it as ONE section — the client
        // proof, a divider, then the quotes. A Testimonials block directly after a visible Proof
        // block therefore renders inside that section rather than as a section of its own.
        const prevBlock = index > 0 ? layout[index - 1] : undefined
        const prevHidden = (prevBlock as { settings?: SectionSettings } | undefined)?.settings?.hidden
        if (block.blockType === 'testimonials' && prevBlock?.blockType === 'proof' && !prevHidden) return null
        const nextBlock = layout[index + 1]
        const mergedTestimonials =
          block.blockType === 'proof' &&
          nextBlock?.blockType === 'testimonials' &&
          !(nextBlock as { settings?: SectionSettings }).settings?.hidden
            ? nextBlock
            : null

        const Section = sectionComponents[block.blockType]

        if (!Section) {
          /*
           * Loud in development, silent in production.
           *
           * A missing component is a build error someone must see, but a visitor should never
           * meet a debug panel because a block was added to the CMS before its component
           * shipped.
           */
          if (process.env.NODE_ENV === 'development') {
            return (
              <div
                key={`${block.blockType}-${index}`}
                style={{
                  padding: '24px 48px',
                  margin: '8px 0',
                  border: '2px dashed #E64A3C',
                  background: '#FFF5F4',
                  color: '#E64A3C',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                }}
              >
                No component registered for block type <strong>{block.blockType}</strong> (position{' '}
                {index + 1}). Add it to <code>sectionComponents</code> in
                <code> web/components/render-blocks.tsx</code>.
              </div>
            )
          }
          return null
        }

        // Three cases where a block's own field, not `settings`, decides its section root:
        //
        // The engineering sub-service pages' value-grid is a plain alt-tinted `.sdl-section`,
        // not the bespoke dark `.ai-value-section` every other page carrying this block uses.
        //
        // Every page carrying `ai-engineering` hardcodes its tint in the markup rather than
        // leaving it to editors — alt on the four sub-service pages, but white on
        // digital-engineering, which is the one page that also carries this block.
        //
        // The hero on six pages (ai/bt/de/dx/gt/evoq) carries a `sdl-hero--<key>` modifier the
        // design uses to shrink the heading (`.sdl-hero--ai .sdl-hero-copy`, etc.) — home,
        // services and the four sub-service-family heroes carry none.
        //
        // The services page's capability-cards is its own `.svc-caps` section, not the home
        // page's `.sdl-pillars` — the two look nothing alike (a compact accordion list, not a
        // grid of large motif cards) despite sharing this block type.
        const isSvcCapList =
          block.blockType === 'capability-cards' &&
          (block as { variant?: string }).variant === 'list-detailed'
        const isIconCardsValueGrid =
          block.blockType === 'value-grid' &&
          (block as { variant?: string }).variant === 'icon-cards'
        // Every other value-grid variant (bt/dx/gt) is its own bespoke, differently-coloured
        // dark section, not the shared `.ai-value-section` — same reasoning as the two above.
        const VALUE_GRID_ROOT_BY_VARIANT: Partial<Record<string, string>> = {
          'de-accent-cards': 'de-value-section',
          'bt-timeline': 'bt-value-section',
          'dx-checklist': 'dx-value-section',
          'gt-stat-rows': 'gt-value-section',
        }
        const variant = (block as { variant?: string }).variant ?? ''
        // The timeline value band is business transformation's pattern, reused under their own
        // prefix by the Zoho and Salesforce pages (`.zh-value-section`, `.sf-value-section`).
        const valueGridRoot =
          block.blockType === 'value-grid'
            ? variant === 'bt-timeline'
              ? `${theme ?? 'bt'}-value-section`
              : VALUE_GRID_ROOT_BY_VARIANT[variant]
            : undefined

        // Six service pages (ai/bt/de/dx/gt/evoq) and the two platform pages carry a
        // `sdl-hero--<theme>` modifier; home, services and the four sub-service heroes carry none.
        const heroTheme =
          block.blockType === 'hero' ? themeForVisual((block as { visualKey?: string }).visualKey) : null

        // A themed section adds the design's own section class beside `.sdl-section`. It is the
        // positioning context for that section's decorative layer (`.bt-cap-mesh`,
        // `.de-ai-glow-bg`) — without it those absolutely-positioned glows escape to the page.
        const extraClass =
          theme && block.blockType === 'capability-detail' && !isSubService(theme)
            ? `${theme}-cap-section`
            : theme && block.blockType === 'platform-row'
              ? `${theme}-platform-section`
              : ''

        const rootClass = isSvcCapList
          ? 'svc-caps'
          : isIconCardsValueGrid
            ? 'sdl-section sdl-section--alt'
            : valueGridRoot
              ? valueGridRoot
              : block.blockType === 'ai-engineering'
                ? `sdl-section sdl-section--${theme === 'de' ? 'white' : 'alt'} ${theme ?? 'de'}-ai-section`
                : block.blockType === 'cta-banner'
                  ? `${theme ?? 'ai'}-cta-section`
                  : block.blockType === 'evoq-architecture'
                    ? 'sdl-section evoq-platform-section--dark'
                    : heroTheme && HERO_MODIFIER_THEMES.has(heroTheme)
                      ? `sdl-hero sdl-hero--${heroTheme}`
                      : (SECTION_ROOT_CLASS[block.blockType] ?? 'sdl-section')
        const className = `${sectionClassName(settings, rootClass)}${extraClass ? ` ${extraClass}` : ''}`

        // The design puts `.reveal` on a section's inner elements, never on the <section> itself,
        // and the section components reproduce that. `reveal: false` switches those inner
        // animations off instead (styles: `.sdl-reveal-off` in app/globals.css).
        const revealClass = settings?.reveal === false ? ' sdl-reveal-off' : ''

        return (
          <section
            key={`${block.blockType}-${index}`}
            id={settings?.anchorId ?? undefined}
            className={`${className}${revealClass}`}
          >
            <Section
              {...(block as unknown as Record<string, unknown>)}
              {...(resolved?.[index] ?? {})}
              theme={theme}
              template={template}
            />
            {mergedTestimonials ? (
              <>
                <div className="sdl-section-inner">
                  <div className="sdl-proof-divider" />
                </div>
                <Testimonials
                  {...(mergedTestimonials as unknown as Record<string, unknown>)}
                  {...(resolved?.[index + 1] ?? {})}
                  theme={theme}
                />
              </>
            ) : null}
          </section>
        )
      })}
    </>
  )
}

/** Which block types currently have a component. Used by the Phase 5 coverage test. */
export const registeredSectionTypes = (): string[] => Object.keys(sectionComponents)
