import Link from 'next/link'

import type { Header as HeaderGlobal } from '@/lib/payload-types'
import { anchorForPage, resolveLink, resolveMedia } from '@/lib/links'
import { getIcon } from '@/lib/registries/icons'
import { getForm } from '@/lib/cms/queries'

import { HeaderNav, type NavMenu } from './header-nav'

/** The form the header's CTA opens as a popup — see header-nav.tsx and lets-talk-modal.tsx. */
const LETS_TALK_FORM_SLUG = 'contact-us'

/**
 * The sticky header.
 *
 * Server component: it shapes the nav data and renders the static shell. Only the interactive
 * parts — the mega menu and the mobile panel — are a client island, which is why the whole
 * header does not ship as JavaScript.
 *
 * Markup mirrors index.html exactly, including the inline style on the logo link. That inline
 * style is in the design, so it is reproduced rather than moved into CSS: the parity harness
 * compares computed styles and DOM shape, and "tidying" it would show up as a difference.
 */
export async function SiteHeader({
  header,
  variant = 'default',
  pageAnchors = new Set(),
}: {
  header: HeaderGlobal
  /** From the page's `headerVariant` setting. `transparent` overlays a full-bleed hero. */
  variant?: 'default' | 'transparent'
  /** Section anchors the current page renders — see `anchorForPage`. */
  pageAnchors?: ReadonlySet<string>
}) {
  // Fetched here rather than passed in, so every one of the header's three call sites gets the
  // popup for free — the same reasoning `getHeader`/`getFooter` themselves are read where used,
  // not threaded through every route. `getForm` is not cache()-wrapped, but `cmsFetch` sits on
  // Next's own per-request fetch dedupe, so this costs nothing extra on the Contact Us page,
  // which reads the same record for its own (differently-styled) enquiry form.
  const letsTalkForm = await getForm(LETS_TALK_FORM_SLUG)

  const logo = resolveMedia(header.logo)
  const cta = resolveLink(header.cta)
  const href = (link: { href: string } | null) => (link ? anchorForPage(link.href, pageAnchors) : null)

  // Flatten the CMS shape into what the client island needs, resolving every link on the
  // server so the client bundle never carries link-resolution logic or the page relationships.
  const menus: NavMenu[] = (header.menuItems ?? []).map((item) => {
    const topLink = resolveLink(item.link)
    const menuCta = resolveLink(item.submenuCTA)

    return {
      key: item.key,
      label: item.label,
      href: href(topLink),
      items: (item.subItems ?? []).map((sub) => {
        const subLink = resolveLink(sub.link)
        return {
          title: sub.title,
          desc: sub.desc ?? '',
          href: href(subLink),
          icon: getIcon(sub.iconKey),
        }
      }),
      cta: menuCta ? { label: menuCta.label, href: href(menuCta)! } : null,
    }
  })

  return (
    <header
      className={`sdl-header${variant === 'transparent' ? ' sdl-header--transparent' : ''}`}
      id="sdlHeader"
    >
      <div className="sdl-header-inner">
        <div className="sdl-header-left">
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {logo ? (
              // Not next/image: the logo is an SVG, which the optimiser cannot improve and
              // would only rasterise. The design sizes it purely in CSS (.sdl-logo).
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.src} alt={header.logoAlt ?? logo.alt} className="sdl-logo" />
            ) : (
              <span className="sdl-logo" aria-label={header.logoAlt ?? 'Social DNA Labs'} />
            )}
          </Link>
        </div>

        <HeaderNav
          menus={menus}
          megaMenuEnabled={header.megaMenuEnabled !== false}
          cta={cta ? { label: cta.label, href: href(cta)! } : null}
          letsTalkForm={letsTalkForm}
        />
      </div>
    </header>
  )
}
