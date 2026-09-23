import Image from 'next/image'

import type { Client, Page, Testimonial } from '@/lib/payload-types'
import { resolveLink, resolveMedia, type CmsLink } from '@/lib/links'
import { Kicker, PillButton, SectionTitle } from '@/components/ui/primitives'
import { SmartLink } from '@/components/ui/smart-link'

/**
 * The Clients and Testimonials pages.
 *
 * All Server Components, following the same pattern as home-sections.tsx: each function reads
 * its own block's fields off `props` and any collection data `RenderBlocks` resolved for it.
 */

type Block<T extends string> = Extract<NonNullable<Page['layout']>[number], { blockType: T }>

// ── Page intro ───────────────────────────────────────────────────────────────

export function PageIntro(props: Record<string, unknown>) {
  const block = props as unknown as Block<'page-intro'>

  return (
    <div className="sdl-section-inner sdl-page-intro-inner">
      {block.title ? (
        <SectionTitle as="h1" className="sdl-page-intro-title">
          {block.title}
        </SectionTitle>
      ) : null}
      {block.sub ? <p className="sdl-page-intro-sub">{block.sub}</p> : null}
    </div>
  )
}

// ── Clients / Testimonials tab switcher ─────────────────────────────────────

/**
 * The "Clients | Testimonials" pill switcher both pages render above their grid.
 *
 * Real navigation between two CMS pages, not client-side tab state — see cms/src/blocks/company.ts.
 */
function ClientsTestimonialsTabs({
  clientsTab,
  testimonialsTab,
  active,
}: {
  clientsTab: CmsLink
  testimonialsTab: CmsLink
  active: 'clients' | 'testimonials'
}) {
  const clients = resolveLink(clientsTab)
  const testimonials = resolveLink(testimonialsTab)
  if (!clients && !testimonials) return null

  return (
    <nav className="sdl-tabs reveal" aria-label="Clients and testimonials">
      {clients ? (
        <SmartLink
          link={clients}
          className={`sdl-tab${active === 'clients' ? ' sdl-tab--active' : ''}`}
          aria-current={active === 'clients' ? 'page' : undefined}
        >
          Clients
        </SmartLink>
      ) : null}
      {testimonials ? (
        <SmartLink
          link={testimonials}
          className={`sdl-tab${active === 'testimonials' ? ' sdl-tab--active' : ''}`}
          aria-current={active === 'testimonials' ? 'page' : undefined}
        >
          Testimonials
        </SmartLink>
      ) : null}
    </nav>
  )
}

// ── Clients grid ─────────────────────────────────────────────────────────────

export function ClientsGrid(props: Record<string, unknown>) {
  const block = props as unknown as Block<'clients-grid'>
  const clients =
    block.source === 'manual'
      ? ((block.clients ?? []) as (number | Client)[]).filter(
          (c): c is Client => typeof c === 'object' && c !== null,
        )
      : ((props.clients as Client[] | undefined) ?? [])

  return (
    <div className="sdl-section-inner">
      <ClientsTestimonialsTabs
        clientsTab={block.clientsTab}
        testimonialsTab={block.testimonialsTab}
        active="clients"
      />

      {block.title || block.sub ? (
        <div className="sdl-company-head reveal">
          {block.kicker ? <Kicker withLine={false}>{block.kicker}</Kicker> : null}
          {block.title ? <SectionTitle className="sdl-company-title">{block.title}</SectionTitle> : null}
          {block.sub ? <p className="sdl-section-sub sdl-company-sub">{block.sub}</p> : null}
        </div>
      ) : null}

      <div className="sdl-clients-grid reveal-group">
        {clients.map((client) => {
          // The original, not the `logo` derivative: derivatives generated before the CMS filled
          // their letterbox white carry black bars on every non-2:1 logo.
          const logo = resolveMedia(client.logo)
          if (!logo) return null
          const inner = (
            <Image src={logo.src} alt={client.name} width={logo.width ?? 200} height={logo.height ?? 100} loading="lazy" />
          )
          return (
            <div className="sdl-client-card" key={client.id}>
              {client.url ? (
                <a href={client.url} target="_blank" rel="noopener noreferrer" aria-label={client.name}>
                  {inner}
                </a>
              ) : (
                inner
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Testimonials grid ────────────────────────────────────────────────────────

const STAR_PATH = 'M12 2.5l2.95 6.28 6.9.75-5.1 4.77 1.37 6.82L12 17.77l-6.12 3.35 1.37-6.82-5.1-4.77 6.9-.75L12 2.5z'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="sdl-testimonial-grid-stars" aria-label={`Rated ${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          className={`sdl-star${index < rating ? ' sdl-star--filled' : ''}`}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  )
}

export function TestimonialsGrid(props: Record<string, unknown>) {
  const block = props as unknown as Block<'testimonials-grid'>
  const items =
    block.source === 'manual'
      ? ((block.testimonials ?? []) as (number | Testimonial)[]).filter(
          (t): t is Testimonial => typeof t === 'object' && t !== null,
        )
      : ((props.testimonials as Testimonial[] | undefined) ?? [])

  return (
    <div className="sdl-section-inner">
      <ClientsTestimonialsTabs
        clientsTab={block.clientsTab}
        testimonialsTab={block.testimonialsTab}
        active="testimonials"
      />

      {block.title || block.sub ? (
        <div className="sdl-company-head reveal">
          {block.kicker ? <Kicker withLine={false}>{block.kicker}</Kicker> : null}
          {block.title ? <SectionTitle className="sdl-company-title">{block.title}</SectionTitle> : null}
          {block.sub ? <p className="sdl-section-sub sdl-company-sub">{block.sub}</p> : null}
        </div>
      ) : null}

      <div className="sdl-testimonials-grid-page reveal-group">
        {items.map((item) => {
          const avatar = resolveMedia(item.avatar, 'avatar')
          return (
            <div className="sdl-testimonial-grid-card" key={item.id}>
              <Stars rating={item.rating ?? 5} />
              {item.role ? <div className="sdl-testimonial-grid-headline">{item.role}</div> : null}
              <p className="sdl-testimonial-grid-text">{item.quote}</p>
              <div className="sdl-testimonial-grid-person">
                {avatar ? (
                  <Image
                    className="sdl-testimonial-grid-avatar"
                    src={avatar.src}
                    alt={item.name}
                    width={avatar.width ?? 88}
                    height={avatar.height ?? 88}
                    loading="lazy"
                  />
                ) : null}
                <div>
                  <div className="sdl-testimonial-grid-name">{item.name}</div>
                  {item.designation ? (
                    <div className="sdl-testimonial-grid-designation">{item.designation}</div>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Success CTA ──────────────────────────────────────────────────────────────

export function SuccessCta(props: Record<string, unknown>) {
  const block = props as unknown as Block<'success-cta'>

  return (
    <div className="sdl-success-cta-card reveal">
      {block.title ? <div className="sdl-success-cta-title">{block.title}</div> : null}
      {block.sub ? <p className="sdl-success-cta-sub">{block.sub}</p> : null}
      <PillButton link={block.cta} className="sdl-hero-primary sdl-success-cta-btn" />
    </div>
  )
}
