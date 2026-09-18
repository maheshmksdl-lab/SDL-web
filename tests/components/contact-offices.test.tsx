import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ContactOffices } from '@/components/sections/contact-offices'
import type { Form } from '@/lib/payload-types'

/**
 * The Contact Us section: office details and the enquiry form, both from CMS data. The form's
 * rules are covered in tests/unit/forms.test.ts; this covers what the visitor sees and what is
 * posted.
 */

const FORM = {
  id: 7,
  name: 'Contact Us',
  slug: 'contact-us',
  submitLabel: 'Submit',
  success: { title: 'Thank you — your enquiry has been received.', body: 'We will be in touch.' },
  fields: [
    { id: 'f1', label: 'Name', name: 'name', type: 'text', required: true, width: 'half' },
    { id: 'f2', label: 'Email', name: 'email', type: 'email', required: true, width: 'half' },
    { id: 'f3', label: 'Company', name: 'company', type: 'text', required: true, width: 'half' },
    { id: 'f4', label: 'Phone', name: 'phone', type: 'tel', required: true, width: 'half' },
    { id: 'f5', label: 'Brief message of your requirements', name: 'message', type: 'textarea', required: false, width: 'full' },
  ],
} as unknown as Form

const BLOCK = {
  blockType: 'contact-offices',
  heading: 'Get in touch',
  headingLevel: 'h1',
  sub: 'Need help with digital transformation?\nContact us today!',
  offices: [
    { id: 'o1', region: 'India', addressLabel: 'Address', address: 'Bengaluru – 560049', email: 'info@socialdnalabs.com', phone: '+91-9900931624' },
    { id: 'o2', region: 'USA', addressLabel: 'Address', address: 'San Jose, CA 95110', email: 'info@socialdnalabs.com' },
  ],
  intro: 'We are excited to hear from you.',
  form: 7,
  formDefinition: FORM,
}

const renderSection = () => render(<ContactOffices {...BLOCK} />)
const form = () => screen.getByRole('button', { name: 'Submit' }).closest('form')!

function fillValid() {
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Asha Rao' } })
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'asha@example.com' } })
  fireEvent.change(screen.getByLabelText(/^Company/), { target: { value: 'Example Co' } })
  fireEvent.change(screen.getByLabelText(/^Phone/), { target: { value: '+91-9900931624' } })
}

afterEach(() => vi.unstubAllGlobals())

describe('ContactOffices', () => {
  it('renders the heading, each office and its contact links', () => {
    renderSection()

    expect(screen.getByRole('heading', { level: 1, name: 'Get in touch' })).toBeTruthy()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['India', 'USA'])
    expect(screen.getByRole('link', { name: '+91-9900931624' }).getAttribute('href')).toBe('tel:+919900931624')
    expect(
      screen.getAllByRole('link', { name: 'info@socialdnalabs.com' }).map((a) => a.getAttribute('href')),
    ).toEqual(['mailto:info@socialdnalabs.com', 'mailto:info@socialdnalabs.com'])
    expect(screen.getByText('We are excited to hear from you.')).toBeTruthy()
  })

  it('renders the form’s fields from the CMS, with required ones marked', () => {
    renderSection()

    for (const label of ['Name', 'Email', 'Company', 'Phone']) {
      const input = screen.getByLabelText(new RegExp(`^${label}`)) as HTMLInputElement
      expect(input.required).toBe(true)
    }
    expect((screen.getByLabelText('Brief message of your requirements') as HTMLTextAreaElement).required).toBe(false)
  })

  it('shows each problem beside its field and posts nothing', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderSection()

    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'nope' } })
    fireEvent.submit(form())

    expect(fetchMock).not.toHaveBeenCalled()
    const email = screen.getByLabelText(/^Email/)
    expect(email.getAttribute('aria-invalid')).toBe('true')
    expect(document.getElementById(email.getAttribute('aria-describedby')!)!.textContent).toBe(
      'Enter a valid email address.',
    )
    expect(screen.getByText('Name is required.')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByLabelText(/^Name/))
  })

  it('posts the values to the form route and shows the success message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    renderSection()

    fillValid()
    fireEvent.submit(form())

    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy())
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/forms/contact-us')
    expect(JSON.parse(init.body).data).toMatchObject({
      name: 'Asha Rao',
      email: 'asha@example.com',
      company: 'Example Co',
      phone: '+91-9900931624',
      website: '',
    })
    expect(within(screen.getByRole('status')).getByText('Thank you — your enquiry has been received.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Send another enquiry' }))
    expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('')
  })

  it('puts the server’s field errors on the fields, and its summary in an alert', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: 'Enter a valid phone number.', fieldErrors: { phone: 'Enter a valid phone number.' } }),
          { status: 400 },
        ),
      ),
    )
    renderSection()

    fillValid()
    fireEvent.submit(form())

    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Enter a valid phone number.'))
    expect(screen.getByLabelText(/^Phone/).getAttribute('aria-invalid')).toBe('true')
    // What the visitor typed is kept, so they only fix the one field.
    expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('Asha Rao')
  })

  it('says so when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderSection()

    fillValid()
    fireEvent.submit(form())

    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/could not reach our server/))
    expect(screen.getByRole('button', { name: 'Submit' })).toBeTruthy()
  })
})
