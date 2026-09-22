import type { CmsLink } from '@/lib/links'
import type { Theme } from '@/lib/theme'
import { resolveLink } from '@/lib/links'
import { getIcon } from '@/lib/registries/icons'

import { SmartLink } from './smart-link'

/**
 * The small pieces the design repeats across sections.
 *
 * Each renders the design's exact markup. Extracting them is not a refactor for its own sake —
 * the parity harness compares class sets and element counts per section, so nineteen
 * hand-written copies of the kicker would be nineteen chances to differ by one wrapper.
 */

/**
 * The small uppercase label above a section title.
 *
 * On the home and services pages it is the shared `.sdl-kicker` block. On every themed page the
 * design writes the page's own inline kicker instead — `<span class="bt-kicker">` in gold,
 * `<span class="ce-kicker ce-kicker--ai">` on cloud engineering's AI section — which is a distinct
 * rule with its own colour, not an alias of `.sdl-kicker`. Passing `theme` renders that markup.
 */
export function Kicker({
  children,
  dark = false,
  withLine = true,
  className = '',
  theme,
  modifier,
}: {
  children: React.ReactNode
  dark?: boolean
  withLine?: boolean
  className?: string
  /** The page theme (`bt`, `ce`, …). Renders `.<theme>-kicker` in place of `.sdl-kicker`. */
  theme?: Theme | null
  /** A themed modifier the design uses, e.g. `ai` → `.ce-kicker--ai`. */
  modifier?: string
}) {
  if (!children) return null
  if (theme) {
    const classes = [
      `${theme}-kicker`,
      modifier ? `${theme}-kicker--${modifier}` : '',
      dark ? `${theme}-kicker--dark` : '',
      className,
    ]
    return (
      <span className={classes.filter(Boolean).join(' ')}>
        <span className="kicker-line" /> {children}
      </span>
    )
  }
  return (
    <div className={`sdl-kicker${dark ? ' sdl-kicker--dark' : ''}${className ? ` ${className}` : ''}`}>
      {withLine ? <span className="kicker-line" /> : null} {children}
    </div>
  )
}

/**
 * `.sdl-section-title`.
 *
 * Renders as a real heading element while keeping the design's class. The design marks these up
 * as <div>, which leaves the document with no outline; the CSS sets size and weight explicitly,
 * so the rendered result is identical either way. Accessibility remediation, not a design change
 * (plan §6.11).
 */
export function SectionTitle({
  children,
  as: Tag = 'h2',
  small = false,
  spaced = false,
  className = '',
}: {
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3'
  small?: boolean
  /** The design applies `style="margin-top:18px"` inline at most call sites. */
  spaced?: boolean
  className?: string
}) {
  if (!children) return null
  return (
    <Tag
      className={`sdl-section-title${small ? ' sdl-section-title--sm' : ''}${className ? ` ${className}` : ''}`}
      style={spaced ? { marginTop: 18 } : undefined}
    >
      {children}
    </Tag>
  )
}

/** `.sdl-section-sub` — the paragraph under a section title. */
export function SectionSub({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return <p className="sdl-section-sub">{children}</p>
}

/** `.sdl-cta-link` — the arrow link the design uses to close most sections. */
export function CtaLink({
  link,
  small = false,
  className = '',
}: {
  link: CmsLink
  small?: boolean
  className?: string
}) {
  const resolved = resolveLink(link)
  if (!resolved?.label) return null
  return (
    <SmartLink
      link={resolved}
      className={`sdl-cta-link${small ? ' sdl-cta-link--sm' : ''}${className ? ` ${className}` : ''}`}
    >
      {resolved.label} →
    </SmartLink>
  )
}

/** The filled pill button — `.sdl-hero-primary` and its section-level equivalents. */
export function PillButton({
  link,
  className = 'sdl-hero-primary',
  arrow = '→',
}: {
  link: CmsLink
  className?: string
  arrow?: string
}) {
  const resolved = resolveLink(link)
  if (!resolved?.label) return null
  return (
    <SmartLink link={resolved} className={className}>
      {resolved.label} {arrow}
    </SmartLink>
  )
}

/**
 * An icon from the registry.
 *
 * `dangerouslySetInnerHTML` is safe here and nowhere near user input: the string comes from
 * `lib/registries/icons.ts`, which is generated from the design files at build time. The CMS
 * only ever stores a KEY — an editor cannot introduce markup through this path.
 */
export function RegistryIcon({
  iconKey,
  size = 24,
  viewBox = '0 0 24 24',
  strokeWidth = 2,
  className,
}: {
  iconKey?: string | null
  size?: number
  viewBox?: string
  strokeWidth?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: getIcon(iconKey) }}
    />
  )
}

/**
 * A heading built from the CMS's line/accent structure.
 *
 * The design's hero and contact headings interleave plain and accent-coloured text inside
 * separate line elements, which a single rich-text field cannot express — the accent span is
 * structural, not formatting.
 */
export type HeadingLine = {
  before?: string | null
  accent?: string | null
  after?: string | null
  id?: string | null
}

export function AccentLines({
  lines,
  as: Tag = 'div',
  className,
  id,
}: {
  lines?: HeadingLine[] | null
  as?: 'div' | 'h1' | 'h2'
  className?: string
  id?: string
}) {
  if (!lines?.length) return null
  return (
    <Tag id={id} className={className}>
      {lines.map((line, index) => (
        <div key={line.id ?? index}>
          {line.before}
          {line.accent ? <span className="accent">{line.accent}</span> : null}
          {line.after}
        </div>
      ))}
    </Tag>
  )
}
