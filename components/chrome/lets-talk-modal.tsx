'use client'

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { Form } from '@/lib/payload-types'
import { ContactFormFields } from '@/components/sections/contact-form/form-fields'
import { AccentLines, type HeadingLine } from '@/components/ui/primitives'

/**
 * The popup's own heading — matching the home page's "Have an outcome in mind?" contact section
 * (same two-line plain-then-accent treatment, via the same `AccentLines` primitive) rather than
 * the flat single-line title this popup used to show. Fixed content, not CMS-driven: this is the
 * one sitewide popup, not a per-page block, so there's no per-instance value to source it from.
 */
const MODAL_HEADING_LINES: HeadingLine[] = [{ before: 'Have an outcome' }, { accent: 'in mind?' }]

/**
 * The "Let's talk" popup, opened from the header's CTA (see header-nav.tsx).
 *
 * Renders the same field markup and CSS (`sdl-form-card`, `sdl-form-row`, `sdl-form-submit`, …)
 * as the contact-form block on the home and services pages — `ContactFormFields` is shared
 * rather than re-implemented, so the two stay in step by construction. Only the shell around it
 * — the overlay, the card's head and its close button — is specific to the popup.
 *
 * Portalled to `document.body` so it is never affected by an ancestor's `overflow` or stacking
 * context, and so its DOM position does not depend on where the trigger happens to sit in the
 * header's markup.
 */
export function LetsTalkModal({
  form,
  open,
  onClose,
}: {
  form: Form | null
  open: boolean
  onClose: () => void
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    // Move focus into the dialog, preferring the first field over the close button so a visitor
    // who opened the popup can start typing immediately.
    const dialog = dialogRef.current
    const firstField = dialog?.querySelector<HTMLElement>('input, textarea, select')
    ;(firstField ?? dialog?.querySelector<HTMLElement>('button'))?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      // A minimal focus trap: Tab past either end wraps, rather than leaving the dialog for the
      // page behind it while it is open.
      if (event.key !== 'Tab' || !dialog) return
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="sdl-modal-overlay"
      // Only a click that STARTS on the overlay itself dismisses it — one that starts inside the
      // card and drags out (selecting text, say) must not.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="sdl-modal-card sdl-form-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <div className="sdl-modal-head">
          <AccentLines lines={MODAL_HEADING_LINES} id={titleId} className="sdl-modal-title" />
          <button type="button" className="sdl-modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="sdl-modal-body">
          {form ? (
            <ContactFormFields form={form} showHead={false} />
          ) : (
            <div className="sdl-form">
              <p>This form is not configured yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
