'use client'

import { useEffect } from 'react'

/**
 * Route error boundary.
 *
 * Reached when a page fetch throws — which is deliberate: lib/cms/client.ts throws rather than
 * returning an empty page, so a CMS outage surfaces here instead of silently caching a blank
 * page that looks intentional.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[route error]', error)
  }, [error])

  return (
    <main id="main" className="sdl-page">
      <section className="sdl-section sdl-section--white">
        <div className="sdl-section-inner" style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="sdl-kicker" style={{ justifyContent: 'center' }}>Something went wrong</div>
          <h1 className="sdl-section-title" style={{ marginTop: 18 }}>
            This page didn&rsquo;t load.
          </h1>
          <p className="sdl-section-sub" style={{ margin: '16px auto 0', maxWidth: 520 }}>
            The problem has been logged. Trying again often works.
          </p>
          <div style={{ marginTop: 32 }}>
            <button type="button" className="sdl-hero-primary" onClick={reset}>
              Try again
            </button>
          </div>
          {error.digest ? (
            <p style={{ marginTop: 24, fontSize: 12, color: '#8891A0' }}>Reference: {error.digest}</p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
