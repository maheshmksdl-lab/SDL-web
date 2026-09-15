import { revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'

/**
 * Invalidation webhook, called by the CMS on publish, update and delete.
 *
 * Next 16: revalidateTag takes a cacheLife profile as its SECOND argument. The single-argument
 * form is deprecated and is a TypeScript error. 'max' expires the entry now and serves
 * stale-while-revalidate, which is right for a marketing site — a reader may briefly see the
 * previous version rather than waiting on a regeneration.
 *
 * `updateTag` would give read-your-writes, but it is Server-Action-only and cannot be called
 * from a route handler, so it is not an option here. See plan §8.7.
 */

function authorised(request: Request): boolean {
  const provided = request.headers.get('x-revalidate-secret')
  const expected = process.env.REVALIDATE_SECRET
  if (!provided || !expected) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  let tags: unknown
  try {
    ;({ tags } = await request.json())
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string')) {
    return Response.json({ error: 'tags must be an array of strings' }, { status: 400 })
  }

  for (const tag of tags as string[]) {
    revalidateTag(tag, 'max')
  }

  console.info(`[revalidate] ${tags.length} tag(s):`, tags.join(', '))
  return Response.json({ revalidated: tags, at: Date.now() })
}
