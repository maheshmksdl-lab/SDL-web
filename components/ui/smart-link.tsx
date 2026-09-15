import Link from 'next/link'

import type { ResolvedLink } from '@/lib/links'

/**
 * Renders a resolved CMS link.
 *
 * Picks `next/link` for internal navigation (client-side transitions and prefetching) and a
 * plain anchor for external URLs and same-page fragments, where Link buys nothing.
 *
 * Both render an `<a>` with the same attributes, so the DOM the parity harness compares is
 * identical to the design's either way — this is a performance choice, not a markup one.
 */
export function SmartLink({
  link,
  className,
  children,
  style,
  'aria-label': ariaLabel,
}: {
  link: ResolvedLink
  className?: string
  children?: React.ReactNode
  style?: React.CSSProperties
  'aria-label'?: string
}) {
  const content = children ?? link.label

  // A fragment link must not be client-navigated: Link would push a history entry and, on a
  // different route, try to navigate rather than scroll.
  if (link.external || link.href.startsWith('#')) {
    return (
      <a
        href={link.href}
        className={className}
        style={style}
        aria-label={ariaLabel}
        {...(link.newTab
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : link.external
            ? { rel: 'noopener' }
            : {})}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={link.href} className={className} style={style} aria-label={ariaLabel}>
      {content}
    </Link>
  )
}
