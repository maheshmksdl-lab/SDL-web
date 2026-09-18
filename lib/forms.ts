import type { Form } from '@/lib/payload-types'

/**
 * Form validation, shared by the browser and the submission route.
 *
 * One implementation, so a message the visitor sees beside a field is exactly the rule the server
 * enforces — the server never trusts the browser's verdict, but it also never disagrees with it.
 * Rules come from the CMS Form record's field list; nothing here knows about any specific form.
 */

export type FormField = NonNullable<Form['fields']>[number]

export type FieldErrors = Record<string, string>

/** Long enough for a real enquiry, short enough to stop abuse. */
export const MAX_LENGTH = { short: 200, long: 5000 } as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Digits with the separators people actually type: +44 (0)20 7946-0958, +91-9900931624.
const PHONE = /^\+?[\d\s().-]+$/

export function maxLengthFor(field: Pick<FormField, 'type'>): number {
  return field.type === 'textarea' ? MAX_LENGTH.long : MAX_LENGTH.short
}

/** The message for one field's value, or null when it is acceptable. */
export function validateField(field: FormField, raw: unknown): string | null {
  const value = typeof raw === 'string' ? raw.trim() : ''
  const label = field.label || field.name

  if (!value) return field.required ? `${label} is required.` : null

  if (value.length > maxLengthFor(field)) {
    return `${label} must be ${maxLengthFor(field).toLocaleString('en-US')} characters or fewer.`
  }
  // Kept to one short line: the message sits under a half-width field.
  if (field.type === 'email' && !EMAIL.test(value)) {
    return 'Enter a valid email address.'
  }
  if (field.type === 'tel') {
    const digits = value.replace(/\D/g, '').length
    if (!PHONE.test(value) || digits < 7 || digits > 15) {
      return 'Enter a valid phone number.'
    }
  }
  if (field.type === 'select' && field.options?.length && !field.options.includes(value)) {
    return `Choose one of the options for ${label}.`
  }
  return null
}

/**
 * Checks a whole submission against the form's declared fields.
 *
 * Returns the cleaned values — trimmed, and ONLY for declared fields, so a key the form does not
 * declare is dropped rather than stored — plus a message per failing field.
 */
export function validateSubmission(
  fields: FormField[],
  submitted: Record<string, unknown>,
): { data: Record<string, string>; errors: FieldErrors } {
  const data: Record<string, string> = {}
  const errors: FieldErrors = {}

  for (const field of fields) {
    const message = validateField(field, submitted[field.name])
    if (message) {
      errors[field.name] = message
      continue
    }
    const value = submitted[field.name]
    if (typeof value === 'string' && value.trim()) data[field.name] = value.trim()
  }

  return { data, errors }
}

/** Browser autofill hints. The design sets these; they materially help on mobile. */
export function autoCompleteFor(type: string | null | undefined, name: string): string | undefined {
  if (type === 'email') return 'email'
  if (type === 'tel') return 'tel'
  if (/company|organisation|organization/i.test(name)) return 'organization'
  if (/name/i.test(name)) return 'name'
  return undefined
}

/** One sentence for the whole submission, for a form that shows a single message. */
export function summariseErrors(fields: FormField[], errors: FieldErrors): string {
  const failing = fields.filter((field) => errors[field.name])
  if (failing.length === 1) return errors[failing[0]!.name]!
  return `Please check: ${failing.map((field) => field.label || field.name).join(', ')}.`
}
