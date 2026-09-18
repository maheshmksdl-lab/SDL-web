import { describe, expect, it } from 'vitest'

import { MAX_LENGTH, summariseErrors, validateField, validateSubmission, type FormField } from '@/lib/forms'

/**
 * The validation the browser and the submission route share. Every rule here is enforced on the
 * server regardless of what the browser did, so these are the rules that decide what reaches
 * Leads.
 */

const field = (overrides: Partial<FormField>): FormField =>
  ({ label: 'Name', name: 'name', type: 'text', required: false, width: 'full', ...overrides }) as FormField

const CONTACT_US: FormField[] = [
  field({ label: 'Name', name: 'name', required: true, width: 'half' }),
  field({ label: 'Email', name: 'email', type: 'email', required: true, width: 'half' }),
  field({ label: 'Company', name: 'company', required: true, width: 'half' }),
  field({ label: 'Phone', name: 'phone', type: 'tel', required: true, width: 'half' }),
  field({ label: 'Brief message of your requirements', name: 'message', type: 'textarea' }),
]

describe('validateField', () => {
  it('requires a required field, treating whitespace as empty', () => {
    expect(validateField(field({ required: true }), '')).toBe('Name is required.')
    expect(validateField(field({ required: true }), '   ')).toBe('Name is required.')
    expect(validateField(field({ required: false }), '')).toBeNull()
  })

  it('checks email shape', () => {
    const email = field({ label: 'Email', name: 'email', type: 'email' })
    expect(validateField(email, 'name@company.com')).toBeNull()
    expect(validateField(email, 'name@company')).toBe('Enter a valid email address.')
    expect(validateField(email, 'not an email')).toBe('Enter a valid email address.')
  })

  it('accepts the phone formats people type and rejects the rest', () => {
    const phone = field({ label: 'Phone', name: 'phone', type: 'tel' })
    for (const ok of ['+91-9900931624', '+1 (408) 555-0199', '020 7946 0958', '9900931624']) {
      expect(validateField(phone, ok)).toBeNull()
    }
    for (const bad of ['call me', '12345', '+91 99009 31624 ext 5', '1234567890123456']) {
      expect(validateField(phone, bad)).toBe('Enter a valid phone number.')
    }
  })

  it('keeps a dropdown to its options', () => {
    const select = field({ label: 'Area', name: 'area', type: 'select', options: ['AI', 'Cloud'] })
    expect(validateField(select, 'AI')).toBeNull()
    expect(validateField(select, 'Other')).toBe('Choose one of the options for Area.')
  })

  it('caps length: short for a line, long for a message', () => {
    expect(validateField(field({}), 'x'.repeat(MAX_LENGTH.short))).toBeNull()
    expect(validateField(field({}), 'x'.repeat(MAX_LENGTH.short + 1))).toMatch(/200 characters or fewer/)
    const message = field({ label: 'Message', name: 'message', type: 'textarea' })
    expect(validateField(message, 'x'.repeat(MAX_LENGTH.long))).toBeNull()
    expect(validateField(message, 'x'.repeat(MAX_LENGTH.long + 1))).toMatch(/5,000 characters or fewer/)
  })
})

describe('validateSubmission', () => {
  it('returns trimmed values for declared fields only, and drops anything else', () => {
    const { data, errors } = validateSubmission(CONTACT_US, {
      name: '  Asha  ',
      email: 'asha@example.com',
      company: 'Example Co',
      phone: '+91-9900931624',
      message: '',
      website: 'bot',
      role: 'admin',
    })
    expect(errors).toEqual({})
    expect(data).toEqual({
      name: 'Asha',
      email: 'asha@example.com',
      company: 'Example Co',
      phone: '+91-9900931624',
    })
  })

  it('reports a message per failing field', () => {
    const { errors } = validateSubmission(CONTACT_US, { name: '', email: 'x@', company: 'Co', phone: '12' })
    expect(errors).toEqual({
      name: 'Name is required.',
      email: 'Enter a valid email address.',
      phone: 'Enter a valid phone number.',
    })
  })

  it('ignores non-string values rather than storing them', () => {
    const { data, errors } = validateSubmission(CONTACT_US, {
      name: ['Asha'],
      email: 'asha@example.com',
      company: 'Co',
      phone: '9900931624',
    })
    expect(errors.name).toBe('Name is required.')
    expect(data.name).toBeUndefined()
  })
})

describe('summariseErrors', () => {
  it('uses the message itself for one error, and names the fields for several', () => {
    expect(summariseErrors(CONTACT_US, { email: 'Enter a valid email address.' })).toBe(
      'Enter a valid email address.',
    )
    expect(summariseErrors(CONTACT_US, { phone: 'x', name: 'y' })).toBe('Please check: Name, Phone.')
  })
})
