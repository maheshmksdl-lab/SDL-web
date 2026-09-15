import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next 16's rename of `middleware.ts`. Node runtime only — the edge runtime is not available in
 * `proxy` (plan §8.9), which is fine here: nothing below needs the edge.
 *
 * Two jobs:
 *   1. Maintenance mode — rewrite every page request to /maintenance when the flag is on.
 *   2. Security headers — a Content-Security-Policy and the standard hardening headers.
 *
 * The maintenance flag is read from the MAINTENANCE_MODE env var first (an instant, deploy-time
 * kill switch that needs no CMS round trip), then from Site Settings with a short in-memory
 * cache, so an editor toggling it in the panel also works — within ~60s.
 *
 * ── On the CSP ──
 * `script-src` keeps `'unsafe-inline'`. The design ships inline `<script>` blocks verbatim
 * (plan §6.3) and this app adds inline JSON-LD and the analytics loaders; a nonce-based policy
 * would need every one of those wired to a per-request nonce and is deferred until there is a
 * staging environment to verify it against (recorded in docs/DECISIONS.md). The policy still
 * removes `object-src`, pins `frame-ancestors`, `base-uri` and `form-action`, and allowlists
 * exactly the external hosts this site talks to.
 */

const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001').replace(/\/$/, '')
const isDev = process.env.NODE_ENV === 'development'

// Paths that must keep working while the site is in maintenance.
const MAINTENANCE_BYPASS = [
  '/maintenance',
  '/api/', // preview, revalidate, health, form submit
  '/_next/',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
]

type CachedFlag = { value: boolean; at: number }
let cache: CachedFlag | null = null
const TTL_MS = 60_000

async function maintenanceOn(): Promise<boolean> {
  if (process.env.MAINTENANCE_MODE === 'true') return true
  if (process.env.MAINTENANCE_MODE === 'false') return false

  if (cache && Date.now() - cache.at < TTL_MS) return cache.value

  try {
    const res = await fetch(
      `${CMS_URL}/api/globals/site-settings?depth=0&select[maintenanceMode]=true`,
      { signal: AbortSignal.timeout(2000) },
    )
    const value = res.ok ? Boolean((await res.json())?.maintenanceMode) : (cache?.value ?? false)
    cache = { value, at: Date.now() }
    return value
  } catch {
    // On a CMS blip, keep serving the site — a false maintenance screen for every visitor is
    // worse than a briefly-late toggle.
    return cache?.value ?? false
  }
}

const CSP = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' ${
    isDev ? "'unsafe-eval' " : ''
  }https://www.googletagmanager.com https://www.google-analytics.com https://snap.licdn.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${CMS_URL} https://images.pexels.com https://cdn.simpleicons.org https://www.google-analytics.com https://px.ads.linkedin.com`,
  `font-src 'self' data:`,
  `connect-src 'self' ${CMS_URL} https://www.google-analytics.com https://region1.google-analytics.com https://px.ads.linkedin.com`,
  `frame-ancestors 'self' ${CMS_URL}`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('Content-Security-Policy', CSP)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-DNS-Prefetch-Control', 'on')
  if (!isDev) {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  return res
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const bypass = MAINTENANCE_BYPASS.some((p) => pathname.startsWith(p))

  if (!bypass && (await maintenanceOn())) {
    const url = request.nextUrl.clone()
    url.pathname = '/maintenance'
    const res = NextResponse.rewrite(url, { status: 503 })
    res.headers.set('Retry-After', '3600')
    return applySecurityHeaders(res)
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)'],
}
