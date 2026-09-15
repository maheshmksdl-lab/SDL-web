import type { Page } from '@/lib/payload-types'
import { resolveLink, resolveMedia } from '@/lib/links'
import type { Theme } from '@/lib/theme'
import { AccentLines, Kicker, type HeadingLine } from '@/components/ui/primitives'
import { SmartLink } from '@/components/ui/smart-link'

import { HeroVisual } from './hero-visual'

type HeroBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'hero' }>

/**
 * Hero — the opening section of every page.
 *
 * Server component. Only the visual is a client island, and only for the variants that animate;
 * the copy, the buttons and the trust strip ship as HTML.
 *
 * Markup follows index.html and the service pages exactly. RenderBlocks supplies the wrapping
 * <section className="sdl-hero"> — the design gives the hero its own grid and padding rather
 * than the generic `.sdl-section`, which SECTION_ROOT_CLASS handles — so this renders only the
 * two grid children.
 */
export function Hero(props: Record<string, unknown>) {
  const block = props as unknown as HeroBlock & { visualImage?: unknown }
  const theme = (props.theme as Theme | null | undefined) ?? null
  const primary = resolveLink(block.primaryCTA)
  const secondary = resolveLink(block.secondaryCTA)
  const trust = block.trustStrip

  const hasTrust = Boolean(trust?.strong || trust?.rest || trust?.second)

  return (
    <>
      <div className="sdl-hero-copy-wrap">
        {block.kicker ? (
          <div className="sdl-kicker-wrap">
            <Kicker theme={theme}>{block.kicker}</Kicker>
          </div>
        ) : null}

        {/* h1: the hero heading is the page's document title. */}
        <AccentLines
          lines={block.headingLines as HeadingLine[] | null | undefined}
          as="h1"
          className="sdl-hero-copy"
        />

        {block.sub ? <p className="sdl-hero-sub">{block.sub}</p> : null}

        {primary || secondary ? (
          <div className="sdl-hero-actions">
            {primary ? (
              <SmartLink link={primary} className="sdl-hero-primary">
                {primary.label} →
              </SmartLink>
            ) : null}
            {secondary ? (
              <SmartLink link={secondary} className="sdl-hero-secondary">
                {secondary.label} →
              </SmartLink>
            ) : null}
          </div>
        ) : null}

        {hasTrust ? (
          <div className="sdl-hero-trust">
            {trust?.strong ? <strong>{trust.strong}</strong> : null} {trust?.rest}
            {trust?.second ? (
              <>
                <span className="dot" />
                {trust.second}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <HeroVisual
        visualKey={block.visualKey ?? 'none'}
        image={resolveMedia(block.visualImage as Parameters<typeof resolveMedia>[0])}
      />
    </>
  )
}
