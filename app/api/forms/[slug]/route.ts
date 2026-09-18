import { createHash } from 'node:crypto'

import { getForm } from '@/lib/cms/queries'
import { summariseErrors, validateSubmission } from '@/lib/forms'

/** Must match FORM_SECRET_HEADER in cms/src/access/rbac.ts. */
const FORM_SECRET_HEADER = 'x-sdl-form-secret'

/**
 * Form submission.
 *
 * The order matters and is the same as the plan's §8.4: cheap rejections first, then the lead
 * is PERSISTED, and only then is email attempted. A lead is never lost because a mail provider
 * was down — the reference project gets this right and it is the single most important property
 * of this pipeline.
 *
 * Validation is against the CMS Form record, never against what the client sent. A field the
 * form does not declare is dropped rather than stored, so the shape of a lead cannot be dictated
 * by whoever is posting to it.
 */

const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001').replace(/\/$/, '')

/** Small in-process sliding window. Enough to stop a burst; not a substitute for a WAF. */
const RATE_LIMIT = { windowMs: 60_000, max: 5 }
const hits = new Map<string, number[]>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs)
  recent.push(now)
  hits.set(key, recent)

  // Keep the map from growing without bound on a long-lived server.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < RATE_LIMIT.windowMs)) hits.delete(k)
  }

  return recent.length > RATE_LIMIT.max
}

/** Hashed, never stored raw — enough to rate-limit, not enough to identify. */
function hashIp(ip: string): string {
  return createHash('sha256').update(`${ip}:${process.env.REVALIDATE_SECRET ?? ''}`).digest('hex').slice(0, 32)
}

async function verifyRecaptcha(token: string | undefined): Promise<number | null> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return null // not configured — treated as "not required"
  if (!token) return 0

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    const body = (await res.json()) as { success?: boolean; score?: number }
    return body.success ? (body.score ?? 0.5) : 0
  } catch {
    // A reCAPTCHA outage must not block genuine enquiries.
    return null
  }
}

export async function POST(request: Request, context: RouteContext<'/api/forms/[slug]'>) {
  const { slug } = await context.params

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  if (rateLimited(`${slug}:${ip}`)) {
    return Response.json({ error: 'Too many submissions. Please try again shortly.' }, { status: 429 })
  }

  let payload: { data?: Record<string, unknown>; pathname?: string; recaptchaToken?: string }
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const submitted = payload.data ?? {}

  // Honeypot: invisible and unfocusable, so a value means a bot. Answer 200 so the bot cannot
  // tell it was caught and retry differently.
  if (typeof submitted.website === 'string' && submitted.website.trim()) {
    return Response.json({ ok: true })
  }

  const form = await getForm(slug)
  if (!form) {
    return Response.json({ error: 'Unknown form.' }, { status: 404 })
  }

  // Validate against the CMS definition — the client's field list is not trusted. The rules are
  // the same module the browser runs (lib/forms.ts), so the two can never disagree.
  const declared = form.fields ?? []
  const { data: submissionData, errors: fieldErrors } = validateSubmission(declared, submitted)

  if (Object.keys(fieldErrors).length) {
    // `error` is the one-line summary the older card form shows; `fieldErrors` lets a form put
    // each message beside its own field.
    return Response.json(
      { error: summariseErrors(declared, fieldErrors), fieldErrors },
      { status: 400 },
    )
  }

  const score = await verifyRecaptcha(payload.recaptchaToken)
  if (score !== null && score < 0.5) {
    return Response.json({ error: 'We could not verify this submission.' }, { status: 400 })
  }

  const emailField = declared.find((f) => f.type === 'email')?.name

  const response = await fetch(`${CMS_URL}/api/leads`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // The CMS only accepts an anonymous lead that carries this, so the checks above cannot be
      // skipped by posting to it directly. Server-side only: it never reaches the browser.
      [FORM_SECRET_HEADER]: process.env.REVALIDATE_SECRET ?? '',
    },
    body: JSON.stringify({
      form: form.id,
      status: 'new',
      submittedEmail: emailField ? submissionData[emailField] : undefined,
      submissionData,
      source: { pathname: payload.pathname, referrer: request.headers.get('referer') ?? undefined },
      meta: {
        ipHash: hashIp(ip),
        userAgent: request.headers.get('user-agent')?.slice(0, 500),
        recaptchaScore: score ?? undefined,
      },
    }),
  })

  if (!response.ok) {
    console.error(`[forms] CMS rejected the lead: ${response.status}`)
    return Response.json({ error: 'We could not save your message. Please try again.' }, { status: 502 })
  }

  return Response.json({ ok: true })
}
