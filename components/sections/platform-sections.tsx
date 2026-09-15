import type { CmsLink } from '@/lib/links'
import { resolveMedia } from '@/lib/links'
import type { Theme } from '@/lib/theme'
import { CtaLink, Kicker, SectionSub, SectionTitle } from '@/components/ui/primitives'

/**
 * The two sections the SaaS platform pages add to the service-page set.
 *
 *   PlatformRow   business-transformation.html `.bt-platform-*` — "SaaS & business platforms"
 *   CategoryGrid  zoho-consulting-implementation.html `.zh-apps-*` — the application grid, which
 *                 salesforce-implementation.html repeats as its capability grid
 *
 * Both are Server Components and render under the page theme's prefix, like every other themed
 * section. `RenderBlocks` supplies the wrapping <section>.
 */

type MediaInput = Parameters<typeof resolveMedia>[0]

type PlatformRowBlock = {
  kicker?: string | null
  title?: string | null
  sub?: string | null
  platforms?: {
    id?: string | null
    logo?: MediaInput
    logoSize?: 'default' | 'compact' | null
    badge?: string | null
    title: string
    desc?: string | null
    link?: CmsLink
  }[] | null
}

export function PlatformRow(props: Record<string, unknown>) {
  const block = props as unknown as PlatformRowBlock
  const p = (props.theme as Theme | null | undefined) ?? 'bt'

  return (
    <div className="sdl-section-inner">
      <div className={`${p}-platform-head reveal`}>
        <Kicker theme={p}>{block.kicker}</Kicker>
        <SectionTitle spaced>{block.title}</SectionTitle>
        <SectionSub>{block.sub}</SectionSub>
      </div>

      <div className={`${p}-platform-row reveal-group`}>
        {(block.platforms ?? []).map((platform, index) => {
          const logo = resolveMedia(platform.logo)
          return (
            <div className={`${p}-platform-col`} key={platform.id ?? index}>
              <div className={`${p}-platform-logo-wrap`}>
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- partner wordmarks (SVG among them) sized by height in the design's CSS
                  <img
                    className={`${p}-platform-logo${platform.logoSize === 'compact' ? ` ${p}-platform-logo--sf` : ''}`}
                    src={logo.src}
                    alt={logo.alt || platform.title}
                  />
                ) : null}
                {platform.badge ? <span className={`${p}-platform-badge`}>{platform.badge}</span> : null}
              </div>
              <div className={`${p}-platform-title`}>{platform.title}</div>
              {platform.desc ? <p className={`${p}-platform-desc`}>{platform.desc}</p> : null}
              {platform.link ? <CtaLink link={platform.link} /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type CategoryGridBlock = {
  kicker?: string | null
  title?: string | null
  categories?: { id?: string | null; title: string; list?: string | null }[] | null
}

export function CategoryGrid(props: Record<string, unknown>) {
  const block = props as unknown as CategoryGridBlock
  const p = (props.theme as Theme | null | undefined) ?? 'zh'

  return (
    <div className="sdl-section-inner">
      <div className={`${p}-apps-head reveal`}>
        <Kicker theme={p}>{block.kicker}</Kicker>
        <SectionTitle spaced>{block.title}</SectionTitle>
      </div>

      <div className={`${p}-apps-grid reveal-group`}>
        {(block.categories ?? []).map((category, index) => (
          <div className={`${p}-apps-cat`} key={category.id ?? index}>
            <div className={`${p}-apps-cat-title`}>{category.title}</div>
            {category.list ? <div className={`${p}-apps-cat-list`}>{category.list}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
