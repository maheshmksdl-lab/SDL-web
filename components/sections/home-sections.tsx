import Image from 'next/image'

import type { Client, Insight, Page, Service, Testimonial } from '@/lib/payload-types'
import { resolveLink, resolveMedia } from '@/lib/links'
import { approachStepIcons } from '@/lib/registries/approach-step-icons'
import { getMotif, ORB_MOTIF } from '@/lib/registries/motifs'
import { pillarMotifColors, pick } from '@/lib/registries/swatches'
import { pillarsBlueprint } from '@/lib/registries/pillars-blueprint'
import { CtaLink, Kicker, SectionSub, SectionTitle } from '@/components/ui/primitives'
import { SmartLink } from '@/components/ui/smart-link'
import { SvcCapAccordion } from '@/components/sections/capability-detail/svc-cap-accordion'

/**
 * The home page and services overview sections.
 *
 * All Server Components. The two interactive sections on these pages — the insights carousel and
 * the contact form — live in their own files because they are client islands.
 *
 * `RenderBlocks` supplies the wrapping <section> and its modifiers.
 */

type Block<T extends string> = Extract<NonNullable<Page['layout']>[number], { blockType: T }>

/** Numbers in the design are positional (01, 02, …), never stored. */
const ordinal = (index: number) => String(index + 1).padStart(2, '0')

// ── Approach steps ───────────────────────────────────────────────────────────

