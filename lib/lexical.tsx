import type { JSX, ReactNode } from 'react'
import Image from 'next/image'

import { resolveMedia, type MediaLike } from './links'

/**
 * A small renderer for Payload's Lexical rich-text format.
 *
 * Covers what the `body` fields in this project actually use: headings, paragraphs, lists,
 * quotes, links, inline marks (bold / italic / underline / strike / code), line breaks,
 * horizontal rules and uploaded images. Relationship embeds still render nothing, because
 * nothing in the design specifies markup for them.
 *
 * Not a dependency (@payloadcms/richtext-lexical's React renderer would pull the whole editor
 * into the public bundle). Kept deliberately minimal — if a `body` needs more, add the node
 * type here.
 */

type LexicalNode = {
  type: string
  version?: number
  children?: LexicalNode[]
  // text nodes
  text?: string
  format?: number | string
  // headings / lists
  tag?: string
  listType?: 'bullet' | 'number'
  // links
  fields?: { url?: string; newTab?: boolean; linkType?: 'internal' | 'custom'; doc?: unknown }
  url?: string
  newTab?: boolean
  // upload / relationship embeds — `value` is the document at depth > 0, its id at depth 0
  relationTo?: string
  value?: unknown
}

type LexicalRoot = { root?: { children?: LexicalNode[] } } | null | undefined

const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_STRIKE = 1 << 2
const IS_UNDERLINE = 1 << 3
const IS_CODE = 1 << 4

function renderText(node: LexicalNode, key: number): ReactNode {
  let el: ReactNode = node.text ?? ''
  const format = typeof node.format === 'number' ? node.format : 0

  if (format & IS_CODE) el = <code>{el}</code>
  if (format & IS_BOLD) el = <strong>{el}</strong>
  if (format & IS_ITALIC) el = <em>{el}</em>
  if (format & IS_UNDERLINE) el = <u>{el}</u>
  if (format & IS_STRIKE) el = <s>{el}</s>

  return <span key={key}>{el}</span>
}

function renderChildren(children: LexicalNode[] | undefined): ReactNode {
  if (!children?.length) return null
  return children.map((child, i) => renderNode(child, i))
}

/**
 * An image placed in the body through the editor's upload button.
 *
 * This node used to render `null`, so every image an editor inserted into an article's Content
 * simply vanished on the site with no error anywhere — the markup was never emitted.
 *
 * Three things it has to survive:
 *
 *  - `value` is the media document only when the query ran at depth > 0. At depth 0 it is a
 *    bare id, and there is nothing to render from; `resolveMedia` returns null for that.
 *  - Only `media` uploads are images. Another upload collection (or a PDF) must not be forced
 *    into an <img>, so anything without image dimensions is skipped.
 *  - SVG has no derivatives and gains nothing from the optimiser, which would only rasterise
 *    it. It goes through a plain <img>, the same decision the site header makes for the logo.
 *
 * The caption comes from the media document's own `caption` field, so it is written once where
 * the asset lives rather than re-typed at each placement.
 */
function renderUpload(node: LexicalNode, key: number): ReactNode {
  if (node.relationTo && node.relationTo !== 'media') return null

  const value = node.value as MediaLike
  const media = resolveMedia(value)
  if (!media) return null

  const doc = typeof value === 'object' && value !== null ? value : null
  const mimeType = doc?.mimeType ?? ''
  if (!mimeType.startsWith('image/')) return null

  const caption = doc?.caption?.trim() || null
  const credit = doc?.credit?.trim() || null
  const isSvg = mimeType === 'image/svg+xml'

  return (
    <figure key={key} className="sdl-article-embed">
      {isSvg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.src} alt={media.alt} width={media.width} height={media.height} />
      ) : (
        <Image
          src={media.src}
          alt={media.alt}
          width={media.width ?? 1200}
          height={media.height ?? 800}
          sizes="(max-width: 900px) 100vw, 900px"
        />
      )}
      {caption || credit ? (
        <figcaption>
          {caption}
          {caption && credit ? ' ' : null}
          {credit ? <span className="sdl-article-embed__credit">{credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

function renderNode(node: LexicalNode, key: number): ReactNode {
  switch (node.type) {
    case 'text':
      return renderText(node, key)

    case 'linebreak':
      return <br key={key} />

    case 'horizontalrule':
      return <hr key={key} />

    case 'heading': {
      const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tag ?? '')
        ? node.tag
        : 'h2') as keyof JSX.IntrinsicElements
      return <Tag key={key}>{renderChildren(node.children)}</Tag>
    }

    case 'quote':
      return <blockquote key={key}>{renderChildren(node.children)}</blockquote>

    case 'list': {
      const Tag = node.listType === 'number' ? 'ol' : 'ul'
      return <Tag key={key}>{renderChildren(node.children)}</Tag>
    }

    case 'listitem':
      return <li key={key}>{renderChildren(node.children)}</li>

    case 'link': {
      const href = node.fields?.url ?? node.url ?? '#'
      const newTab = node.fields?.newTab ?? node.newTab
      return (
        <a
          key={key}
          href={href}
          {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {renderChildren(node.children)}
        </a>
      )
    }

    case 'paragraph':
      return <p key={key}>{renderChildren(node.children)}</p>

    case 'upload':
      return renderUpload(node, key)

    case 'relationship':
      // No design spec for embedding a whole document inside prose — render nothing rather
      // than guess. Images are different: the article design shows them, so `upload` renders.
      return null

    default:
      // Unknown block: fall back to its children so text is never lost.
      return node.children?.length ? <div key={key}>{renderChildren(node.children)}</div> : null
  }
}

export function RichText({ content }: { content: LexicalRoot }) {
  const children = content?.root?.children
  if (!children?.length) return null
  return <>{children.map((node, i) => renderNode(node, i))}</>
}

/** Plain-text extraction, for excerpts and meta descriptions when no explicit one is set. */
export function lexicalToPlainText(content: LexicalRoot, limit = 300): string {
  const out: string[] = []
  const walk = (nodes: LexicalNode[] | undefined) => {
    for (const node of nodes ?? []) {
      if (node.type === 'text' && node.text) out.push(node.text)
      walk(node.children)
      if (out.join(' ').length > limit) return
    }
  }
  walk(content?.root?.children)
  return out.join(' ').replace(/\s+/g, ' ').trim().slice(0, limit)
}
