/**
 * Payload REST query-string builder.
 *
 * Kept separate from client.ts (the fetcher) so it can be unit-tested without pulling in
 * `next/headers`, and because building a URL and performing a request are genuinely different
 * concerns.
 *
 * `select` is used on every list query to keep payloads small — a page listing does not need
 * each document's entire block layout, and at depth 2 that difference is large.
 */

/** Payload's list response. */
export type Paginated<T> = {
  docs: T[]
  totalDocs: number
  page: number
  totalPages: number
  hasNextPage: boolean
}

export function query(params: {
  where?: Record<string, unknown>
  select?: string[]
  sort?: string
  limit?: number
  depth?: number
  page?: number
}): string {
  const search = new URLSearchParams()

  if (params.where) {
    const walk = (obj: Record<string, unknown>, prefix: string) => {
      for (const [key, value] of Object.entries(obj)) {
        const next = prefix ? `${prefix}[${key}]` : key
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          walk(value as Record<string, unknown>, next)
        } else if (Array.isArray(value)) {
          value.forEach((v, i) => search.set(`${next}[${i}]`, String(v)))
        } else {
          search.set(next, String(value))
        }
      }
    }
    walk(params.where, 'where')
  }

  params.select?.forEach((field) => search.set(`select[${field}]`, 'true'))
  if (params.sort) search.set('sort', params.sort)
  if (params.limit !== undefined) search.set('limit', String(params.limit))
  if (params.depth !== undefined) search.set('depth', String(params.depth))
  if (params.page !== undefined) search.set('page', String(params.page))

  const qs = search.toString()
  return qs ? `?${qs}` : ''
}
