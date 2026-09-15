import type { Form, Page } from '@/lib/payload-types'
import { resolveLink } from '@/lib/links'
import { AccentLines, Kicker, type HeadingLine } from '@/components/ui/primitives'
import { SmartLink } from '@/components/ui/smart-link'

import { ContactFormFields } from './form-fields'

type Block = Extract<NonNullable<Page['layout']>[number], { blockType: 'contact-form' }>

/**
 * The contact section.
 *
 * Server component for the copy and the two variants; only the form itself is a client island,
 * because it needs validation state and the success swap.
 *
 * The field list comes from the CMS Form record — the same record the server validates against
 * on submit, so a field cannot exist in the UI without existing in the schema.
 */
export function ContactForm(props: Record<string, unknown>) {
  const block = props as unknown as Block
  const form = (props.formDefinition as Form | null) ?? (typeof block.form === 'object' ? block.form : null)
  const calloutCta = resolveLink(block.callout?.cta)

  return (
    <div className="sdl-section-inner sdl-contact-grid">
      <div className="reveal">
        {block.kicker ? <Kicker dark>{block.kicker}</Kicker> : null}

        <AccentLines
          lines={block.headingLines as HeadingLine[] | null | undefined}
          as="h2"
          className="sdl-contact-heading"
        />

        {block.sub ? <p className="sdl-contact-sub-dark">{block.sub}</p> : null}

        {block.variant === 'callout' ? (
          block.callout?.title || block.callout?.desc ? (
            <div className="sdl-contact-callout-card">
              <div className="sdl-contact-callout-title">{block.callout.title}</div>
              <p className="sdl-contact-callout-desc">{block.callout.desc}</p>
              {calloutCta ? (
                <SmartLink link={calloutCta} className="sdl-contact-callout-cta">
                  {calloutCta.label} <span aria-hidden="true">→</span>
                </SmartLink>
              ) : null}
            </div>
          ) : null
        ) : block.pillText ? (
          <div className="sdl-contact-pill">
            <span className="pill-icon">✦</span> {block.pillText}
          </div>
        ) : null}
      </div>

      <div className="sdl-form-card reveal">
        {form ? (
          <ContactFormFields form={form} />
        ) : (
          <div className="sdl-form">
            <p>This form is not configured yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
