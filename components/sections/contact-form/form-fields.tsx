'use client'

import { useId, useRef, useState } from 'react'

import type { Form } from '@/lib/payload-types'

/**
 * The contact form.
 *
 * Reproduces the design's behaviour: `novalidate` on the form so the browser does not show its
 * own bubbles on input, then `checkValidity()` / `reportValidity()` on submit, and on success
 * the form is replaced by `.sdl-form-success`.
 *
 * Beyond the design:
 *   - the submission actually goes somewhere (POST /api/forms/[slug])
 *   - a honeypot field catches naive bots
 *   - failures surface inline and keep what the visitor typed, rather than navigating away
 *   - `aria-live` on the error and success regions, so the outcome is announced
 */
export function ContactFormFields({ form }: { form: Form }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const errorId = useId()

  const fields = form.fields ?? []

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const el = formRef.current
    if (!el) return

    // The design's exact pattern: novalidate, then explicitly ask for validation on submit.
    if (!el.checkValidity()) {
      el.reportValidity()
      return
    }

    setState('submitting')
    setError(null)

    const data = Object.fromEntries(new FormData(el).entries())

    try {
      const response = await fetch(`/api/forms/${form.slug}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data, pathname: window.location.pathname }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Something went wrong. Please try again.')
      }

      setState('success')
    } catch (submitError) {
      setState('error')
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.')
    }
  }

  // Consecutive half-width fields are paired into a row, as the design does.
  const rows: (typeof fields)[] = []
  let pending: typeof fields = []
  for (const field of fields) {
    if (field.width === 'half') {
      pending.push(field)
      if (pending.length === 2) {
        rows.push(pending)
        pending = []
      }
    } else {
      if (pending.length) {
        rows.push(pending)
        pending = []
      }
      rows.push([field])
    }
  }
  if (pending.length) rows.push(pending)

  return (
    <>
      <div className="sdl-form-card-head">
        <span>{form.cardTitle ?? form.name}</span>
        <span id="formStepCount">01 / 01</span>
      </div>

      <div className="sdl-form">
        {state !== 'success' ? (
          <form ref={formRef} noValidate onSubmit={onSubmit}>
            {rows.map((row, rowIndex) => {
              const inner = row.map((field) => (
                <div className="sdl-form-row" key={field.id ?? field.name}>
                  <label htmlFor={`cf-${field.name}`}>
                    {field.label}
                    {field.required ? '*' : <span className="optional"> (optional)</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id={`cf-${field.name}`}
                      name={field.name}
                      rows={4}
                      required={field.required ?? false}
                      placeholder={field.placeholder ?? undefined}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={`cf-${field.name}`}
                      name={field.name}
                      required={field.required ?? false}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        {field.placeholder ?? 'Select an option'}
                      </option>
                      {(field.options ?? []).map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`cf-${field.name}`}
                      name={field.name}
                      type={field.type ?? 'text'}
                      required={field.required ?? false}
                      placeholder={field.placeholder ?? undefined}
                      autoComplete={autoCompleteFor(field.type, field.name)}
                    />
                  )}
                </div>
              ))

              return row.length === 2 ? (
                <div className="sdl-form-row-pair" key={rowIndex}>
                  {inner}
                </div>
              ) : (
                inner
              )
            })}

            {/*
              Honeypot. Hidden from sight and from assistive tech, and never focusable — a
              human cannot fill it in, so any value means an automated submission.
            */}
            <div aria-hidden="true" className="sdl-visually-hidden">
              <label htmlFor="cf-website">Leave this empty</label>
              <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <button type="submit" className="sdl-form-submit" disabled={state === 'submitting'}>
              {state === 'submitting' ? 'Sending…' : (form.submitLabel ?? 'Send')}{' '}
              <span className="sdl-form-submit-icon" aria-hidden="true">
                ✈
              </span>
            </button>

            {error ? (
              <div id={errorId} role="alert" className="sdl-form-error">
                {error}
              </div>
            ) : null}

            {form.fineprint ? <div className="sdl-form-fineprint">{form.fineprint}</div> : null}
          </form>
        ) : null}

        <div className={`sdl-form-success${state === 'success' ? ' show' : ''}`} id="formSuccess" aria-live="polite">
          <div className="icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="title">{form.success?.title ?? 'Thanks — message received.'}</div>
          <div className="sub">{form.success?.body}</div>
        </div>
      </div>
    </>
  )
}

/** Browser autofill hints. The design sets these; they materially help on mobile. */
function autoCompleteFor(type: string | null | undefined, name: string): string | undefined {
  if (type === 'email') return 'email'
  if (type === 'tel') return 'tel'
  if (/company|organisation|organization/i.test(name)) return 'organization'
  if (/name/i.test(name)) return 'name'
  return undefined
}
