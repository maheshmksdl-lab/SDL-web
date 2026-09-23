import { draftMode } from 'next/headers'

import { query, type Paginated } from './query'
import { REVALIDATE_SECONDS } from './tags'

export { query, type Paginated }

/**
 * The one place the web app talks to the CMS.
 *
 * Adapted from the EFTMRA reference's lib/cms.ts, which gets the retry logic right, with two
 * deliberate changes:
 *
 *   1. Tag-based caching, so a publish invalidates exactly what changed (§6.6).
 *   2. A failed fetch THROWS by default. The reference swallows every error and returns a
 *      fallback, which means a CMS outage silently serves empty pages that look intentional
 *      and get cached. Callers that genuinely can degrade opt in with `fallback`.
 */

const CMS_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001')

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '')
  if (!trimmed) return 'http://localhost:3001'
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/**
 * Transient network faults worth one more attempt. A 4xx or 5xx is not one of these.
 *
 * ECONNREFUSED is deliberately NOT retriable, unlike in the EFTMRA reference. Refused means
 * nothing is listening on the port; that will not change within a 450ms backoff, so retrying
 * only multiplies the delay. Measured with the CMS stopped: a single 404 took **50 seconds**,
 * because every fetch on the page burned three attempts before giving up. Failing fast turns
 * that into a prompt error with the "start the CMS" guidance.
 */
function isRetriable(error: unknown): boolean {
  const cause = error instanceof Error ? error.cause : undefined
  const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined
  return code === 'ECONNRESET' || code === 'ETIMEDOUT'
}

/**
 * HTTP statuses worth trying again.
 *
 * A 5xx or a 429 says the CMS is briefly unwell, not that the request was wrong; a 4xx says the
 * document is not there and will not be there on a second ask.
 *
 * This distinction was missing and it took the production site down. The web build fetches every
 * page from the CMS, a deploy had just put the CMS through a cold start, and ONE request came
 * back 500:
 *
 *     Error occurred prerendering page "/services/ai-transformation" — CMS responded 500
 *     Export encountered an error on /[[...slug]]/page, exiting the build.
 *
 * The whole production build died and the live site silently kept serving the previous one, so
 * /insights 404'd while every check against the CMS passed. The retry loop below existed but
 * never covered this: the CmsError for a non-ok response is thrown inside the try and then
 * matched by `error instanceof CmsError`, which broke out on the first attempt.
 */
function isRetriableStatus(status?: number): boolean {
  return status !== undefined && (status >= 500 || status === 429)
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Backoff for a retriable status, in milliseconds.
 *
 * During a production build there is no user waiting, and the failure that actually kills builds
 * is Postgres connection starvation on the CMS — the pool is saturated for SECONDS, so the 300ms
 * and 600ms steps used at runtime are all spent before a slot could ever free up. Backing off for
 * ~1s, 3s then 7s outlasts a burst without meaningfully lengthening the build.
 *
 * At runtime the short steps stay: a visitor is waiting on this request, and the page has a
 * fallback. Same reasoning as ECONNREFUSED above — do not make someone wait for a retry that is
 * unlikely to help them.
 */
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'

function backoffFor(attempt: number): number {
  return isBuild ? [1_000, 3_000, 7_000][attempt - 1] ?? 7_000 : 300 * attempt
}

export class CmsError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly path?: string,
  ) {
    super(message)
    this.name = 'CmsError'
  }
}

/** True when nothing is listening — the CMS is not running, rather than misbehaving. */
function isConnectionRefused(error: unknown): boolean {
  const cause = error instanceof Error ? error.cause : undefined
  if (cause && typeof cause === 'object') {
    if ('code' in cause && cause.code === 'ECONNREFUSED') return true
    // Node wraps IPv4/IPv6 attempts in an AggregateError.
    if ('errors' in cause && Array.isArray(cause.errors)) {
      return cause.errors.some((e) => e && typeof e === 'object' && 'code' in e && e.code === 'ECONNREFUSED')
    }
  }
  return false
}

/*
 * Print actionable guidance instead of a stack trace per failed call.
 *
 * One page render makes several CMS calls, so without this the terminal fills with
 * near-identical AggregateError dumps and the one useful instruction is lost — which is exactly
 * how this failure presented in practice: ~40 stack lines, no mention of starting the CMS.
 *
 * The flag suppresses repeats within a module instance. Next evaluates the server and route
 * graphs separately, so this still prints two or three times per dev session rather than once.
 * That is an acceptable trade for not reaching into globalThis.
 */
let advisedCmsDown = false

