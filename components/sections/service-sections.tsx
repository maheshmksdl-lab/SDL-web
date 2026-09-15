import type { Page } from '@/lib/payload-types'
import type { CmsLink } from '@/lib/links'
import { resolveLink } from '@/lib/links'
import { isSubService, type Theme } from '@/lib/theme'
import {
  CtaLink, Kicker, RegistryIcon, SectionSub, SectionTitle,
} from '@/components/ui/primitives'
import { SmartLink } from '@/components/ui/smart-link'
import { CapAccordion } from '@/components/sections/capability-detail/cap-accordion'
import { DxTabs } from '@/components/sections/capability-detail/dx-tabs'
import { getCaseStudyMock } from '@/lib/registries/case-study-mocks'
import * as swatches from '@/lib/registries/swatches'
import { pick } from '@/lib/registries/swatches'

/**
 * The sections every service-detail page is built from.
 *
 * These cover the five service pages (ai/bt/de/dx/gt), EVOQ, the two platform pages (Zoho,
 * Salesforce) and the four engineering sub-service pages (web-application-, cloud-, mobile-,
 * quality-engineering).
 *
 * Each design page writes these sections with its OWN class prefix and palette — `.bt-case-label`
 * is gold, `.ce-case-media` is a dark panel, `.zh-kicker` is Zoho red. `RenderBlocks` passes the
 * page theme (lib/theme.ts) and the markup below is built from it, so every page renders the
 * design's exact class names and picks up its own lifted stylesheet (styles/pages/<theme>.css).
 *
 * Every one is a Server Component. `RenderBlocks` supplies the wrapping <section>, its background
 * and spacing modifiers, its id and its themed section class.
 */

type Block<T extends string> = Extract<NonNullable<Page['layout']>[number], { blockType: T }>

const themeOf = (props: Record<string, unknown>): Theme | null => (props.theme as Theme | null | undefined) ?? null

type Ramp = readonly (readonly [string, string])[]

/** Each page's capability-shape gradient ramp, straight from the design's `*_CAP_SHAPE_COLORS`. */
function capShapeColorsFor(theme: Theme | null): Ramp {
  const s = swatches as unknown as Record<string, Ramp | undefined>
  return (theme && s[`${theme}CapShapeColors`]) || swatches.btCapShapeColors
}

/** The sub-service pages each cycle their own single-colour accent ramp (`*_ACCENT_COLORS`). */
function accentColorsFor(theme: Theme | null): readonly string[] {
  const s = swatches as unknown as Record<string, readonly string[] | undefined>
  return (theme && s[`${theme}AccentColors`]) || swatches.waeAccentColors
}

// ── Narrative ────────────────────────────────────────────────────────────────

/**
 * `.<theme>-narrative` — a kicker and lead paragraph beside a stack of body paragraphs, with an
 * optional closing link (business transformation's "Explore digital engineering →").
 *
 * When `pills`/`quote` are set it renders the sub-service pages' "shift" pattern instead
 * (`.<theme>-shift-*`: a heading, a row of icon pills, a closing pull-quote). The two never
 * coexist on one page in the design.
 */
