import { HeroCanvas } from './hero-canvas'
import { ParticleField } from './particle-field'
import { ServicesDna } from './services-dna'

/**
 * Dispatches to the hero visual a page's `visualKey` names.
 *
 * Eight of the nine ship NO JavaScript:
 *
 *   - six are markup with CSS animation (orb, arc, hex, cursor, arrow, and their particle field)
 *   - `services-dna` looks like it needs JS because the design builds it with createElementNS,
 *     but the generator is fully deterministic — fixed geometry, a seeded LCG for the dust — so
 *     it renders on the server as static SVG instead.
 *
 * Only `home-canvas` genuinely needs a client island: it animates continuously on a <canvas>.
 *
 * It is imported directly rather than through `next/dynamic`. Two reasons: `ssr: false` is not
 * allowed with next/dynamic inside a Server Component in the App Router, and direct import is
 * the better outcome anyway — the `<canvas>` element lands in the server-rendered HTML exactly
 * as it does in the design, so the DOM the parity harness compares matches and the slot has its
 * dimensions from the first paint. Only the drawing code is a client chunk.
 */

/** The check glyph in each completed stage of quality engineering's release pipeline. */
const QE_CHECK = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12l5 5L20 6" />
  </svg>
)

/** The small framed photo the sub-service heroes pin to their visual. Decorative stock imagery. */
function PhotoCard({ prefix, src, alt, tag }: { prefix: string; src: string; alt: string; tag: string }) {
  return (
    <div className={`${prefix}-hero-photo-card`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative stock photo, as the design */}
      <img src={src} alt={alt} loading="lazy" />
      <span className={`${prefix}-hero-photo-card-tag`}>{tag}</span>
    </div>
  )
}