function adviseCmsDown() {
  if (advisedCmsDown) return
  advisedCmsDown = true

  const lines = [
    `Nothing is listening at ${CMS_URL}`,
    '',
    'Start it in a second terminal:',
    '    cd cms && pnpm dev',
    '',
    'It needs your local PostgreSQL server running, at the',
    'DATABASE_URI in cms/.env.',
  ]

  /*
   * Self-sizing box. `inner` is the width between the two vertical rules, and all three border
   * rows are built from that single number — the earlier version computed each row separately
   * and the borders did not line up.
   */
  const title = '─ The CMS is not reachable '
  const inner = Math.max(title.length, ...lines.map((line) => line.length + 4)) + 2

  console.error(
    [
      '',
      `  ╭${title}${'─'.repeat(inner - title.length)}╮`,
      ...lines.map((line) => `  │  ${line.padEnd(inner - 2)}│`),
      `  ╰${'─'.repeat(inner)}╯`,
      '',
    ].join('\n'),
  )
}

type FetchOptions<T> = {
  /** Cache tags this request depends on. */
  tags?: string[]
  /** Returned instead of throwing. Only for data a page can render sensibly without. */
  fallback?: T
  /** Force draft mode off, e.g. for generateStaticParams at build time. */
  draft?: boolean
  revalidate?: number | false
}

/**
 * Draft mode is unavailable outside a request (generateStaticParams, sitemap), where calling
 * `draftMode()` throws. Treating that as "not a draft" is correct: build-time rendering is
 * always of published content.
 */
async function isDraftRequest(explicit?: boolean): Promise<boolean> {
  if (typeof explicit === 'boolean') return explicit
  try {
    return (await draftMode()).isEnabled
  } catch {
    return false
  }
}

export async function cmsFetch<T>(path: string, options: FetchOptions<T> = {}): Promise<T> {
  const { tags: cacheTags, fallback, revalidate } = options
  const isDraft = await isDraftRequest(options.draft)

  const url = new URL(`${CMS_URL}${path}`)
  if (isDraft) url.searchParams.set('draft', 'true')

  /*
   * Development never caches CMS reads.
   *
   * With caching on, a fetch made before a document existed is stored as an empty result and
   * — until the revalidation webhook invalidates it — served for the full hour. That produced
   * a genuinely confusing failure during Phase 4: the home page 404'd for an hour while the
   * CMS held a published document at that exact pathname, and the same request from plain Node
   * returned it. Editors and developers would hit this constantly.
   *
   * Production keeps the cache; the webhook is what makes it correct there.
   */
  const isDev = process.env.NODE_ENV === 'development'

  const init: RequestInit & { next?: { tags?: string[]; revalidate?: number | false } } = isDraft
    ? {
        // A draft must never be cached, and must be authenticated — published content is
        // public, drafts are not.
        cache: 'no-store',
        headers: process.env.CMS_API_KEY
          ? { Authorization: `users API-Key ${process.env.CMS_API_KEY}` }
          : {},
      }
    : isDev
      ? { cache: 'no-store' }
      : {
          next: {
            tags: cacheTags,
            revalidate: revalidate ?? REVALIDATE_SECONDS,
          },
        }

  // One extra attempt during a build: cheap there, and the difference between a deploy that
  // ships and one that dies on a single transient 500.
  const maxAttempts = isBuild ? 4 : 3
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(url, init)

      if (!res.ok) {
        const error = new CmsError(`CMS responded ${res.status}`, res.status, path)

        // Retried before any fallback is taken: a fallback hides a transient blip as missing
        // content, which is how a cold CMS turns into an empty page strip on the live site.
        if (isRetriableStatus(res.status) && attempt < maxAttempts) {
          lastError = error
          const wait = backoffFor(attempt)
          console.warn(
            `[cms] ${path} → ${res.status}, retrying in ${wait}ms (${attempt}/${maxAttempts - 1})`,
          )
          await delay(wait)
          continue
        }

        if (fallback !== undefined) {
          console.warn(`[cms] ${path} → ${res.status}, using fallback`)
          return fallback
        }
        throw error
      }

      return (await res.json()) as T
    } catch (error) {
      lastError = error
      if (error instanceof CmsError) break
      if (!isRetriable(error) || attempt === maxAttempts) break
      await delay(150 * attempt)
    }
  }

  const refused = isConnectionRefused(lastError)
  if (refused) adviseCmsDown()

  if (fallback !== undefined) {
    // One line for the common case; the full error only when it is something unexpected.
    if (refused) console.warn(`[cms] ${path} — CMS unreachable, using fallback`)
    else console.warn(`[cms] ${path} failed, using fallback:`, lastError)
    return fallback
  }

  if (lastError instanceof CmsError) throw lastError

  throw new CmsError(
    refused
      ? `The CMS is not running at ${CMS_URL}. Start it with "cd cms && pnpm dev".`
      : `CMS request failed: ${String(lastError)}`,
    undefined,
    path,
  )
}

