import type { Page } from '@/lib/payload-types'
import type { CmsLink } from '@/lib/links'
import { resolveLink, resolveMedia } from '@/lib/links'
import { deTechAccents, pick } from '@/lib/registries/swatches'
import { CtaLink, Kicker, SectionSub, SectionTitle } from '@/components/ui/primitives'

import { ProductFilter } from './product-grid/product-filter'
import { TechGroupList } from './tech-groups/tech-group-list'

/**
 * The EVOQ product page sections, plus the digital-engineering technology groups.
 *
 * Two of these have interactive state and delegate to a small client island; the rest are Server
 * Components. As everywhere, `RenderBlocks` supplies the wrapping <section>.
 */

type Block<T extends string> = Extract<NonNullable<Page['layout']>[number], { blockType: T }>
type MediaInput = Parameters<typeof resolveMedia>[0]

// ── Technology groups (digital-engineering) ──────────────────────────────────

export function TechGroups(props: Record<string, unknown>) {
  const block = props as unknown as Block<'tech-groups'>

  const groups = (block.groups ?? []).map((group, index) => ({
    id: String(group.id ?? index),
    label: group.label,
    desc: group.desc ?? '',
    list: (group.list ?? []).filter((t): t is string => Boolean(t)),
    mockType: group.mockType ?? 'ui',
    icon: group.iconKey ?? null,
    metric: group.metric?.value ? { value: group.metric.value, label: group.metric.label ?? '' } : null,
    checklist: (group.checklist ?? []).filter((c): c is string => Boolean(c)),
    accent: pick(deTechAccents, index),
  }))

  return (
    <div className="sdl-section-inner">
      <div className="de-tech-head reveal">
        <Kicker theme="de">{block.kicker}</Kicker>
        <SectionTitle spaced>{block.title}</SectionTitle>
        {block.intro?.length ? (
          <div className="de-tech-intro">
            {block.intro.map((p, i) => (
              <p key={p.id ?? i}>{p.text}</p>
            ))}
          </div>
        ) : null}
      </div>

      <TechGroupList groups={groups} />
    </div>
  )
}

// ── EVOQ platform overview ───────────────────────────────────────────────────

/*
 * The diagram's artwork, keyed by label. Presentation, not content: the CMS supplies the labels,
 * and a label without artwork simply draws no glyph.
 */
const ARCH_ICONS: Record<string, string> = {
  sales: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
  marketing: '<path d="M3 10v4h3l10 5V5L6 10H3z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
  service: '<circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5 20 3M17 6l2 2M14 9l2 2"/>',
  operations:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2"/>',
  finance:
    '<path d="M12 2v20M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5"/>',
  leadership: '<path d="M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9 6.1 20.2l1.3-6.5L2.5 9.2l6.6-.7z"/>',
  'console & apis': '<path d="M9 8l-5 4 5 4M15 8l5 4-5 4"/>',
  administration: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
  storage: '<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/>',
  'data protection': '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  mobility: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  analytics: '<path d="M4 20V11M10 20V5M16 20v-6M21.5 20h-19"/>',
}
const archIcon = (label: string) => ARCH_ICONS[label.trim().toLowerCase()] ?? ''

/** Six team nodes across the top, converging on the hub at (210, 148). */
const TEAM_X = [35, 105, 175, 245, 315, 385]
/** The shared-platform grid: three columns, two rows. */
const PLATFORM_CELLS: [number, number][] = [
  [42, 270], [154, 270], [266, 270],
  [42, 300], [154, 300], [266, 300],
]
const BADGE_X = [42, 100, 158, 216, 274]

const SVG_TEXT = { fontFamily: 'Inter, sans-serif' } as const

type ArchitectureBlock = Block<'evoq-architecture'> & {
  lead?: string | null
  paragraphs?: { id?: string | null; text: string }[] | null
  moreLabel?: string | null
  hub?: { title?: string | null; desc?: string | null; logo?: MediaInput } | null
}

/**
 * evoq.html "Platform overview" — a dark section pairing the overview copy with the architecture
 * diagram. The diagram is one SVG, as the design draws it, so the converging connectors always
 * meet the nodes; the labels, hub copy and integration logos come from the block.
 */
