import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const isDev = process.env.NODE_ENV === 'development'
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const cmsUrl = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001'
const cmsHost = (() => {
  try {
    return new URL(cmsUrl).hostname
  } catch {
    return 'localhost'
  }
})()

/**
 * Redirects from the CMS `redirects` collection, resolved at build time.
 *
 * A runtime lookup in app/[[...slug]]/page.tsx catches entries added after the build (plan §6.9);
 * this pulls the known set into the edge redirect table so they cost nothing at request time.
 *
 * Skipped entirely in development: `next.config.ts` is re-evaluated on every dev restart, and a
 * CMS round trip there (with a retry timeout when the CMS is down) is pure friction — the runtime
 * lookup covers dev completely. Degrades to an empty list if the CMS is unreachable at build too.
 */
async function cmsRedirects(): Promise<{ source: string; destination: string; permanent: boolean }[]> {
  if (isDev) return []
  try {
    const res = await fetch(`${cmsUrl.replace(/\/$/, '')}/api/redirects?limit=1000&depth=0`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const body = (await res.json()) as {
      docs?: { from?: string; to?: string; type?: string }[]
    }
    return (body.docs ?? [])
      .filter((d): d is { from: string; to: string; type?: string } => Boolean(d.from && d.to))
      .map((d) => ({
        source: d.from,
        destination: d.to,
        permanent: d.type !== '302',
      }))
  } catch {
    console.warn('[next.config] could not load redirects from the CMS — using the runtime fallback only')
    return []
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Turbopack is the default bundler in Next 16 for dev and build. Options live at the top
  // level, not under `experimental`. This app has no Payload dependency, so it uses Turbopack
  // unconditionally — the CMS bundler question (plan §3.1c) does not apply here.
  //
  // `root` is pinned because the repo carries both a pnpm-lock.yaml (authoritative) and, in
  // some environments, a stray package-lock.json; without this Next guesses the workspace root
  // and warns.
  turbopack: { root: projectRoot },

  /*
   * cacheComponents is deliberately NOT enabled. Tag-based ISR already meets every requirement:
   * this is a marketing site whose content changes on publish, not per request. See plan §6.6.
   *
   * reactCompiler is also off. Nine small client islands give it almost nothing to memoise, and
   * it relies on Babel, which slows dev and build. See plan §6.12.
   */

  images: {
    // remotePatterns, never the deprecated images.domains.
    remotePatterns: [
      {
        protocol: isDev ? 'http' : 'https',
        hostname: cmsHost,
        ...(isDev ? { port: '3001' } : {}),
      },
    ],

    /*
     * Next 16 default is [75] ONLY. A `quality` prop outside this list is silently coerced to
     * the nearest allowed value rather than erroring — so either keep every call at the default
     * or list the qualities actually used here.
     */
    qualities: [75],

    /*
     * Next 16 raised the default from 60s to 4h. Keeping the new default is correct here:
     * Payload writes a NEW filename on re-upload, so a long TTL can never serve stale bytes
     * for changed media.
     */
    // minimumCacheTTL: 14400,

    /*
     * Next 16 blocks optimisation of local IPs by default as an SSRF guard. That breaks
     * development against http://localhost:3001, so it is enabled in DEVELOPMENT ONLY.
     * Never set this in production.
     */
    ...(isDev ? { dangerouslyAllowLocalIP: true } : {}),
  },

  async redirects() {
    return cmsRedirects()
  },

  async headers() {
    /*
     * The full Content-Security-Policy — including frame-ancestors, which is what lets Payload's
     * live preview iframe this site from :3001 — is set in proxy.ts, so it also covers the
     * maintenance rewrite. These are the headers that apply to every response including static
     * assets (proxy's matcher excludes _next/static), kept here as defence in depth.
     */
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

/*
 * `pnpm analyze` (ANALYZE=true next build) opens the treemap. Off by default — the plugin is a
 * no-op unless ANALYZE is set, so it costs nothing in a normal build. See plan §6.12 / Phase 10.
 */
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

export default withBundleAnalyzer(nextConfig)
