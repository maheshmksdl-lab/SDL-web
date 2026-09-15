import type { Metadata } from 'next'

import { getSiteSettings } from '@/lib/cms/queries'

/**
 * Shown when maintenance mode is on. proxy.ts rewrites every page request here with a 503, so
 * search engines see "temporarily unavailable" rather than indexing a stub.
 */

export const metadata: Metadata = {
  title: 'We’ll be right back',
  robots: { index: false, follow: false },
}

export default async function MaintenancePage() {
  const settings = await getSiteSettings()
  const message =
    settings.maintenanceMessage ||
    'We are currently performing scheduled maintenance. We will be back shortly.'

  return (
    <main id="main" className="sdl-page">
      <section className="sdl-section sdl-section--white">
        <div className="sdl-section-inner" style={{ textAlign: 'center', padding: '96px 0' }}>
          <div className="sdl-kicker" style={{ justifyContent: 'center' }}>
            {settings.siteName || 'Social DNA Labs'}
          </div>
          <h1 className="sdl-section-title" style={{ marginTop: 18 }}>
            We’ll be right back.
          </h1>
          <p className="sdl-section-sub" style={{ margin: '16px auto 0', maxWidth: 520 }}>
            {message}
          </p>
        </div>
      </section>
    </main>
  )
}
