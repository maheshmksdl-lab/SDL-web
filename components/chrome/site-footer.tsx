import type { Footer as FooterGlobal } from '@/lib/payload-types'
import { anchorForPage, resolveLink, resolveMedia } from '@/lib/links'

/**
 * Footer. Fully server-rendered — nothing here is interactive.
 *
 * Replaces the `FOOTER_COLS` array the design repeats byte-identically on eight of nine pages.
 */

/** The design ships one social icon; the rest are here so adding a platform needs no new code. */
const SOCIAL_ICONS: Record<string, string> = {
  linkedin:
    '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21h-4z"/>',
  twitter:
    '<path d="M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5.2 22H2l7.7-8.8L1.7 2h6.8l4.7 6.2L18.9 2zm-1.1 18h1.8L7.3 3.9H5.4L17.8 20z"/>',
  youtube:
    '<path d="M23 12s0-3.9-.5-5.7a3 3 0 0 0-2.1-2.1C18.6 3.7 12 3.7 12 3.7s-6.6 0-8.4.5A3 3 0 0 0 1.5 6.3C1 8.1 1 12 1 12s0 3.9.5 5.7a3 3 0 0 0 2.1 2.1c1.8.5 8.4.5 8.4.5s6.6 0 8.4-.5a3 3 0 0 0 2.1-2.1c.5-1.8.5-5.7.5-5.7zM9.8 15.5v-7l6.2 3.5-6.2 3.5z"/>',
  instagram:
    '<path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4a3.8 3.8 0 0 1-1.4-.9 3.8 3.8 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.8-.1zm0 3.4a6.4 6.4 0 1 0 0 12.8 6.4 6.4 0 0 0 0-12.8zm0 10.6a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4zm8.2-10.9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>',
  facebook:
    '<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/>',
}

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X',
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
}

export function SiteFooter({
  footer,
  pageAnchors = new Set(),
}: {
  footer: FooterGlobal
  /** Section anchors the current page renders — see `anchorForPage`. */
  pageAnchors?: ReadonlySet<string>
}) {
  const logo = resolveMedia(footer.logo)

  // The design computes the year client-side. Doing it on the server avoids a hydration
  // mismatch and one more client boundary; the page revalidates well within a year.
  const copyright = (footer.copyrightText ?? '© {year} Social DNA Labs').replace(
    '{year}',
    String(new Date().getFullYear()),
  )

  return (
    <footer className="sdl-footer">
      <div className="sdl-footer-inner">
        <div className="sdl-footer-top">
          <div className="sdl-footer-brand">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.src} alt={footer.logoAlt ?? logo.alt} className="sdl-footer-logo" />
            ) : null}
            {footer.tagline ? <p className="sdl-footer-tagline">{footer.tagline}</p> : null}
          </div>

          <div className="sdl-footer-cols" id="footerCols">
            {(footer.columns ?? []).map((column, index) => (
              <div key={column.id ?? `${column.title}-${index}`}>
                <div className="sdl-footer-col-title">{column.title}</div>
                <ul className="sdl-footer-links">
                  {(column.links ?? []).map((entry, linkIndex) => {
                    const link = resolveLink(entry.link)
                    if (!link) return null
                    return (
                      <li key={entry.id ?? `${link.href}-${linkIndex}`}>
                        <a
                          href={anchorForPage(link.href, pageAnchors)}
                          {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                          {link.label}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="sdl-footer-bottom">
          <div id="footerYear">{copyright}</div>
          <div className="sdl-footer-bottom-right">
            {footer.bottomRightText ? <div>{footer.bottomRightText}</div> : null}
            {(footer.socialLinks ?? []).map((social, index) => {
              const icon = SOCIAL_ICONS[social.platform]
              if (!icon) return null
              return (
                <a
                  key={social.id ?? `${social.platform}-${index}`}
                  href={social.url}
                  className="sdl-footer-social-icon"
                  aria-label={PLATFORM_LABELS[social.platform] ?? social.platform}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: icon }}
                  />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
