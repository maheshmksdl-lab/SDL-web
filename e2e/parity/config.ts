/**
 * Shared configuration for the four-layer parity harness (plan §9.4).
 *
 * The design is served statically on PARITY_DESIGN_URL (`sdl-2.0` on :4001) and the
 * implementation on PARITY_TARGET_URL (`web` on :3000, seeded with `pnpm seed`).
 */

export const DESIGN_URL = (process.env.PARITY_DESIGN_URL || 'http://localhost:4001').replace(/\/$/, '')
export const TARGET_URL = (process.env.PARITY_TARGET_URL || 'http://localhost:3000').replace(/\/$/, '')

/** design file (served at DESIGN_URL/<file>) ⇄ implementation route (TARGET_URL/<route>). */
export const PAGES: { name: string; design: string; target: string }[] = [
  { name: 'home', design: '/index.html', target: '/' },
  { name: 'services', design: '/services.html', target: '/services' },
  { name: 'ai-transformation', design: '/ai-transformation.html', target: '/services/ai-transformation' },
  { name: 'digital-engineering', design: '/digital-engineering.html', target: '/services/digital-engineering' },
  { name: 'business-transformation', design: '/business-transformation.html', target: '/services/business-transformation' },
  { name: 'digital-experience', design: '/digital-experience.html', target: '/services/digital-experience' },
  { name: 'growth-transformation', design: '/growth-transformation.html', target: '/services/growth-transformation' },
  { name: 'web-application-engineering', design: '/web-application-engineering.html', target: '/services/digital-engineering/web-application-engineering' },
  { name: 'cloud-engineering', design: '/cloud-engineering.html', target: '/services/digital-engineering/cloud-engineering' },
  { name: 'mobile-engineering', design: '/mobile-engineering.html', target: '/services/digital-engineering/mobile-engineering' },
  { name: 'quality-engineering', design: '/quality-engineering.html', target: '/services/digital-engineering/quality-engineering' },
  { name: 'evoq', design: '/evoq.html', target: '/evoq' },
  { name: 'zoho-consulting-implementation', design: '/zoho-consulting-implementation.html', target: '/services/business-transformation/zoho-consulting-implementation' },
  { name: 'salesforce-implementation', design: '/salesforce-implementation.html', target: '/services/business-transformation/salesforce-implementation' },
]

export const VIEWPORTS = [1440, 1280, 1024, 768, 375]

/**
 * The computed-style property set compared per selector (Layer 1). `font-family` is compared as
 * the RESOLVED family name only — the `next/font` variable is a sanctioned deviation (§6.3).
 */
export const TRACKED_PROPERTIES = [
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color',
  'background-color', 'background-image', 'border-top-width', 'border-bottom-width',
  'border-left-width', 'border-right-width', 'border-style', 'border-color', 'border-radius',
  'box-shadow', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'width', 'height', 'max-width', 'aspect-ratio',
  'display', 'grid-template-columns', 'gap', 'flex-direction', 'align-items', 'justify-content',
  'position', 'top', 'right', 'bottom', 'left', 'z-index', 'opacity', 'transform', 'overflow',
]

/** Selectors compared on every page — the shared chrome. Per-page selectors are added at runtime. */
export const CHROME_SELECTORS = [
  '.sdl-header', '.sdl-header-inner', '.sdl-logo', '.sdl-nav', '.sdl-nav-link',
  '.sdl-cta', '.sdl-footer', '.sdl-footer-inner', '.sdl-footer-top', '.sdl-footer-cols',
  '.sdl-footer-col-title', '.sdl-footer-links', '.sdl-footer-bottom',
  '.sdl-section', '.sdl-section-inner', '.sdl-section-title', '.sdl-section-sub', '.sdl-kicker',
  '.sdl-hero', '.sdl-hero-copy', '.sdl-hero-sub', '.sdl-hero-actions', '.sdl-hero-primary',
  '.sdl-hero-secondary', '.sdl-cta-link', '.sdl-contact-section', '.sdl-form',
]

export const PIXEL_BUDGET = 0.005 // ≤ 0.5% differing pixels per viewport
export const PIXEL_THRESHOLD = 0.1 // per-pixel colour-distance threshold for pixelmatch

/** Regions excluded from the pixel diff — inherently non-deterministic (§9.4 Layer 2). */
export const PIXEL_MASK_SELECTORS = [
  '.sdl-hero-visual canvas', '.ai-orb', '.ai-particles', '.svc-hero-visual svg',
  '.bt-hero-visual', '.de-hero-visual', '.dx-hero-visual', '.gt-hero-visual',
]

export const SUBPIXEL_TOLERANCE = 0.5