export function EvoqArchitecture(props: Record<string, unknown>) {
  const block = props as unknown as ArchitectureBlock
  const [teamsCard, platformCard] = block.cards ?? []
  const teams = (teamsCard?.items ?? []).slice(0, TEAM_X.length)
  const platform = (platformCard?.items ?? []).slice(0, PLATFORM_CELLS.length)
  const badges = (block.integrationBadges ?? []).slice(0, BADGE_X.length)
  const hubLogo = resolveMedia(block.hub?.logo as MediaInput)

  return (
    <div className="sdl-section-inner">
      <div className="evoq-narrative">
        <div className="reveal">
          <Kicker theme="evoq" dark>
            {block.kicker}
          </Kicker>
          {block.lead ? <p className="evoq-narrative-lead">{block.lead}</p> : null}
          {block.paragraphs?.length ? (
            <div className="evoq-narrative-body">
              {block.paragraphs.map((p, i) => (
                <p key={p.id ?? i}>{p.text}</p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="evoq-arch reveal" aria-hidden="true">
          <svg viewBox="0 0 420 430" xmlns="http://www.w3.org/2000/svg" role="presentation">
            <defs>
              <linearGradient id="evoqConn" gradientUnits="userSpaceOnUse" x1="0" y1="62" x2="0" y2="150">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.55" />
              </linearGradient>
              <radialGradient id="evoqHubGlow">
                <stop offset="0%" stopColor="#6D4FEB" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#6D4FEB" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g fill="none" stroke="url(#evoqConn)" strokeWidth="1.1">
              {teams.map((_, i) => (
                <path key={i} d={`M${TEAM_X[i]} 62 C ${TEAM_X[i]} 102, 210 106, 210 148`} />
              ))}
            </g>
            <circle cx="210" cy="148" r="2.4" fill="#8B5CF6" />

            <g>
              {teams.map((team, i) => {
                const x = TEAM_X[i]!
                return (
                  <g key={team.id ?? i}>
                    <text x={x} y="13" textAnchor="middle" {...SVG_TEXT} fontSize="9.5" fill="rgba(255,255,255,0.6)">
                      {team.text}
                    </text>
                    <rect x={x - 19} y="22" width="38" height="38" rx="10" fill="#16212F" stroke="rgba(255,255,255,0.13)" />
                    <g
                      transform={`translate(${x - 9} 32) scale(0.75)`}
                      fill="none"
                      stroke="#A8B8CC"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dangerouslySetInnerHTML={{ __html: archIcon(team.text) }}
                    />
                  </g>
                )
              })}
            </g>

            <ellipse cx="210" cy="182" rx="180" ry="58" fill="url(#evoqHubGlow)" />
            <rect x="26" y="156" width="368" height="52" rx="12" fill="rgba(109,79,235,0.14)" stroke="rgba(139,110,255,0.42)" />
            <g id="evoqHubContent" transform="translate(94 0)">
              <rect x="0" y="167" width="30" height="30" rx="8" fill="#16212F" />
              {hubLogo ? <image href={hubLogo.src} x="5" y="172" width="20" height="20" /> : null}
              <text x="42" y="180" fontFamily="Manrope, sans-serif" fontSize="12.5" fontWeight="700" fill="#FFFFFF">
                {block.hub?.title}
              </text>
              <text x="42" y="194" {...SVG_TEXT} fontSize="8.6" fill="rgba(255,255,255,0.62)">
                {block.hub?.desc}
              </text>
            </g>

            <path d="M210 208 L210 240" stroke="rgba(255,255,255,0.16)" strokeWidth="1.1" />

            <rect x="26" y="240" width="368" height="94" rx="12" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.08)" />
            <text x="42" y="259" {...SVG_TEXT} fontSize="8" fontWeight="700" letterSpacing="1.2" fill="rgba(255,255,255,0.45)">
              {(platformCard?.label ?? '').toUpperCase()}
            </text>
            {platform.map((item, i) => {
              const [x, y] = PLATFORM_CELLS[i]!
              return (
                <g key={item.id ?? i}>
                  <rect x={x} y={y} width="22" height="22" rx="6" fill="#16212F" stroke="rgba(255,255,255,0.11)" />
                  <g
                    transform={`translate(${x + 5} ${y + 5}) scale(0.5)`}
                    fill="none"
                    stroke="#A8B8CC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dangerouslySetInnerHTML={{ __html: archIcon(item.text) }}
                  />
                  <text x={x + 29} y={y + 14.5} {...SVG_TEXT} fontSize="9.2" fill="rgba(255,255,255,0.78)">
                    {item.text}
                  </text>
                </g>
              )
            })}

            <path d="M210 334 L210 352" stroke="rgba(255,255,255,0.16)" strokeWidth="1.1" />

            <rect x="26" y="352" width="368" height="70" rx="12" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.08)" />
            <text x="42" y="371" {...SVG_TEXT} fontSize="8" fontWeight="700" letterSpacing="1.2" fill="rgba(255,255,255,0.45)">
              INTEGRATIONS
            </text>
            {badges.map((badge, i) => (
              <g key={badge.id ?? i}>
                <rect x={BADGE_X[i]} y="382" width="28" height="28" rx="8" fill="#16212F" stroke="rgba(255,255,255,0.11)" />
                {badge.iconUrl ? <image href={badge.iconUrl} x={BADGE_X[i]! + 7} y="389" width="14" height="14" /> : null}
              </g>
            ))}
            {block.moreLabel ? (
              <>
                <rect x="332" y="382" width="46" height="28" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.11)" strokeDasharray="3 3" />
                <text x="355" y="400" textAnchor="middle" {...SVG_TEXT} fontSize="8.5" fontWeight="700" fill="rgba(255,255,255,0.6)">
                  {block.moreLabel}
                </text>
              </>
            ) : null}
          </svg>
        </div>
      </div>
    </div>
  )
}

// ── EVOQ product grid ────────────────────────────────────────────────────────

export function ProductGrid(props: Record<string, unknown>) {
  const block = props as unknown as Block<'product-grid'>

  const products = (block.products ?? []).map((product, index) => ({
    id: String(product.id ?? index),
    title: product.title,
    category: product.category,
    desc: product.desc ?? '',
    iconKey: product.iconKey ?? null,
    mockKey: product.mockKey ?? null,
    photoUrl: (product as { photoUrl?: string | null }).photoUrl ?? null,
  }))

  const tabs = (block.tabs ?? []).filter((t): t is string => Boolean(t))

  return (
    <div className="sdl-section-inner">
      <div className="evoq-products-head reveal">
        <Kicker theme="evoq">{block.kicker}</Kicker>
        <SectionTitle spaced>{block.title}</SectionTitle>
        <SectionSub>{block.sub}</SectionSub>
      </div>

      <ProductFilter tabs={tabs} products={products} />
    </div>
  )
}

// ── EVOQ industries ──────────────────────────────────────────────────────────

/**
 * evoq.html "Built for different ways of working" — a static grid of square photo tiles, each
 * labelled on the photo itself. All ten are visible at once, so there is no scroller.
 */
export function IndustriesGrid(props: Record<string, unknown>) {
  const block = props as unknown as Block<'industries-grid'>

  return (
    <div className="sdl-section-inner">
      <div className="evoq-industries-head reveal">
        <Kicker theme="evoq">{block.kicker}</Kicker>
        <SectionTitle spaced>{block.title}</SectionTitle>
        <SectionSub>{block.sub}</SectionSub>
      </div>

      <div className="evoq-industries-row reveal-group" id="evoqIndustries">
        {(block.items ?? []).map((item, index) => {
          const src =
            resolveMedia(item.image as MediaInput, 'thumb')?.src ?? (item as { imageUrl?: string | null }).imageUrl ?? null
          return (
            <div className="evoq-industry-card" key={item.id ?? index}>
              <div className="evoq-industry-photo">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- stock photography from an external host, as the design
                  <img src={src} alt="" loading="lazy" />
                ) : null}
                <div className="evoq-industry-label">{item.title}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── EVOQ integrations ────────────────────────────────────────────────────────

type IntegrationsBlock = {
  kicker?: string | null
  title?: string | null
  paragraphs?: { id?: string | null; text: string }[] | null
  badges?: { id?: string | null; name: string; iconSlug: string; large?: boolean | null; left: number; top: number }[] | null
  captionTitle?: string | null
  captionDesc?: string | null
  cta?: CmsLink
}

/**
 * evoq.html "Integrations" — copy beside a radar panel: concentric rings with partner logos
 * floating over them, and a caption card. Logos load from simpleicons.org, as the design does.
 */
export function IntegrationsShowcase(props: Record<string, unknown>) {
  const block = props as unknown as IntegrationsBlock

  return (
    <div className="sdl-section-inner">
      <div className="evoq-integrations-layout">
        <div>
          <div className="evoq-integrations-head reveal">
            <Kicker theme="evoq">{block.kicker}</Kicker>
            <SectionTitle spaced>{block.title}</SectionTitle>
          </div>

          {block.paragraphs?.length ? (
            <div className="evoq-integrations-body reveal">
              {block.paragraphs.map((p, i) => (
                <p key={p.id ?? i}>{p.text}</p>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="evoq-integrations-visual reveal">
            <div className="evoq-integrations-rings" aria-hidden="true" />
            <div id="evoqIntegrationBadges">
              {(block.badges ?? []).map((badge, i) => (
                <div
                  className={`evoq-integration-badge${badge.large ? ' evoq-integration-badge--lg' : ''}`}
                  style={{ left: `${badge.left}%`, top: `${badge.top}%` }}
                  title={badge.name}
                  key={badge.id ?? i}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- third-party marks from a logo CDN, as the design */}
                  <img src={`https://cdn.simpleicons.org/${badge.iconSlug}`} alt={badge.name} loading="lazy" />
                </div>
              ))}
            </div>
            {block.captionTitle || block.captionDesc ? (
              <div className="evoq-integrations-caption">
                {block.captionTitle ? <div className="evoq-integrations-caption-title">{block.captionTitle}</div> : null}
                {block.captionDesc ? <p className="evoq-integrations-caption-desc">{block.captionDesc}</p> : null}
              </div>
            ) : null}
          </div>

          {resolveLink(block.cta) ? (
            <div className="evoq-integrations-cta reveal">
              <CtaLink link={block.cta!} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── Rich text (escape hatch) ─────────────────────────────────────────────────

export function RichText(props: Record<string, unknown>) {
  const block = props as unknown as Block<'rich-text'>

  return (
    <div className="sdl-section-inner">
      <div className={block.width === 'full' ? 'sdl-richtext' : 'sdl-richtext sdl-richtext--narrow'}>
        {block.kicker ? <Kicker>{block.kicker}</Kicker> : null}
        <SectionTitle spaced>{block.title}</SectionTitle>
        {/*
          Lexical rendering is intentionally not implemented yet — this block is the escape
          hatch, and reaching for it repeatedly means a real block is missing. When it is
          needed, render `block.content` through a Lexical serializer here.
        */}
      </div>
    </div>
  )
}
