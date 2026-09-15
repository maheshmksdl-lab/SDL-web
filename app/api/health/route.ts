/**
 * GET /api/health — liveness probe for the public site, plus a check that the CMS is reachable.
 *
 * `dependencies.cms` is informational: the site serves cached content fine during a brief CMS
 * outage, so a red `cms` does not make the site "down". Monitors alert on the top-level `status`
 * and treat `cms: "error"` as a warning.
 */
export const dynamic = 'force-dynamic'

const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001').replace(/\/$/, '')

export async function GET() {
  let cms: 'ok' | 'error' = 'error'
  try {
    const res = await fetch(`${CMS_URL}/api/health`, { signal: AbortSignal.timeout(3000), cache: 'no-store' })
    cms = res.ok ? 'ok' : 'error'
  } catch {
    cms = 'error'
  }

  return Response.json(
    { status: 'ok', dependencies: { cms }, at: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
