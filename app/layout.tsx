import type { Metadata, Viewport } from 'next'
import { draftMode } from 'next/headers'
import { Inter, Manrope } from 'next/font/google'

import { Analytics } from '@/components/analytics'
import { RevealObserver } from '@/components/motion/reveal-observer'
import { getSiteSettings } from '@/lib/cms/queries'
import { jsonLdScript, organisationJsonLd } from '@/lib/jsonld'

import './globals.css'

/*
 * Sanctioned deviation #1 (plan §6.3).
 *
 * The design loads these with a render-blocking <link> to fonts.googleapis.com:
 *   family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap
 *
 * next/font self-hosts the exact same faces and weights, removes the third-party request, and
 * generates a metric-compatible fallback so there is no layout shift on swap. The weights below
 * match the design exactly — adding one silently increases payload, so keep them in step.
 *
 * The CSS still says `font-family: 'Inter', sans-serif`; the variables are prepended in
 * styles/base.css so the self-hosted face wins while the original declaration stays intact.
 */
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-manrope',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: { default: 'Social DNA Labs', template: '%s — Social DNA Labs' },
  description:
    'Harness AI, technology and experience to move faster, build better and create measurable business impact.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, draft] = await Promise.all([getSiteSettings(), draftMode()])

  /*
   * No `data-scroll-behavior` attribute.
   *
   * Next 16 stopped overriding `scroll-behavior` during navigation unless that attribute is
   * present. The design never declares `scroll-behavior` at all (verified across all nine
   * files), so the browser default applies and the attribute would change behaviour rather
   * than preserve it. See plan §6.13.
   */
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body>
        <Analytics settings={settings} />

        <a className="sdl-skip-link" href="#main">
          Skip to content
        </a>

        {draft.isEnabled ? (
          <div className="sdl-preview-banner" role="status">
            <span>
              <strong>Preview.</strong> You are seeing unpublished content.
            </span>
            {/*
              A plain anchor, deliberately: /api/exit-preview is a Route Handler, not a page.
              next/link would client-navigate and prefetch it, so the handler that clears the
              draft cookie would never run and the banner would never go away.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/exit-preview">Exit preview</a>
          </div>
        ) : null}

        {children}

        {/* One observer for the whole page — see the component for why it has no dep array. */}
        <RevealObserver />

        <script
          type="application/ld+json"
          // Server-generated from site settings; no user input reaches this string.
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organisationJsonLd(settings)) }}
        />
      </body>
    </html>
  )
}
