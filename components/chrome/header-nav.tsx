'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

export type NavMenuItem = {
  title: string
  desc: string
  href: string | null
  icon: string
}

export type NavMenu = {
  key: string
  label: string
  href: string | null
  items: NavMenuItem[]
  cta: { label: string; href: string } | null
}

/**
 * Desktop nav, mega menu and mobile panel.
 *
 * One of the nine client islands. Reproduces the design's behaviour exactly — including the
 * mega panel's measured horizontal clamping — and adds the keyboard support the design lacks.
 *
 * The design opens the panel on `mouseenter` only, with no focus handling, no aria-expanded and
 * no Escape. That makes the entire primary navigation unreachable by keyboard. The additions
 * below are behavioural only: no visual rule changes, so parity Layers 1–3 are unaffected and
 * Layer 4 gains focus states that the design has no baseline for. See plan §6.11.
 */
export function HeaderNav({
  menus,
  megaMenuEnabled,
  cta,
}: {
  menus: NavMenu[]
  megaMenuEnabled: boolean
  cta: ({ label: string; href: string } & Record<string, unknown>) | null
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSubKey, setMobileSubKey] = useState<string | null>(null)
  const [panelLeft, setPanelLeft] = useState<number | null>(null)

  const headerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const openMenu = menus.find((m) => m.key === openKey) ?? null

  /**
   * Positions the panel under its trigger, clamped inside the header.
   *
   * Ported from the design's `renderMegaMenu`: centre on the trigger, then clamp to a 24px
   * gutter so a right-hand menu never overflows the viewport.
   */
  const positionPanel = useCallback((key: string) => {
    const header = headerRef.current?.closest('.sdl-header') as HTMLElement | null
    const item = itemRefs.current[key]
    const panel = panelRef.current
    if (!header || !item || !panel) return

    const headerRect = header.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const panelWidth = panel.offsetWidth

    const itemCentre = itemRect.left - headerRect.left + itemRect.width / 2
    let left = itemCentre - panelWidth / 2
    const maxLeft = Math.max(24, header.offsetWidth - panelWidth - 24)
    left = Math.max(24, Math.min(left, maxLeft))

    setPanelLeft(left)
  }, [])

  // Measure after the panel has rendered at its natural width.
  useEffect(() => {
    if (openKey) positionPanel(openKey)
  }, [openKey, positionPanel])

  useEffect(() => {
    if (!openKey) return
    const onResize = () => positionPanel(openKey)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [openKey, positionPanel])

  // Escape closes and returns focus to the trigger — without this, keyboard users who open a
  // panel have no way out of it.
  useEffect(() => {
    if (!openKey) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const trigger = itemRefs.current[openKey]?.querySelector('button')
      setOpenKey(null)
      ;(trigger as HTMLButtonElement | null)?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openKey])

  const hasDropdown = (menu: NavMenu) => megaMenuEnabled && menu.items.length > 0

  return (
    <>
      <div className="sdl-header-nav-wrap" ref={headerRef}>
        <nav className="sdl-desktop-nav" id="desktopNav" aria-label="Main">
          {menus.map((menu) => {
            const dropdown = hasDropdown(menu)
            const isOpen = openKey === menu.key

            return (
              <div
                key={menu.key}
                className="sdl-nav-item"
                ref={(el) => {
                  itemRefs.current[menu.key] = el
                }}
                onMouseEnter={() => dropdown && setOpenKey(menu.key)}
              >
                {dropdown ? (
                  <button
                    type="button"
                    className={`sdl-nav-btn${isOpen ? ' active' : ''}`}
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? panelId : undefined}
                    aria-haspopup="true"
                    onClick={() => setOpenKey(isOpen ? null : menu.key)}
                    onFocus={() => setOpenKey(menu.key)}
                  >
                    {menu.label} <span className="caret">▾</span>
                  </button>
                ) : (
                  <a className="sdl-nav-btn" href={menu.href ?? '#'}>
                    {menu.label}
                  </a>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      <div className="sdl-header-right">
        {cta ? (
          <a href={cta.href} className="sdl-cta sdl-desktop-cta">
            {cta.label} →
          </a>
        ) : null}

        <button
          type="button"
          className="sdl-mobile-toggle"
          id="mobileToggle"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
            <rect width="22" height="2" fill="#162833" />
            <rect y="7" width="22" height="2" fill="#162833" />
            <rect y="14" width="22" height="2" fill="#162833" />
          </svg>
        </button>
      </div>

      {/* Mega panel. `mouseleave` on the header closes it, matching the design. */}
      <div
        id={panelId}
        ref={panelRef}
        className={`sdl-mega-panel${openMenu ? ' open' : ''}`}
        style={panelLeft !== null ? { left: panelLeft } : undefined}
        onMouseLeave={() => setOpenKey(null)}
      >
        {openMenu ? (
          <div
            className="sdl-mega-panel-inner"
            style={openMenu.items.length < 2 ? { gridTemplateColumns: '1fr' } : undefined}
          >
            {openMenu.items.map((item) => {
              const content = (
                <div className="sdl-mega-item">
                  <div className="sdl-mega-item-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 48 48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: item.icon }}
                    />
                  </div>
                  <div>
                    <div className="sdl-mega-item-title">{item.title}</div>
                    <div className="sdl-mega-item-desc">{item.desc}</div>
                  </div>
                </div>
              )

              return item.href ? (
                <a
                  key={item.title}
                  href={item.href}
                  style={{ display: 'contents', cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}
                >
                  {content}
                </a>
              ) : (
                <div key={item.title}>{content}</div>
              )
            })}

            {openMenu.cta ? (
              <div className="sdl-mega-cta">
                <a href={openMenu.cta.href}>{openMenu.cta.label} →</a>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Mobile panel — an accordion keyed by menu.key, as the design does. */}
      <div className={`sdl-mobile-panel${mobileOpen ? ' open' : ''}`}>
        {menus.map((menu) => (
          <div key={menu.key} className="sdl-mobile-item">
            {menu.items.length === 0 && menu.href ? (
              <a className="sdl-mobile-item-btn" href={menu.href} style={{ display: 'block', cursor: 'pointer' }}>
                {menu.label}
              </a>
            ) : (
              <>
                <button
                  type="button"
                  className="sdl-mobile-item-btn"
                  aria-expanded={mobileSubKey === menu.key}
                  onClick={() => setMobileSubKey((key) => (key === menu.key ? null : menu.key))}
                >
                  {menu.label} <span className="caret">▾</span>
                </button>
                <div className={`sdl-mobile-sub${mobileSubKey === menu.key ? ' open' : ''}`}>
                  {menu.items.map((item) => (
                    <div key={item.title}>
                      <div className="sdl-mobile-sub-title">{item.title}</div>
                      <div className="sdl-mobile-sub-desc">{item.desc}</div>
                    </div>
                  ))}
                  {menu.cta ? <a href={menu.cta.href}>{menu.cta.label} →</a> : null}
                </div>
              </>
            )}
          </div>
        ))}

        {cta ? (
          <a href={cta.href} className="sdl-mobile-cta">
            {cta.label} →
          </a>
        ) : null}
      </div>
    </>
  )
}
