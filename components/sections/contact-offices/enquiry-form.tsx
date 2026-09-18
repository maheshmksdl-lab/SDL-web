'use client'

import { useEffect, useId, useRef, useState } from 'react'

import type { Form } from '@/lib/payload-types'
import {
  autoCompleteFor, maxLengthFor, validateField, type FieldErrors, type FormField,
} from '@/lib/forms'

type Status = 'idle' | 'submitting' | 'success' | 'error'

/**
 * The Contact Us enquiry form, on the SDL-blue panel.
 *
 * Fields, labels, submit text and success copy all come from the CMS Form record. Validation is
 * `lib/forms.ts` — the same rules the submission route enforces — shown beside each field:
 *   - a field is checked when the visitor leaves it, then live while they correct it
 *   - submit checks everything and moves focus to the first problem
 *   - the server's verdict still wins: its per-field messages land on the same fields
 *
 * On success the form is swapped for a confirmation that takes focus, so a screen reader
 * announces it; "Send another enquiry" brings back an empty form.
 */
export function EnquiryForm({ form }: { form: Form }) {
  const fields = form.fields ?? []
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<string | null>(null)
  const uid = useId()
  const idFor = (name: string) => `${uid}-${name}`

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  function check(field: FormField, value: string) {
    const problem = validateField(field, value)
    setErrors((current) => {
      const next = { ...current }
      if (problem) next[field.name] = problem
      else delete next[field.name]
      return next
    })
  }

  function focusFirst(found: FieldErrors) {
    const first = fields.find((field) => found[field.name])
    if (first) document.getElementById(idFor(first.name))?.focus()
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const el = formRef.current
    if (!el) return

    const values = Object.fromEntries(new FormData(el).entries())
    const found: FieldErrors = {}
    for (const field of fields) {
      const problem = validateField(field, values[field.name])
      if (problem) found[field.name] = problem
    }

    setErrors(found)
    setChecked(Object.fromEntries(fields.map((field) => [field.name, true])))
    setMessage(null)

    if (Object.keys(found).length) {
      focusFirst(found)
      return
    }

    setStatus('submitting')

    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(form.slug)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: values, pathname: window.location.pathname }),
      })
      const body = (await response.json().catch(() => null)) as {
        error?: string
        fieldErrors?: FieldErrors
      } | null

      if (!response.ok) {
        if (body?.fieldErrors && Object.keys(body.fieldErrors).length) {
          setErrors(body.fieldErrors)
          focusFirst(body.fieldErrors)
        }
        setStatus('error')
        setMessage(body?.error ?? 'Something went wrong. Please try again.')
        return
      }

      el.reset()
      setErrors({})
      setChecked({})
      setStatus('success')
    } catch {
      setStatus('error')
      setMessage('We could not reach our server. Check your connection and try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="sdl-contact-panel__success" role="status" tabIndex={-1} ref={successRef}>
        <span className="sdl-contact-panel__success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <p className="sdl-contact-panel__success-title">
          {form.success?.title || 'Thank you — your enquiry has been received.'}
        </p>
        {form.success?.body ? (
          <p className="sdl-contact-panel__success-body">{form.success.body}</p>
        ) : null}
        <button type="button" className="sdl-contact-panel__again" onClick={() => setStatus('idle')}>
          Send another enquiry
        </button>
      </div>
    )
  }

  // Consecutive half-width fields share a row, as the Form record lays them out.
  const rows: FormField[][] = []
  for (const field of fields) {
    const last = rows[rows.length - 1]
    if (field.width === 'half' && last?.length === 1 && last[0]!.width === 'half') last.push(field)
    else rows.push([field])
  }

  const renderField = (field: FormField) => {
    const id = idFor(field.name)
    const errorId = `${id}-error`
    const error = errors[field.name]
    const common = {
      id,
      name: field.name,
      required: field.required ?? false,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? errorId : undefined,
      onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setChecked((current) => ({ ...current, [field.name]: true }))
        check(field, event.target.value)
      },
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        // Quiet until the visitor has left the field once; from then on, live.
        if (checked[field.name]) check(field, event.target.value)
      },
    }

    return (
      <div className="sdl-contact-panel__field" data-invalid={error ? 'true' : undefined} key={field.id ?? field.name}>
        <label htmlFor={id}>
          {field.label}
          {field.required ? <span aria-hidden="true"> *</span> : null}
        </label>

        {field.type === 'textarea' ? (
          <textarea {...common} rows={5} maxLength={maxLengthFor(field)} placeholder={field.placeholder ?? undefined} />
        ) : field.type === 'select' ? (
          <select {...common} defaultValue="">
            <option value="" disabled>
              {field.placeholder ?? 'Select an option'}
            </option>
            {(field.options ?? []).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            {...common}
            type={field.type ?? 'text'}
            maxLength={maxLengthFor(field)}
            placeholder={field.placeholder ?? undefined}
            autoComplete={autoCompleteFor(field.type, field.name)}
            inputMode={field.type === 'tel' ? 'tel' : undefined}
          />
        )}

        {/* Always rendered, with its height reserved in CSS: a message appearing as the visitor
            leaves a field must not push the Submit button away from a click already on its
            way — the press would blur the field, and the release would land on empty space. */}
        <p className="sdl-contact-panel__error" id={errorId}>
          {error}
        </p>
      </div>
    )
  }

  return (
    <form ref={formRef} className="sdl-contact-panel" noValidate onSubmit={onSubmit}>
      {rows.map((row, index) =>
        row.length === 2 ? (
          <div className="sdl-contact-panel__pair" key={index}>
            {row.map(renderField)}
          </div>
        ) : (
          renderField(row[0]!)
        ),
      )}

      {/* Honeypot: hidden from sight and from assistive tech, and never focusable — a person
          cannot fill it in, so any value marks the submission as automated. */}
      <div aria-hidden="true" className="sdl-visually-hidden">
        <label htmlFor={idFor('website')}>Leave this empty</label>
        <input id={idFor('website')} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {message ? (
        <p className="sdl-contact-panel__alert" role="alert">
          {message}
        </p>
      ) : null}

      <div className="sdl-contact-panel__actions">
        {form.fineprint ? <p className="sdl-contact-panel__fineprint">{form.fineprint}</p> : null}
        <button
          type="submit"
          className="sdl-contact-panel__submit"
          disabled={status === 'submitting'}
          aria-busy={status === 'submitting' || undefined}
        >
          {status === 'submitting' ? 'Submitting…' : form.submitLabel || 'Submit'}
        </button>
      </div>
    </form>
  )
}
