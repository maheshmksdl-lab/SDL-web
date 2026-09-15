import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './helpers'

/**
 * Automated accessibility sweep (plan §9.3): axe-core on each page type at three widths, zero
 * critical or serious violations. Manual keyboard / screen-reader passes are recorded in
 * docs/ACCESSIBILITY.md.
 */

const PATHS = ['/', '/services', '/services/ai-transformation', '/evoq']
const WIDTHS = [375, 768, 1440]

for (const path of PATHS) {
  for (const width of WIDTHS) {
    test(`axe: ${path} @ ${width}px`, async ({ page, cmsUp }) => {
      test.skip(!cmsUp, 'needs the seeded CMS for pages to resolve')
      await page.setViewportSize({ width, height: 900 })
      await page.goto(path)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const seriousOrWorse = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      )
      expect(seriousOrWorse, JSON.stringify(seriousOrWorse.map((v) => v.id), null, 2)).toHaveLength(0)
    })
  }
}

test('the contact form fields keep their label association', async ({ page, cmsUp }) => {
  test.skip(!cmsUp, 'needs the seeded CMS')
  await page.goto('/#contact')
  const inputs = page.locator('.sdl-form input, .sdl-form textarea')
  const count = await inputs.count()
  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i)
    const id = await input.getAttribute('id')
    if (!id) continue
    await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1)
  }
})
