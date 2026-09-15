import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { timingSafeEqual } from 'node:crypto'

/**
 * Enables draft mode, then redirects to the page.
 *
 * Payload's live preview loads this in an iframe; the "Preview" button opens it in a tab.
 * Both pass the shared secret, which is why this route must be careful about two things:
 * comparing the secret without leaking timing, and refusing to redirect anywhere but a path
 * on this site.
 */

function secretsMatch(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  // timingSafeEqual throws on a length mismatch, which would itself leak length.
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  if (!secretsMatch(searchParams.get('secret'), process.env.PREVIEW_SECRET)) {
    return new Response('Invalid preview token', { status: 401 })
  }

  const path = searchParams.get('path') || '/'

  /*
   * Only a same-site absolute path. Without this the secret becomes an open-redirect gadget:
   * anyone holding it could send a visitor anywhere while the URL still reads as our domain.
   */
  if (!path.startsWith('/') || path.startsWith('//')) {
    return new Response('Invalid preview path', { status: 400 })
  }

  ;(await draftMode()).enable()
  redirect(path)
}
