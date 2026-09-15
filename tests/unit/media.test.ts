import { describe, expect, it } from 'vitest'

import { backgroundImage, optimizedSrc } from '@/lib/media'

describe('optimizedSrc', () => {
  it('routes a URL through the Next image optimiser with width and quality', () => {
    expect(optimizedSrc('https://cms.example/media/a.jpg', 750)).toBe(
      '/_next/image?url=https%3A%2F%2Fcms.example%2Fmedia%2Fa.jpg&w=750&q=75',
    )
  })

  it('leaves a data URI untouched', () => {
    expect(optimizedSrc('data:image/gif;base64,AAAA')).toBe('data:image/gif;base64,AAAA')
  })
})

describe('backgroundImage', () => {
  it('produces a quoted url() value', () => {
    expect(backgroundImage('https://cms.example/x.jpg', 400)).toBe(
      'url("/_next/image?url=https%3A%2F%2Fcms.example%2Fx.jpg&w=400&q=75")',
    )
  })

  it('is undefined when there is no source', () => {
    expect(backgroundImage(undefined)).toBeUndefined()
  })
})
