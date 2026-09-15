import type { Page } from '@/lib/payload-types'
import { getAiEngineeringMock } from '@/lib/registries/ai-engineering-mocks'
import type { Theme } from '@/lib/theme'
import { Kicker } from '@/components/ui/primitives'

import { AiEngineeringMock } from './ai-engineering-mock'

type Block = Extract<NonNullable<Page['layout']>[number], { blockType: 'ai-engineering' }>

/**
 * "AI-enabled engineering" — digital-engineering and its four sub-service pages.
 * Server component: only the step-cycling mock on the right is a client island.
 *
 * Every page writes this section with its own prefix (`.de-ai-*`, `.ce-ai-*`, …) and its own
 * frame around the steps, so the markup is built from the page theme. The kicker is the page's
 * `--ai` variant (`<span class="ce-kicker ce-kicker--ai">`), violet on every page.
 */
export function AiEngineering(props: Record<string, unknown>) {
  const block = props as unknown as Block
  const p: Theme = (props.theme as Theme | null | undefined) ?? 'de'
  const mock = getAiEngineeringMock(block.mockKey)

  return (
    <>
      {/* Full-bleed decorative glow, a sibling of the content — not a wrapper around it. */}
      <div className={`${p}-ai-glow-bg`} aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="sdl-section-inner">
        <div className={`${p}-ai-grid`}>
          <div className="reveal">
            <Kicker theme={p} modifier="ai">
              {block.kicker}
            </Kicker>
            <h2 className={`sdl-section-title ${p}-ai-title`}>{block.title}</h2>
            {block.paragraphs?.length ? (
              <div className={`${p}-ai-copy-body`}>
                {block.paragraphs.map((para, i) => (
                  <p key={para.id ?? i}>{para.text}</p>
                ))}
              </div>
            ) : null}
            {block.tags?.length ? (
              <div className={`${p}-ai-pills`}>
                {block.tags.map((tag) => (
                  <span className={`${p}-ai-pill`} key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {mock ? <AiEngineeringMock prefix={p} mock={mock} /> : null}
        </div>
      </div>
    </>
  )
}
