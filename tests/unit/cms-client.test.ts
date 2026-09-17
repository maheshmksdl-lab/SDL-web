import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Retry behaviour of the CMS fetcher.
 *
 * These exist because the missing case took the live site down. The web build fetches every page
 * from the CMS; a deploy had just cold-started it, one request came back 500, and the whole
 * production build exited — leaving the previous build serving, so a newly added route 404'd in
 * production while every direct check against the CMS passed.
 *
 * The retry loop was already there. It just never covered an HTTP error, because the CmsError
 * for a non-ok response is thrown inside the try and was matched by `instanceof CmsError`, which
 * broke out on the first attempt.
 */

vi.mock('next/headers', () => ({
  draftMode: async () => ({ isEnabled: false }),
}))

const okJson = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response

const status = (code: number) =>
  ({ ok: false, status: code, json: async () => ({}) }) as unknown as Response

async function loadFetcher() {
  vi.resetModules()
  return (await import('../../lib/cms/client')).cmsFetch
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('cmsFetch retries', () => {
  it('retries a 500 and returns the eventual success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(status(500))
      .mockResolvedValueOnce(okJson({ docs: ['recovered'] }))
    vi.stubGlobal('fetch', fetchMock)

    const cmsFetch = await loadFetcher()
    await expect(cmsFetch('/api/pages')).resolves.toEqual({ docs: ['recovered'] })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retries a 429 as well', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(status(429))
      .mockResolvedValueOnce(okJson({ docs: [] }))
    vi.stubGlobal('fetch', fetchMock)

    const cmsFetch = await loadFetcher()
    await expect(cmsFetch('/api/pages')).resolves.toEqual({ docs: [] })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does NOT retry a 404 — the document is absent, not the CMS unwell', async () => {
    const fetchMock = vi.fn().mockResolvedValue(status(404))
    vi.stubGlobal('fetch', fetchMock)

    const cmsFetch = await loadFetcher()
    await expect(cmsFetch('/api/pages')).rejects.toThrow('CMS responded 404')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws after exhausting retries when no fallback is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(status(500))
    vi.stubGlobal('fetch', fetchMock)

    const cmsFetch = await loadFetcher()
    await expect(cmsFetch('/api/pages')).rejects.toThrow('CMS responded 500')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('prefers a retry over the fallback, so a blip is not cached as missing content', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(status(503))
      .mockResolvedValueOnce(okJson({ docs: ['real'] }))
    vi.stubGlobal('fetch', fetchMock)

    const cmsFetch = await loadFetcher()
    await expect(cmsFetch('/api/pages', { fallback: { docs: [] } })).resolves.toEqual({
      docs: ['real'],
    })
  })

  it('falls back only once the retries are spent', async () => {
    const fetchMock = vi.fn().mockResolvedValue(status(500))
    vi.stubGlobal('fetch', fetchMock)

    const cmsFetch = await loadFetcher()
    await expect(cmsFetch('/api/pages', { fallback: { docs: [] } })).resolves.toEqual({ docs: [] })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