export function ApproachSteps(props: Record<string, unknown>) {
  const block = props as unknown as Block<'approach-steps'>
  const steps = block.steps ?? []

  return (
    <div className="sdl-explain-inner">
      {block.kicker ? (
        <div className="sdl-explain-kicker reveal">
          <span className="kicker-line" />
          <span className="sdl-explain-kicker-label">{block.kicker}</span>
          <span className="kicker-line" />
        </div>
      ) : null}

      {block.title ? <div className="sdl-explain-title reveal">{block.title}</div> : null}

      <div className="sdl-explain-panel">
        <div className="sdl-explain-row reveal-group">
          {steps.map((step, index) => (
            <div key={step.id ?? index} style={{ display: 'contents' }}>
              <div className="sdl-explain-step">
                <svg
                  className="sdl-explain-icon"
                  viewBox="0 0 120 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  // The design's per-step particle diagrams are bespoke, multi-colour artwork —
                  // code-owned by position (`approachStepIcons`), not a CMS-stored key.
                  dangerouslySetInnerHTML={{ __html: approachStepIcons[index] ?? '' }}
                />
                <div className="sdl-explain-step-title">{step.title}</div>
                <div className="sdl-explain-step-desc">{step.desc}</div>
              </div>
              {/* The design puts a chevron between steps, never after the last. */}
              {index < steps.length - 1 ? <div className="sdl-explain-arrow">›</div> : null}
            </div>
          ))}
        </div>

        {block.note?.strong || block.note?.accent ? (
          <div className="sdl-explain-note reveal">
            <span className="sdl-explain-note-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
              </svg>
            </span>
            <span className="sdl-explain-note-strong">{block.note.strong}</span>
            <span className="sdl-explain-note-divider" />
            <span className="sdl-explain-note-accent">{block.note.accent}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── Capability cards ─────────────────────────────────────────────────────────

type CardItem = {
  title: string
  tagline?: string | null
  shortDesc?: string | null
  tags?: (string | null)[] | null
  motifKey?: string | null
  cta?: unknown
}

function toCardItems(block: Block<'capability-cards'>, services?: Service[]): CardItem[] {
  // Cards written on the block itself — the services page's longer copy for each capability.
  if ((block.source as string) === 'inline') {
    return ((block as { items?: CardItem[] | null }).items ?? []).map((s) => ({
      title: s.title,
      tagline: s.tagline,
      shortDesc: s.shortDesc,
      tags: s.tags,
      motifKey: s.motifKey,
      cta: s.cta,
    }))
  }
  if (block.source === 'manual') {
    const manual = block.services
    if (!Array.isArray(manual)) return []
    return manual
      .filter((s): s is Service => typeof s === 'object' && s !== null)
      .map((s) => ({
        title: s.title,
        tagline: s.tagline,
        shortDesc: s.shortDesc,
        tags: s.tags,
        motifKey: s.motifKey,
        cta: s.cta,
      }))
  }
  return (services ?? []).map((s) => ({
    title: s.title,
    tagline: s.tagline,
    shortDesc: s.shortDesc,
    tags: s.tags,
    motifKey: s.motifKey,
    cta: s.cta,
  }))
}

export function CapabilityCards(props: Record<string, unknown>) {
  const block = props as unknown as Block<'capability-cards'>
  const items = toCardItems(block, props.services as Service[] | undefined)
  const isList = block.variant === 'list-detailed'

  if (isList) {
    return (
      <div className="sdl-pillars-inner">
        <div className="svc-caps-head reveal">
          {block.kicker ? <div className="svc-caps-eyebrow">{block.kicker}</div> : null}
          <div className="svc-caps-title-block">
            {block.title ? <div className="svc-caps-title">{block.title}</div> : null}
            {block.sub ? <p className="svc-caps-sub">{block.sub}</p> : null}
          </div>
        </div>

        <SvcCapAccordion
          items={items.map((item) => ({
            title: item.title,
            tagline: item.tagline,
            shortDesc: item.shortDesc,
            tags: item.tags,
            cta: resolveLink(item.cta as never),
          }))}
        />
      </div>
    )
  }

  return (
    <>
      {/* The decorative ground is a sibling of the content in the design, positioned against the
          section — not a child of `.sdl-pillars-inner`. */}
      <div className="sdl-pillars-bg" aria-hidden="true">
        <div className="sdl-pillars-bg-dots" />
        <svg className="sdl-pillars-bg-glyph" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 2C53 32 68 47 98 50C68 53 53 68 50 98C47 68 32 53 2 50C32 47 47 32 50 2Z"
            fill="#2B49DB"
          />
        </svg>
      </div>

      <div className="sdl-pillars-inner">
      <svg
        className="sdl-pillars-blueprint"
        viewBox="0 0 440 290"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        // Design artwork generated from index.html — never CMS input.
        dangerouslySetInnerHTML={{ __html: pillarsBlueprint }}
      />

      <div className="sdl-pillars-head sdl-split-head reveal">
        <div>{block.kicker ? <Kicker>{block.kicker}</Kicker> : null}</div>
        <div className="sdl-split-head-body">
          {block.title ? <div className="sdl-pillars-title">{block.title}</div> : null}
          {block.sub ? <p className="sdl-pillars-sub">{block.sub}</p> : null}
        </div>
      </div>

      <div className="sdl-pillars-grid reveal-group" id="pillarsGrid">
        {items.map((item, index) => {
          const colors = pick(pillarMotifColors, index)
          const glyph = getMotif(item.motifKey)
          const cta = resolveLink(item.cta as never)

          return (
            <div className="sdl-pillar-card" key={item.title}>
              <div
                className="sdl-pillar-visual"
                style={
                  { '--motif-light': colors[0], '--motif-mid': colors[1] } as React.CSSProperties
                }
              >
                <div className="sdl-pillar-glow" />
                {item.motifKey === ORB_MOTIF ? (
                  <div className="sdl-pillar-orb" />
                ) : glyph ? (
                  <div
                    className="sdl-pillar-glyph"
                    // Registry-owned markup, generated from the design at build time — the CMS
                    // stores only a key, so no editor input reaches this string.
                    dangerouslySetInnerHTML={{ __html: glyph }}
                  />
                ) : null}
              </div>

              <div className="sdl-pillar-title">{item.title}</div>

              <div className="sdl-pillar-reveal">
                {item.tagline ? <div className="sdl-pillar-tagline">{item.tagline}</div> : null}
                {item.shortDesc ? <p className="sdl-pillar-desc">{item.shortDesc}</p> : null}

                <div className="sdl-pillar-footer">
                  {item.tags?.length ? (
                    <div className="sdl-pillar-tags">
                      {item.tags.filter(Boolean).map((tag) => (
                        <span className="sdl-pillar-tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {cta ? (
                    <SmartLink link={cta} className="sdl-pillar-cta" aria-label={cta.label}>
                      <span className="sdl-pillar-cta-arrow">↗</span>
                    </SmartLink>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {resolveLink(block.footerLink) ? (
        <div className="sdl-pillars-footer-row">
          <CtaLink link={block.footerLink} />
        </div>
      ) : null}
      </div>
    </>
  )
}

// ── Investment ladder ────────────────────────────────────────────────────────

export function InvestmentLadder(props: Record<string, unknown>) {
  const block = props as unknown as Block<'investment-ladder'>
  const steps = block.steps ?? []

  return (
    <div className="sdl-section-inner">
      <div className="sdl-invest-card reveal">
        {block.kicker ? <Kicker dark>{block.kicker}</Kicker> : null}
        {block.title ? (
          <div className="sdl-invest-title" style={{ marginTop: 14 }}>
            {block.title}
          </div>
        ) : null}
        {block.sub ? <p className="sdl-invest-sub">{block.sub}</p> : null}

        <div className="sdl-invest-steps reveal-group" id="investSteps">
          {steps.map((step, index) => (
            <div className="sdl-invest-step" key={step.id ?? index}>
              <div className="sdl-invest-step-top">
                <span className="sdl-invest-step-num">{ordinal(index)}</span>
                {index < steps.length - 1 ? <span className="sdl-invest-step-arrow">→</span> : null}
              </div>
              <div>
                <div className="sdl-invest-step-tick" />
                <div className="sdl-invest-step-title">{step.title}</div>
                <div className="sdl-invest-step-caption">{step.caption}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="sdl-invest-divider" />

        {block.closing?.line1 || block.closing?.line2 ? (
          <div className="sdl-invest-closing">
            <div className="line1">{block.closing.line1}</div>
            <div className="line2">{block.closing.line2}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── Split feature ────────────────────────────────────────────────────────────

export function SplitFeature(props: Record<string, unknown>) {
  const block = props as unknown as Block<'split-feature'>
  const cta = resolveLink(block.left?.cta)

  return (
    <div className="sdl-section-inner">
      <div className="sdl-ai-grid">
        <div className="sdl-ai-left reveal">
          {block.left?.kicker ? <Kicker className="sdl-ai-kicker">{block.left.kicker}</Kicker> : null}
          {block.left?.body ? <p>{block.left.body}</p> : null}
          {cta ? (
            <SmartLink link={cta} className="sdl-ai-cta-btn">
              {cta.label} <span aria-hidden="true">↗</span>
            </SmartLink>
          ) : null}
        </div>

        <div className="reveal">
          <SectionTitle>{block.right?.title}</SectionTitle>
          {block.right?.body ? (
            <div className="sdl-ai-right-body">
              <p>{block.right.body}</p>
            </div>
          ) : null}

          <div className="sdl-process-grid reveal-group" id="aiProcess">
            {(block.right?.processItems ?? []).map((item, index) => (
              <div className="sdl-process-item" key={item.id ?? index}>
                <div className="sdl-process-num">{ordinal(index)}</div>
                <div className="sdl-process-title">{item.title}</div>
                <div className="sdl-process-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Process timeline ─────────────────────────────────────────────────────────

export function ProcessTimeline(props: Record<string, unknown>) {
  const block = props as unknown as Block<'process-timeline'>

  return (
    <div className="sdl-section-inner">
      <div className="svc-section-head reveal">
        {block.kicker ? (
          <div className="svc-section-eyebrow svc-section-eyebrow--dark">{block.kicker}</div>
        ) : null}
        <div className="svc-section-title-block">
          {block.title ? <div className="sdl-pillars-title">{block.title}</div> : null}
          {block.sub ? <p className="sdl-pillars-sub">{block.sub}</p> : null}
        </div>
      </div>

      <div className="svc-timeline reveal-group" id="opportunityProcess">
        {(block.steps ?? []).map((step, index) => (
          <div className="svc-timeline-step" key={step.id ?? index}>
            <div className="svc-timeline-num">{ordinal(index)}</div>
            <div className="svc-timeline-title">{step.title}</div>
            <div className="svc-timeline-desc">{step.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Proof ────────────────────────────────────────────────────────────────────

export function Proof(props: Record<string, unknown>) {
  const block = props as unknown as Block<'proof'>
  const clients =
    block.source === 'manual'
      ? ((block.clients ?? []) as (number | Client)[]).filter(
          (c): c is Client => typeof c === 'object' && c !== null,
        )
      : ((props.clients as Client[] | undefined) ?? [])

  return (
    <div className="sdl-section-inner">
      <div className="sdl-proof-head sdl-split-head reveal">
        {block.kicker ? <Kicker>{block.kicker}</Kicker> : null}
        <div className="sdl-split-head-body">
          <SectionTitle>{block.title}</SectionTitle>
        </div>
      </div>

      <div className="sdl-proof-split">
        <div className="reveal">
          {block.text ? <p className="sdl-proof-split-text">{block.text}</p> : null}
          {block.callout ? <div className="sdl-proof-callout">{block.callout}</div> : null}
          <CtaLink link={block.clientsLink} small className="sdl-proof-clients-cta" />
        </div>

        <div className="reveal">
          {block.blockTitle ? <div className="sdl-proof-block-title">{block.blockTitle}</div> : null}
          <div className="sdl-logo-strip reveal-group" id="logoStrip">
            {clients.map((client) => {
              const logo = resolveMedia(client.logo, 'logo')
              if (!logo) return null
              return (
                <div className="sdl-logo-cell" key={client.id}>
                  <Image
                    src={logo.src}
                    alt={client.name}
                    width={logo.width ?? 320}
                    height={logo.height ?? 160}
                    loading="lazy"
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Testimonials ─────────────────────────────────────────────────────────────

export function Testimonials(props: Record<string, unknown>) {
  const block = props as unknown as Block<'testimonials'>
  const items =
    block.source === 'manual'
      ? ((block.testimonials ?? []) as (number | Testimonial)[]).filter(
          (t): t is Testimonial => typeof t === 'object' && t !== null,
        )
      : ((props.testimonials as Testimonial[] | undefined) ?? [])

  return (
    <div className="sdl-section-inner">
      <div className="sdl-testimonials-head reveal">
        <div className="sdl-testimonials-head-text">
          {block.kicker ? <Kicker withLine={false}>{block.kicker}</Kicker> : null}
          <SectionTitle small>{block.title}</SectionTitle>
        </div>
      </div>

      <div className="sdl-testimonials-grid reveal-group" id="testimonialsGrid">
        {items.map((item) => {
          const avatar = resolveMedia(item.avatar, 'avatar')
          return (
            <div className="sdl-testimonial-card" key={item.id}>
              <div className="sdl-testimonial-person">
                {avatar ? (
                  <Image
                    className="sdl-testimonial-avatar"
                    src={avatar.src}
                    alt={item.name}
                    width={avatar.width ?? 160}
                    height={avatar.height ?? 160}
                    loading="lazy"
                  />
                ) : null}
                <div>
                  <div className="sdl-testimonial-name">{item.name}</div>
                  <div className="sdl-testimonial-role">{item.role}</div>
                </div>
              </div>
              <div className="sdl-testimonial-text">{item.quote}</div>
              <div className="sdl-testimonial-tick" />
            </div>
          )
        })}
      </div>

      <CtaLink link={block.cta} small className="sdl-testimonials-cta" />
    </div>
  )
}

export type { Insight, SectionSub }