export function HeroVisual({
  visualKey,
  image = null,
}: {
  visualKey: string
  /** The uploaded artwork for visuals that display one (EVOQ, Zoho, Salesforce). */
  image?: { src: string } | null
}) {
  switch (visualKey) {
    case 'home-canvas':
      return (
        <div className="sdl-hero-visual">
          <HeroCanvas />
        </div>
      )

    case 'services-dna':
      return (
        <div className="svc-hero-visual">
          <ServicesDna />
        </div>
      )

    case 'ai-orb':
      return (
        <div className="ai-hero-visual">
          <div className="ai-orb">
            <svg className="ai-orb-grain" viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <filter id="aiGrain" x="0%" y="0%" width="100%" height="100%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.85"
                    numOctaves="2"
                    stitchTiles="stitch"
                    result="noise"
                  />
                  <feColorMatrix
                    in="noise"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.85 0"
                  />
                </filter>
              </defs>
              <circle cx="100" cy="100" r="100" fill="#000000" filter="url(#aiGrain)" />
            </svg>
          </div>
          <ParticleField prefix="ai" />
        </div>
      )

    case 'bt-arc':
      return (
        <div className="bt-hero-visual" aria-hidden="true">
          <div className="bt-arc-glow" />
          <div className="bt-arc">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="btArcGrad" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#FFF6DE" />
                  <stop offset="35%" stopColor="#FFE38A" />
                  <stop offset="100%" stopColor="#F4C430" />
                </linearGradient>
              </defs>
              <path
                d="M74 28A34 34 0 1 1 28 24"
                fill="none"
                stroke="url(#btArcGrad)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path d="M18 10 L30 24 L14 30 Z" fill="url(#btArcGrad)" />
            </svg>
          </div>
          <ParticleField prefix="bt" />
        </div>
      )

    case 'de-hex':
      return (
        <div className="de-hero-visual" aria-hidden="true">
          <div className="de-hex-glow" />
          <div className="de-hex">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="deHexGrad" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#EAF7FF" />
                  <stop offset="35%" stopColor="#8FD6FF" />
                  <stop offset="100%" stopColor="#2B8FDB" />
                </linearGradient>
                <clipPath id="deHexClip" clipPathUnits="userSpaceOnUse">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M50 4L84 25L84 75L50 96L16 75L16 25Z M50 30A20 20 0 1 0 50.01 30Z"
                  />
                </clipPath>
                <filter id="deHexGrain" x="0%" y="0%" width="100%" height="100%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.85"
                    numOctaves="2"
                    stitchTiles="stitch"
                    result="noise"
                  />
                  <feColorMatrix
                    in="noise"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0"
                  />
                </filter>
              </defs>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                fill="url(#deHexGrad)"
                d="M50 4L84 25L84 75L50 96L16 75L16 25Z M50 30A20 20 0 1 0 50.01 30Z"
              />
              <g clipPath="url(#deHexClip)">
                <rect
                  width="100"
                  height="100"
                  fill="#000000"
                  filter="url(#deHexGrain)"
                  opacity="0.55"
                  style={{ mixBlendMode: 'overlay' }}
                />
              </g>
            </svg>
          </div>
          <ParticleField prefix="de" />
        </div>
      )

    case 'dx-cursor':
      return (
        <div className="dx-hero-visual" aria-hidden="true">
          <div className="dx-cursor-glow" />
          <div className="dx-cursor">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="dxCursorGrad" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#EAFBF1" />
                  <stop offset="35%" stopColor="#6FDBA0" />
                  <stop offset="100%" stopColor="#28C76F" />
                </linearGradient>
                <clipPath id="dxCursorClip" clipPathUnits="userSpaceOnUse">
                  <path d="M22 8 L22 84 L41 67 L53 92 L66 86 L54 61 L78 61 Z" />
                </clipPath>
                <filter id="dxCursorGrain" x="0%" y="0%" width="100%" height="100%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.85"
                    numOctaves="2"
                    stitchTiles="stitch"
                    result="noise"
                  />
                  <feColorMatrix
                    in="noise"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0"
                  />
                </filter>
              </defs>
              <path
                fill="url(#dxCursorGrad)"
                d="M22 8 L22 84 L41 67 L53 92 L66 86 L54 61 L78 61 Z"
              />
              <g clipPath="url(#dxCursorClip)">
                <rect
                  width="100"
                  height="100"
                  fill="#000000"
                  filter="url(#dxCursorGrain)"
                  opacity="0.5"
                  style={{ mixBlendMode: 'overlay' }}
                />
              </g>
            </svg>
          </div>
          <ParticleField prefix="dx" />
        </div>
      )

    case 'gt-chart':
      return (
        <div className="gt-hero-visual" aria-hidden="true">
          <div className="gt-arrow-glow" />
          <div className="gt-arrow">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gtArrowGrad" x1="10%" y1="90%" x2="90%" y2="10%">
                  <stop offset="0%" stopColor="#EEF1FF" />
                  <stop offset="35%" stopColor="#A9BBFF" />
                  <stop offset="100%" stopColor="#3E5FE0" />
                </linearGradient>
              </defs>
              <path
                d="M18 82 L82 18"
                stroke="url(#gtArrowGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M46 18 L82 18 L82 54"
                stroke="url(#gtArrowGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <ParticleField prefix="gt" />
        </div>
      )

    case 'wae-windows':
      return (
        <div className="wae-hero-visual" aria-hidden="true">
          <div className="wae-hero-grid" />
          <div className="wae-hero-glow" />

          <div className="wae-hero-window wae-hero-window--back" />

          <div className="wae-hero-window wae-hero-window--main">
            <div className="wae-hero-window-bar">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="wae-hero-url" />
            </div>
            <div className="wae-hero-window-body">
              <div className="wae-hero-window-side">
                <span className="wae-hero-side-item active" />
                <span className="wae-hero-side-item" />
                <span className="wae-hero-side-item" />
                <span className="wae-hero-side-item" />
              </div>
              <div className="wae-hero-window-main-col">
                <div className="wae-hero-window-head">
                  <span className="wae-hero-window-head-title">Overview</span>
                  <span className="wae-hero-window-head-dot" />
                </div>
                <div className="wae-hero-hero-block">
                  <span className="wae-hero-hero-block-label">Monthly revenue</span>
                  <span className="wae-hero-hero-block-value">$128,400</span>
                  <span className="wae-hero-hero-block-delta">▲ 12%</span>
                </div>
                <div className="wae-hero-row">
                  <div className="wae-hero-card">
                    <div className="wae-hero-card-value">1,204</div>
                    <div className="wae-hero-card-label">Active users</div>
                  </div>
                  <div className="wae-hero-card">
                    <div className="wae-hero-card-value">99.9%</div>
                    <div className="wae-hero-card-label">Uptime</div>
                  </div>
                </div>
                <div className="wae-hero-chart-wrap">
                  <div className="wae-hero-chart">
                    <span style={{ height: '38%' }} />
                    <span style={{ height: '68%' }} />
                    <span style={{ height: '52%' }} />
                    <span style={{ height: '84%' }} />
                    <span style={{ height: '60%' }} />
                  </div>
                  <div className="wae-hero-chart-caption">Weekly traffic</div>
                </div>
              </div>
            </div>
          </div>

          <div className="wae-hero-float wae-hero-float--api">
            <span className="wae-hero-float-icon">{'</>'}</span>
            <div>
              <div className="wae-hero-float-title">API connected</div>
              <div className="wae-hero-float-sub">12 endpoints live</div>
            </div>
          </div>
          <div className="wae-hero-float wae-hero-float--live">
            <span className="wae-hero-float-icon">
              <span className="dot-pulse" />
            </span>
            <div>
              <div className="wae-hero-float-title">Live</div>
              <div className="wae-hero-float-sub">Deployed 2 min ago</div>
            </div>
          </div>

          <div className="wae-hero-photo-card">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative stock photo, not CMS media */}
            <img
              src="https://images.pexels.com/photos/12902862/pexels-photo-12902862.jpeg?cs=tinysrgb&w=220&h=270&fit=crop"
              alt="Developer building a web application on a laptop"
              loading="lazy"
            />
            <span className="wae-hero-photo-card-tag">Engineering in the browser</span>
          </div>
        </div>
      )

    case 'evoq-suite':
      // One composed artwork (the team at a laptop, with the live-activity callouts baked in),
      // supplied as the hero's visual image. The container's aspect ratio sizes it.
      return (
        <div className="evoq-hero-visual" aria-hidden="true">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- composed artwork sized by its container, as the design
            <img className="evoq-hero-image" src={image.src} alt="" />
          ) : null}
        </div>
      )

    case 'ce-cloud':
      return (
        <div className="ce-hero-visual" aria-hidden="true">
          <div className="ce-hero-grid" />
          <div className="ce-hero-glow" />
          <div className="ce-hero-cloud">
            <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ceCloudGrad" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#EAF7FF" />
                  <stop offset="45%" stopColor="#8FD6FF" />
                  <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
              </defs>
              <path
                fill="url(#ceCloudGrad)"
                d="M40,90 C20,90 10,75 10,60 C10,45 25,35 40,38 C42,20 60,8 80,8 C100,8 115,20 118,35 C135,32 150,45 150,60 C150,78 135,90 118,90 Z"
              />
            </svg>
          </div>
          <div className="ce-hero-nodes">
            {[false, true, false, false, false, false].map((active, i) => (
              <div className={`ce-hero-node${active ? ' is-active' : ''}`} key={i}>
                <span />
              </div>
            ))}
          </div>
          <div className="ce-hero-float ce-hero-float--scale">
            <span className="ce-hero-float-icon">📈</span>
            <div>
              <div className="ce-hero-float-title">Auto-scaling</div>
              <div className="ce-hero-float-sub">+3 nodes added</div>
            </div>
          </div>
          <div className="ce-hero-float ce-hero-float--uptime">
            <span className="ce-hero-float-icon">✓</span>
            <div>
              <div className="ce-hero-float-title">99.99% uptime</div>
              <div className="ce-hero-float-sub">Last 90 days</div>
            </div>
          </div>
          <PhotoCard
            prefix="ce"
            src="https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?cs=tinysrgb&w=220&h=270&fit=crop"
            alt="Engineer reviewing infrastructure in a data center"
            tag="Infrastructure, modernized"
          />
        </div>
      )

    case 'me-phone':
      return (
        <div className="me-hero-visual" aria-hidden="true">
          <div className="me-hero-grid" />
          <div className="me-hero-glow" />
          <div className="me-hero-phone me-hero-phone--back" />
          <div className="me-hero-phone me-hero-phone--main">
            <div className="me-hero-screen">
              <div className="me-hero-screen-notch" />
              <div className="me-hero-screen-head">
                <span className="me-hero-screen-head-title">FieldOps</span>
                <span className="me-hero-screen-head-dot" />
              </div>
              <div className="me-hero-screen-map">
                <span className="me-hero-screen-map-label">Job #214 · 2.3 mi</span>
              </div>
              <div className="me-hero-screen-job">
                <span className="me-hero-screen-job-title">HVAC repair — Unit 4B</span>
                <span className="me-hero-screen-job-status">In progress</span>
              </div>
              <div className="me-hero-screen-person">
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative stock photo, as the design */}
                <img
                  src="https://images.pexels.com/photos/38197025/pexels-photo-38197025.jpeg?cs=tinysrgb&w=80&h=80&fit=crop"
                  alt=""
                  loading="lazy"
                />
                <div>
                  <div className="me-hero-screen-person-name">Maria Chen</div>
                  <div className="me-hero-screen-person-sub">4.9 ★ · Verified customer</div>
                </div>
              </div>
              <div className="me-hero-screen-nav">
                <span className="active" />
                <span />
                <span />
              </div>
            </div>
          </div>
          <div className="me-hero-float me-hero-float--notif">
            <span className="me-hero-float-icon" style={{ color: '#C9941F' }}>
              🔔
            </span>
            <div>
              <div className="me-hero-float-title">New order</div>
              <div className="me-hero-float-sub">Order #4521 · 2 items</div>
            </div>
          </div>
          <div className="me-hero-float me-hero-float--sync">
            <span className="me-hero-float-icon">
              <span className="dot-pulse" />
            </span>
            <div>
              <div className="me-hero-float-title">Synced</div>
              <div className="me-hero-float-sub">All devices up to date</div>
            </div>
          </div>
          <PhotoCard
            prefix="me"
            src="https://images.pexels.com/photos/8989218/pexels-photo-8989218.jpeg?cs=tinysrgb&w=220&h=270&fit=crop"
            alt="Field courier checking a delivery on a mobile phone"
            tag="Field team, connected"
          />
        </div>
      )

    case 'qe-pipeline':
      return (
        <div className="qe-hero-visual" aria-hidden="true">
          <div className="qe-hero-grid" />
          <div className="qe-hero-glow" />
          <div className="qe-hero-panel">
            <div className="qe-hero-panel-head">
              <span className="qe-hero-panel-title">Release #482</span>
              <span className="qe-hero-panel-badge">Ready to ship</span>
            </div>
            <div className="qe-hero-pipeline">
              <div className="qe-hero-stage">
                <span className="qe-hero-stage-dot">{QE_CHECK}</span>
                <div className="qe-hero-stage-body">
                  <div className="qe-hero-stage-label">Code committed</div>
                  <div className="qe-hero-stage-time">2d ago</div>
                </div>
              </div>
              <div className="qe-hero-stage">
                <span className="qe-hero-stage-dot">{QE_CHECK}</span>
                <div className="qe-hero-stage-body">
                  <div>
                    <div className="qe-hero-stage-label">1,240 tests passed</div>
                    <div className="qe-hero-stage-sub">0 failing</div>
                  </div>
                  <div className="qe-hero-stage-time">1d ago</div>
                </div>
              </div>
              <div className="qe-hero-stage">
                <span className="qe-hero-stage-dot">{QE_CHECK}</span>
                <div className="qe-hero-stage-body">
                  <div className="qe-hero-stage-label">Security scan clean</div>
                  <div className="qe-hero-stage-time">14m ago</div>
                </div>
              </div>
              <div className="qe-hero-stage is-active">
                <span className="qe-hero-stage-dot" />
                <div className="qe-hero-stage-body">
                  <div>
                    <div className="qe-hero-stage-label">Deploying to production</div>
                    <div className="qe-hero-stage-sub">3 regions</div>
                  </div>
                  <div className="qe-hero-stage-time">Now</div>
                </div>
              </div>
            </div>
          </div>
          <div className="qe-hero-float qe-hero-float--pass">
            <span className="qe-hero-float-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                <path d="M9 12l2 2 4-4.5" />
              </svg>
            </span>
            <div>
              <div className="qe-hero-float-title">0 critical issues</div>
              <div className="qe-hero-float-sub">Last 30 days</div>
            </div>
          </div>
          <div className="qe-hero-float qe-hero-float--defect">
            <span className="qe-hero-float-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6l8.5 8.5 5-5L22 16" />
                <path d="M22 10v6h-6" />
              </svg>
            </span>
            <div>
              <div className="qe-hero-float-title">Defects trending down</div>
              <div className="qe-hero-float-sub">-32% this sprint</div>
            </div>
          </div>
          <PhotoCard
            prefix="qe"
            src="https://images.pexels.com/photos/36598855/pexels-photo-36598855.jpeg?cs=tinysrgb&w=220&h=270&fit=crop"
            alt="Engineer reviewing code during a quality review"
            tag="Reviewed line by line"
          />
        </div>
      )

    case 'zh-logo-card':
    case 'sf-logo-card': {
      // The platform pages anchor the hero on the partner's own mark in a floating card: Zoho adds
      // its partner badge, Salesforce shows the logo alone. Both reuse the service pages' particle
      // field in their brand colours.
      const p = visualKey === 'zh-logo-card' ? 'zh' : 'sf'
      return (
        <div className={`${p}-hero-visual`} aria-hidden="true">
          <div className={`${p}-arc-glow`} />
          <div className={`${p}-logo-card`}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element -- partner wordmark, often SVG; next/image adds nothing here
              <img src={image.src} alt="" className={`${p}-logo-card-img`} />
            ) : null}
            {p === 'zh' ? <span className="zh-logo-card-badge">Zoho Consulting Partner</span> : null}
          </div>
          <div className={`${p}-hero-chip ${p}-hero-chip--a`}>
            {p === 'zh' ? 'CRM · Finance · Service' : 'Sales · Service · Customer data'}
          </div>
          <div className={`${p}-hero-chip ${p}-hero-chip--b`}>
            {p === 'zh' ? 'Implementation · Customization · Integration' : 'Configuration · Integration · Automation'}
          </div>
          <ParticleField prefix={p} />
        </div>
      )
    }

    case 'insights-feed':
      // The /insights index has no design-source hero (it postdates the sdl-2.0 extraction), so
      // this is a bespoke infographic rather than a lifted one — a content-feed mockup in the
      // same grid+glow+float recipe as ce-cloud/qe-pipeline, in the site's default SDL blue
      // rather than a page-themed colour.
      return (
        <div className="ins-hero-visual" aria-hidden="true">
          <div className="ins-hero-grid" />
          <div className="ins-hero-glow" />

          <div className="ins-hero-panel">
            <div className="ins-hero-panel-head">
              <span className="ins-hero-panel-title">Latest thinking</span>
              <span className="ins-hero-panel-badge">Updated weekly</span>
            </div>
            <div className="ins-hero-feed">
              <div className="ins-hero-row">
                <span className="ins-hero-row-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 3v5h5" />
                    <path d="M6 3h8l5 5v13H6z" />
                    <path d="M9 13h6M9 17h6" />
                  </svg>
                </span>
                <div className="ins-hero-row-body">
                  <span className="ins-hero-row-title-bar" />
                  <span className="ins-hero-row-meta-bar" />
                </div>
                <span className="ins-hero-row-tag ins-hero-row-tag--blog">Blog</span>
              </div>
              <div className="ins-hero-row">
                <span className="ins-hero-row-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12l7-7 4 4 7-7" />
                    <path d="M14 3h7v7" />
                  </svg>
                </span>
                <div className="ins-hero-row-body">
                  <span className="ins-hero-row-title-bar" />
                  <span className="ins-hero-row-meta-bar" />
                </div>
                <span className="ins-hero-row-tag ins-hero-row-tag--case">Case study</span>
              </div>
              <div className="ins-hero-row">
                <span className="ins-hero-row-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                  </svg>
                </span>
                <div className="ins-hero-row-body">
                  <span className="ins-hero-row-title-bar" />
                  <span className="ins-hero-row-meta-bar" />
                </div>
                <span className="ins-hero-row-tag ins-hero-row-tag--paper">Whitepaper</span>
              </div>
            </div>
          </div>

          <div className="ins-hero-float ins-hero-float--reach">
            <span className="ins-hero-float-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3Z" />
              </svg>
            </span>
            <div>
              <div className="ins-hero-float-title">Practical thinking</div>
              <div className="ins-hero-float-sub">AI, engineering &amp; growth</div>
            </div>
          </div>
          <div className="ins-hero-float ins-hero-float--fresh">
            <span className="ins-hero-float-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
            </span>
            <div>
              <div className="ins-hero-float-title">Updated regularly</div>
              <div className="ins-hero-float-sub">New articles every week</div>
            </div>
          </div>
        </div>
      )

    case 'none':
    default:
      return null
  }
}