export function Narrative(props: Record<string, unknown>) {
  const block = props as unknown as Block<'narrative'> & { cta?: CmsLink }
  const theme = themeOf(props)

  if (block.pills?.length || block.quote) {
    const p = theme ?? 'wae'
    return (
      <div className="sdl-section-inner">
        <div className={`${p}-shift-top`}>
          <div className="reveal">
            <Kicker theme={p}>{block.kicker}</Kicker>
            {block.lead ? <h2 className={`${p}-shift-title`}>{block.lead}</h2> : null}
          </div>

          {block.paragraphs?.length ? (
            <div className={`${p}-shift-body reveal`}>
              {block.paragraphs.map((para, i) => (
                <p key={para.id ?? i}>{para.text}</p>
              ))}
            </div>
          ) : null}
        </div>

        {block.pills?.length ? (
          <div className={`${p}-shift-pillars reveal-group`}>
            {block.pills.map((pill, i) => (
              <div className={`${p}-shift-pillar`} key={pill.id ?? i}>
                <span className={`${p}-shift-pillar-icon`}>
                  <RegistryIcon iconKey={pill.iconKey} size={18} strokeWidth={1.8} />
                </span>
                <span className={`${p}-shift-pillar-label`}>{pill.label}</span>
              </div>
            ))}
          </div>
        ) : null}

        {block.quote ? <blockquote className={`${p}-shift-quote reveal`}>{block.quote}</blockquote> : null}
      </div>
    )
  }

  const p = theme ?? 'ai'
  const cta = resolveLink(block.cta)

  return (
    <div className="sdl-section-inner">
      <div className={`${p}-narrative`}>
        <div className="reveal">
          <Kicker theme={p}>{block.kicker}</Kicker>
          {block.lead ? <p className={`${p}-narrative-lead`}>{block.lead}</p> : null}
        </div>

        {block.paragraphs?.length || cta ? (
          <div className={`${p}-narrative-body reveal`}>
            {(block.paragraphs ?? []).map((para, i) => (
              <p key={para.id ?? i}>{para.text}</p>
            ))}
            {cta ? (
              <p className={`${p}-narrative-cta`}>
                <CtaLink link={block.cta!} />
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── Capability detail ────────────────────────────────────────────────────────

const GT_ARROW_DIAGONAL = 'M18 82 L82 18'
const GT_ARROW_CORNER = 'M46 18 L82 18 L82 54'
/** Fixed by position, not data — matches the design's own `GT_BENTO_LAYOUT`. */
const GT_BENTO_LAYOUT = ['tint featured', 'white', 'tint', 'white', 'tint', 'white']

/** The four-blob gradient mesh behind a service page's capability section. */
function CapMesh({ prefix }: { prefix: string }) {
  return (
    <div className={`${prefix}-cap-mesh`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

function CapHead({ prefix, block, theme }: { prefix: string; block: Block<'capability-detail'>; theme: Theme | null }) {
  return (
    <>
      <div className={`${prefix}-cap-head reveal`}>
        <Kicker theme={theme}>{block.kicker}</Kicker>
        <SectionTitle spaced>{block.title}</SectionTitle>
      </div>
      {block.intro?.length ? (
        <div className={`${prefix}-cap-intro reveal`}>
          {block.intro.map((para, i) => (
            <p key={para.id ?? i}>{para.text}</p>
          ))}
        </div>
      ) : null}
    </>
  )
}

/**
 * `variant` picks the design's presentation for the page:
 *
 *   accordion  business transformation, Zoho, Salesforce — expandable rows
 *   tabs       digital experience — a tab list beside a detail panel
 *   bento      growth transformation — a tile grid
 *   row        digital engineering — numbered rows, each linking to its sub-service page
 *   numbered   ai transformation — numbered cards with a gradient shape
 *   grid       the four sub-service pages — icon cards, the first a feature card, with an
 *              optional technology stack
 */
export function CapabilityDetail(props: Record<string, unknown>) {
  const block = props as unknown as Block<'capability-detail'>
  const theme = themeOf(props)

  if (block.variant === 'accordion') {
    const p = theme ?? 'bt'
    return (
      <>
        <CapMesh prefix={p} />
        <div className="sdl-section-inner">
          <CapHead prefix={p} block={block} theme={theme} />
          <CapAccordion prefix={p} colors={capShapeColorsFor(p)} items={block.items ?? []} />
        </div>
      </>
    )
  }

  if (block.variant === 'tabs') {
    return (
      <>
        <CapMesh prefix="dx" />
        <div className="sdl-section-inner">
          <CapHead prefix="dx" block={block} theme={theme} />
          <DxTabs colors={swatches.dxCapShapeColors} items={block.items ?? []} />
        </div>
      </>
    )
  }

  if (block.variant === 'bento') {
    return (
      <>
        <CapMesh prefix="gt" />
        <div className="sdl-section-inner">
          <CapHead prefix="gt" block={block} theme={theme} />
          <div className="gt-cap-bento reveal-group">
            {(block.items ?? []).map((item, i) => {
              const [from, to] = pick(swatches.gtCapShapeColors, i)
              const gradId = `gtCapGrad${i}`
              const variantClasses = (GT_BENTO_LAYOUT[i % GT_BENTO_LAYOUT.length] ?? 'white')
                .split(' ')
                .map((v) => `gt-cap-tile--${v}`)
                .join(' ')
              return (
                <div className={`gt-cap-tile ${variantClasses}`} key={item.id ?? i}>
                  <div className="gt-cap-tile-icon">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id={gradId} x1="10%" y1="90%" x2="90%" y2="10%">
                          <stop offset="0%" stopColor={from} />
                          <stop offset="100%" stopColor={to} />
                        </linearGradient>
                      </defs>
                      <path d={GT_ARROW_DIAGONAL} stroke={`url(#${gradId})`} strokeWidth={14} strokeLinecap="round" fill="none" />
                      <path d={GT_ARROW_CORNER} stroke={`url(#${gradId})`} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                  <div className="gt-cap-tile-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="gt-cap-tile-title">{item.title}</div>
                  {item.desc ? <p className="gt-cap-tile-desc">{item.desc}</p> : null}
                </div>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  if (block.variant === 'row') {
    return (
      <>
        <CapMesh prefix="de" />
        <div className="sdl-section-inner">
          <CapHead prefix="de" block={block} theme={theme} />

          <div className="de-cap-rows reveal-group">
            {(block.items ?? []).map((item, i) => {
              const [from, to] = pick(swatches.deCapShapeColors, i)
              const link = resolveLink(item.link)
              const gradId = `deCapHexGrad${i}`
              return (
                <div className="de-cap-row" key={item.id ?? i}>
                  <div className="de-cap-row-lead">
                    <div className="de-cap-row-icon">
                      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id={gradId} x1="10%" y1="0%" x2="90%" y2="100%">
                            <stop offset="0%" stopColor={from} />
                            <stop offset="100%" stopColor={to} />
                          </linearGradient>
                        </defs>
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          fill={`url(#${gradId})`}
                          d="M50 4L84 25L84 75L50 96L16 75L16 25Z M50 30A20 20 0 1 0 50.01 30Z"
                        />
                      </svg>
                    </div>
                    <div className="de-cap-row-num">{String(i + 1).padStart(2, '0')}</div>
                  </div>

                  <div className="de-cap-row-body">
                    <div className="de-cap-row-text">
                      <div className="de-cap-row-title">{item.title}</div>
                      {item.desc ? <p className="de-cap-row-desc">{item.desc}</p> : null}
                    </div>
                    {link ? (
                      <SmartLink link={link} className="de-cap-row-cta">
                        {`Explore ${item.title.toLowerCase()} `}
                        <span className="arrow" aria-hidden="true">→</span>
                      </SmartLink>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {block.crossCutting?.pills?.length ? (
            <div className="de-cap-cross reveal">
              {block.crossCutting.label ? <div className="de-cap-cross-label">{block.crossCutting.label}</div> : null}
              <div className="de-cap-cross-pills">
                {block.crossCutting.pills.map((pill) => (
                  <span className="de-cap-cross-pill" key={pill}>
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </>
    )
  }

  if (block.variant === 'numbered') {
    return (
      <>
        <CapMesh prefix="ai" />
        <div className="sdl-section-inner">
          <CapHead prefix="ai" block={block} theme={theme} />

          <div className="ai-cap-grid reveal-group">
            {(block.items ?? []).map((item, i) => {
              const [from, to] = pick(swatches.capShapeColors, i)
              return (
                <div className="ai-cap-card" key={item.id ?? i}>
                  <div
                    className="ai-cap-shape"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${from} 0%, ${to} 55%, rgba(43,73,219,0) 78%)`,
                    }}
                  />
                  <div className="ai-cap-content">
                    <div className="ai-cap-num">{String(i + 1).padStart(2, '0')}</div>
                    <div className="ai-cap-title">{item.title}</div>
                    {item.desc ? <p className="ai-cap-desc">{item.desc}</p> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  // grid — the sub-service pages' capability cards.
  const p = theme ?? 'wae'
  const colors = accentColorsFor(theme)
  return (
    <div className="sdl-section-inner">
      <div className={`${p}-cap-head reveal`}>
        <Kicker theme={p}>{block.kicker}</Kicker>
        <SectionTitle>{block.title}</SectionTitle>
        <SectionSub>{block.sub}</SectionSub>
      </div>

      <div className={`${p}-cap-grid reveal-group`}>
        {(block.items ?? []).map((item, i) => {
          const color = pick(colors, i)
          const tech = item.tech?.filter(Boolean) ?? []
          return (
            <div
              className={`${p}-cap-card${i === 0 ? ` ${p}-cap-card--feature` : ''}`}
              style={
                {
                  '--cap-color': color,
                  '--cap-soft': `${color}1F`,
                  '--cap-glow': `${color}29`,
                  '--cap-border-hover': `${color}59`,
                } as React.CSSProperties
              }
              key={item.id ?? i}
            >
              <div className={`${p}-cap-icon`}>
                <RegistryIcon iconKey={item.iconKey} size={22} strokeWidth={1.7} />
              </div>
              <div className={`${p}-cap-title`}>{item.title}</div>
              {item.desc ? <p className={`${p}-cap-desc`}>{item.desc}</p> : null}
              {tech.length ? (
                <div className={`${p}-cap-stack`}>
                  <div className={`${p}-cap-stack-label`}>Technologies</div>
                  <div className={`${p}-cap-stack-pills`}>
                    {tech.map((t) => (
                      <span className={`${p}-cap-stack-pill`} key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {i === 0 ? (
                <div className={`${p}-cap-watermark`}>
                  <RegistryIcon iconKey={item.iconKey} size={24} strokeWidth={1} />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Value grid ───────────────────────────────────────────────────────────────

export function ValueGrid(props: Record<string, unknown>) {
  const block = props as unknown as Block<'value-grid'> & { columns?: 'one' | 'two' | null }
  const theme = themeOf(props)
  const variant = block.variant ?? 'dark'

  if (variant === 'icon-cards') {
    const p = theme ?? 'wae'
    const colors = accentColorsFor(theme)
    const items = block.items ?? []

    return (
      <div className="sdl-section-inner">
        <div className={`${p}-value-head reveal`}>
          <Kicker theme={p}>{block.kicker}</Kicker>
          <SectionTitle>{block.title}</SectionTitle>
          <SectionSub>{block.sub}</SectionSub>
        </div>

        <div className={`${p}-value-grid reveal-group`}>
          {items.map((item, i) => {
            const color = pick(colors, i)
            const wide = i === items.length - 1 && items.length % 2 === 1
            return (
              <div
                className={`${p}-value-card${wide ? ` ${p}-value-card--wide` : ''}`}
                style={{ '--val-color': color, '--val-tint': `${color}0F` } as React.CSSProperties}
                key={item.id ?? i}
              >
                <div className={`${p}-value-icon`}>
                  <RegistryIcon iconKey={item.iconKey} size={19} strokeWidth={1.8} />
                </div>
                <div className={`${p}-value-item-body`}>
                  <div className={`${p}-value-title`}>{item.title}</div>
                  {item.desc ? <p className={`${p}-value-desc`}>{item.desc}</p> : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (variant === 'de-accent-cards') {
    const items = block.items ?? []
    return (
      <div className="de-value-inner">
        <div className="de-value-head reveal">
          <Kicker theme="de" dark>{block.kicker}</Kicker>
          {block.title ? <div className="de-value-title">{block.title}</div> : null}
          {block.sub ? <p className="de-value-intro">{block.sub}</p> : null}
        </div>

        <div className="de-value-grid reveal-group">
          {items.map((item, i) => {
            const color = pick(swatches.deValueAccentColors, i)
            return (
              <div className="de-value-item" style={{ '--item-accent': color } as React.CSSProperties} key={item.id ?? i}>
                {item.iconKey ? (
                  <span className="de-value-icon">
                    <RegistryIcon iconKey={item.iconKey} size={18} strokeWidth={1.6} />
                  </span>
                ) : null}
                <div className="de-value-item-body">
                  <div className="de-value-item-title">{item.title}</div>
                  {item.desc ? <p className="de-value-item-desc">{item.desc}</p> : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (variant === 'bt-timeline') {
    const p = theme ?? 'bt'
    const items = block.items ?? []
    const half = Math.ceil(items.length / 2)
    // Zoho runs every item down one rail; business transformation and Salesforce split them
    // across two columns, each with its own rail.
    const columns = block.columns === 'one' ? [items] : [items.slice(0, half), items.slice(half)]
    return (
      <div className={`${p}-value-inner`}>
        <div className={`${p}-value-head reveal`}>
          <Kicker theme={p} dark>{block.kicker}</Kicker>
          {block.title ? <div className={`${p}-value-title`}>{block.title}</div> : null}
          {block.sub ? <p className={`${p}-value-sub`}>{block.sub}</p> : null}
        </div>

        <div className={`${p}-value-timeline reveal-group`}>
          {columns.map((col, ci) => (
            <div className={`${p}-value-col`} key={ci}>
              {col.map((item, i) => (
                <div className={`${p}-value-node`} key={item.id ?? i}>
                  <span className={`${p}-value-marker`}>
                    <RegistryIcon iconKey={item.iconKey} size={16} strokeWidth={1.8} />
                  </span>
                  <div className={`${p}-value-node-title`}>{item.title}</div>
                  {item.desc ? <p className={`${p}-value-node-desc`}>{item.desc}</p> : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'dx-checklist') {
    return (
      <div className="dx-value-inner">
        <div className="dx-value-head reveal">
          <Kicker theme="dx" dark>{block.kicker}</Kicker>
          {block.title ? <div className="dx-value-title">{block.title}</div> : null}
        </div>

        <div className="dx-value-list reveal-group">
          {(block.items ?? []).map((item, i) => (
            <div className="dx-value-row" key={item.id ?? i}>
              <span className="dx-value-check">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12.5l4.5 4.5L20 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="dx-value-row-body">
                <div className="dx-value-row-title">{item.title}</div>
                {item.desc ? <p className="dx-value-row-desc">{item.desc}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'gt-stat-rows') {
    return (
      <div className="gt-value-inner">
        <div className="gt-value-head reveal">
          <Kicker theme="gt" dark>{block.kicker}</Kicker>
          {block.title ? <div className="gt-value-title">{block.title}</div> : null}
        </div>

        <div className="gt-value-list reveal-group">
          {(block.items ?? []).map((item, i) => (
            <div className="gt-value-row" key={item.id ?? i}>
              <div className="gt-value-row-num">{String(i + 1).padStart(2, '0')}</div>
              <span className="gt-value-row-icon">
                {item.iconKey ? <RegistryIcon iconKey={item.iconKey} size={20} strokeWidth={1.6} /> : null}
              </span>
              <div className="gt-value-row-body">
                <span className="gt-value-row-title">{item.title}</span>
                {item.desc ? <span className="gt-value-row-desc">{item.desc}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // dark — ai-transformation.html `.ai-value-section`. `light` and `bento` share its markup; bento
  // adds growth transformation's tile layout.
  return (
    <div className="ai-value-inner">
      <div className="ai-value-head reveal">
        <Kicker theme="ai" dark={variant === 'dark'}>
          {block.kicker}
        </Kicker>
        {block.title ? <div className="ai-value-title">{block.title}</div> : null}
      </div>

      <div className={`ai-value-grid reveal-group${variant === 'bento' ? ' gt-bento' : ''}`}>
        {(block.items ?? []).map((item, i) => (
          <div className="ai-value-item" key={item.id ?? i}>
            <span className="ai-value-icon">
              <RegistryIcon iconKey={item.iconKey} size={20} strokeWidth={1.6} />
            </span>
            <div className="ai-value-item-title">{item.title}</div>
            {item.desc ? <p className="ai-value-item-desc">{item.desc}</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Case study ───────────────────────────────────────────────────────────────

export function CaseStudy(props: Record<string, unknown>) {
  const block = props as unknown as Block<'case-study'> & {
    study?: { title?: string; tag?: string; blocks?: { label: string; text: string; id?: string }[] } | null
  }
  const theme = themeOf(props)
  const p = theme ?? 'ai'
  const subService = isSubService(theme)

  // A referenced study wins; inline is the fallback for one-off content.
  const source = block.source === 'inline' ? block.inline : block.study
  const caseTitle = (block.source === 'inline' ? block.inline?.caseTitle : block.study?.title) ?? null
  const tag = (block.source === 'inline' ? block.inline?.tag : block.study?.tag) ?? null
  const blocks = source?.blocks ?? []
  const mock = getCaseStudyMock(block.mockKey)

  return (
    <div className="sdl-section-inner">
      <div className="reveal">
        <Kicker theme={theme}>{block.kicker}</Kicker>
        {/* The sub-service pages bake the title spacing into `.sdl-page--sub-service`; the others
            set it inline at the call site. */}
        <SectionTitle spaced={!subService}>{block.title}</SectionTitle>
        <SectionSub>{block.sub}</SectionSub>
      </div>

      <div className={`${p}-case`}>
        <div className={`${p}-case-media reveal`}>
          {mock ? (
            // Registry-owned illustrative markup — the CMS stores only the key. Cloud and quality
            // engineering place their stat panels directly in the media box, with no wrapper.
            mock.mockClassName ? (
              <div
                className={mock.mockClassName}
                role="img"
                aria-label={mock.label ?? caseTitle ?? 'Case study illustration'}
                dangerouslySetInnerHTML={{ __html: mock.html }}
              />
            ) : (
              <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: mock.html }} />
            )
          ) : null}
          {tag ? <span className={`${p}-case-tag`}>{tag}</span> : null}
        </div>

        <div className="reveal">
          {caseTitle ? <div className={`${p}-case-title`}>{caseTitle}</div> : null}

          <div className={`${p}-case-blocks`}>
            {blocks.map((entry, i) => (
              <div className={`${p}-case-block`} key={entry.id ?? i}>
                <div className={`${p}-case-label`}>{entry.label}</div>
                <p className={`${p}-case-text`}>{entry.text}</p>
              </div>
            ))}
          </div>

          {resolveLink(block.cta) ? (
            <div className={`${p}-case-cta`}>
              <CtaLink link={block.cta} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── CTA banner ───────────────────────────────────────────────────────────────

export function CtaBanner(props: Record<string, unknown>) {
  const block = props as unknown as Block<'cta-banner'>
  const theme = themeOf(props)
  const p = theme ?? 'ai'
  const cta = resolveLink(block.cta)

  return (
    <div className={`${p}-cta-card reveal`}>
      {/* The sub-service pages lay a faint grid under their CTA copy. */}
      {isSubService(theme) ? <div className={`${p}-cta-grid`} aria-hidden="true" /> : null}
      <div className={`${p}-cta-inner`}>
        <Kicker theme={p} dark>{block.kicker}</Kicker>
        {block.title ? (
          block.titleAsHeading ? (
            <h2 className={`${p}-cta-title`}>{block.title}</h2>
          ) : (
            <div className={`${p}-cta-title`}>{block.title}</div>
          )
        ) : null}
        {block.sub ? <p className={`${p}-cta-sub`}>{block.sub}</p> : null}
        {cta ? (
          <SmartLink link={cta} className={`${p}-cta-btn`}>
            {cta.label}{' '}
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </SmartLink>
        ) : null}
      </div>
    </div>
  )
}
