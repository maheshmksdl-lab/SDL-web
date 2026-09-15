import type { Insight, Page } from '@/lib/payload-types'
import { resolveMedia } from '@/lib/links'
import { insightColors } from '@/lib/registries/swatches'
import { CtaLink, Kicker, SectionSub, SectionTitle } from '@/components/ui/primitives'

import { CarouselTrack, type InsightCard } from './carousel-track'

type Block = Extract<NonNullable<Page['layout']>[number], { blockType: 'insights-carousel' }>

/**
 * The horizontally scrolling insights carousel.
 *
 * Split deliberately: this server component shapes the cards and renders the head, and only the
 * scrolling track — which needs scroll position and a live counter — is a client island. The
 * card contents therefore ship as HTML and are indexable.
 *
 * Cards without a thumbnail fall back to a solid accent swatch, cycling through
 * `INSIGHT_COLORS`, exactly as the design does.
 */
export function InsightsCarousel(props: Record<string, unknown>) {
  const block = props as unknown as Block
  const items =
    block.source === 'manual'
      ? ((block.insights ?? []) as (number | Insight)[]).filter(
          (i): i is Insight => typeof i === 'object' && i !== null,
        )
      : ((props.insights as Insight[] | undefined) ?? [])

  // The swatch counter advances only for cards WITHOUT an image, matching the design's
  // `colorIndex++` inside the no-thumbnail branch.
  let colorIndex = 0

  const cards: InsightCard[] = items.map((item) => {
    const thumb = resolveMedia(item.thumbnail, 'insight')
    const category =
      typeof item.category === 'object' && item.category ? item.category.label : undefined

    if (thumb) {
      return {
        id: String(item.id),
        href: `/insights/${item.slug}`,
        category: category ?? '',
        title: item.title,
        readTime: item.readTime ?? '',
        thumbUrl: thumb.src,
      }
    }

    const swatch = insightColors[colorIndex % insightColors.length]!
    colorIndex += 1
    return {
      id: String(item.id),
      href: `/insights/${item.slug}`,
      category: category ?? '',
      title: item.title,
      readTime: item.readTime ?? '',
      swatchBg: swatch.bg,
      swatchText: swatch.text,
    }
  })

  // services.html heads its sections with a plain eyebrow beside the title block; index.html uses
  // the split head with a lined kicker.
  const isServicesPage = props.template === 'services'

  return (
    <div className="sdl-section-inner">
      {isServicesPage ? (
        <div className="svc-section-head reveal">
          {block.kicker ? <div className="svc-section-eyebrow">{block.kicker}</div> : null}
          <div className="svc-section-title-block">
            <SectionTitle>{block.title}</SectionTitle>
            <SectionSub>{block.sub}</SectionSub>
          </div>
        </div>
      ) : (
        <div className="sdl-pillars-head sdl-split-head reveal">
          {block.kicker ? <Kicker>{block.kicker}</Kicker> : null}
          <div className="sdl-split-head-body">
            <SectionTitle>{block.title}</SectionTitle>
            <SectionSub>{block.sub}</SectionSub>
          </div>
        </div>
      )}

      <CarouselTrack cards={cards} />

      <div className="sdl-insights-footer-row">
        <span>{block.footerText}</span>
        <CtaLink link={block.cta} />
      </div>
    </div>
  )
}
