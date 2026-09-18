import type { Form, Page } from '@/lib/payload-types'

import { EnquiryForm } from './enquiry-form'

type Block = Extract<NonNullable<Page['layout']>[number], { blockType: 'contact-offices' }>

/**
 * The Contact Us page's section: office details on the left; on the right, an introduction beside
 * an arrow and the enquiry form on an SDL-blue panel.
 *
 * A server component, so every address and number ships as HTML. Only the form is a client
 * island, and its fields come from the CMS Form record the submission route validates against.
 */
export function ContactOffices(props: Record<string, unknown>) {
  const block = props as unknown as Block
  const form =
    (props.formDefinition as Form | null | undefined) ??
    (typeof block.form === 'object' ? block.form : null)

  const Heading = block.headingLevel === 'h2' ? 'h2' : 'h1'
  const RegionHeading = Heading === 'h1' ? 'h2' : 'h3'
  const offices = block.offices ?? []

  return (
    <div className="sdl-section-inner sdl-contact-page__grid">
      <div className="sdl-contact-page__details reveal">
        <Heading className="sdl-contact-page__title">{block.heading}</Heading>
        {block.sub ? <p className="sdl-contact-page__sub">{block.sub}</p> : null}

        {offices.map((office) => (
          <section className="sdl-contact-office" key={office.id ?? office.region}>
            <RegionHeading className="sdl-contact-office__region">{office.region}</RegionHeading>

            <address className="sdl-contact-office__card">
              {office.address ? (
                <>
                  <p className="sdl-contact-office__label">{office.addressLabel || 'Address'}</p>
                  <p className="sdl-contact-office__address">{office.address}</p>
                </>
              ) : null}

              {office.email || office.phone ? (
                <ul className="sdl-contact-office__lines">
                  {office.email ? (
                    <li>
                      <MailIcon />
                      <a href={`mailto:${office.email}`}>{office.email}</a>
                    </li>
                  ) : null}
                  {office.phone ? (
                    <li>
                      <PhoneIcon />
                      <a href={`tel:${office.phone.replace(/[^\d+]/g, '')}`}>{office.phone}</a>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </address>
          </section>
        ))}
      </div>

      <div className="sdl-contact-page__enquiry reveal">
        {block.intro ? (
          <div className="sdl-contact-page__intro">
            <span className="sdl-contact-page__arrow" aria-hidden="true" />
            <p>{block.intro}</p>
          </div>
        ) : null}

        <div className="sdl-contact-page__panel">
          {form ? (
            <EnquiryForm form={form} />
          ) : (
            <p className="sdl-contact-panel__status">This form is not configured yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h16a1.5 1.5 0 0 1 1.5 1.5v.35L12 12.2 2.5 5.85V5.5Z" />
      <path d="M2.5 8.25V18.5A1.5 1.5 0 0 0 4 20h16a1.5 1.5 0 0 0 1.5-1.5V8.25l-8.94 5.96a1 1 0 0 1-1.12 0L2.5 8.25Z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.6 2.5c.5-.1 1 .2 1.2.7l1.6 3.9c.2.5.1 1-.3 1.4L7.2 10.2a15.3 15.3 0 0 0 6.6 6.6l1.7-1.9c.4-.4.9-.5 1.4-.3l3.9 1.6c.5.2.8.7.7 1.2l-.6 3.4c-.1.6-.6 1-1.2 1C10.2 21.8 2.2 13.8 2.2 4.3c0-.6.4-1.1 1-1.2l3.4-.6Z" />
    </svg>
  )
}
