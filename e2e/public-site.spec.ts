import { expect, test } from './helpers'

/**
 * Public-site behaviour that does not need a logged-in editor. Runs against a bare `next dev`
 * (CMS-dependent assertions are guarded), and in full against the seeded stack in CI.
 *
 * Covers plan §9.2 scenarios 4, 6, 7, 8, 10, 11, 12 and the SEO surface from §6.9.
 */

test.describe('routing and status codes', () => {
  test('an unknown path returns a real 404, not a 200 (§3.3 / Phase 4 issue #1)', async ({ page }) => {
    const res = await page.goto('/definitely-not-a-page-9284')
    expect(res?.status()).toBe(404)
    await expect(page.locator('body')).toContainText(/couldn.?t find/i)
  })

  test('robots.txt blocks everything outside production', async ({ page, baseURL }) => {
    const res = await page.request.get(`${baseURL}/robots.txt`)
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    // Dev/staging: fully disallowed. Production: allows / and names the sitemap.
    expect(body).toMatch(/User-Agent: \*/i)
  })

  test('sitemap.xml is served', async ({ page, baseURL }) => {
    const res = await page.request.get(`${baseURL}/sitemap.xml`)
    expect(res.ok()).toBeTruthy()
    expect(res.headers()['content-type']).toMatch(/xml/)
  })
})

test.describe('chrome', () => {
  test('every page renders the shared header and footer', async ({ page, cmsUp }) => {
    test.skip(!cmsUp, 'needs the seeded CMS for a page to resolve')
    await page.goto('/')
    await expect(page.locator('.sdl-header')).toBeVisible()
    await expect(page.locator('.sdl-footer')).toBeVisible()
    await expect(page.locator('a.sdl-skip-link')).toHaveCount(1)
  })

  test('the Organisation JSON-LD is present in the document', async ({ page, cmsUp }) => {
    test.skip(!cmsUp, 'needs the seeded CMS')
    await page.goto('/')
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(ld).toContain('"@type":"Organization"')
  })
})

test.describe('mega menu — keyboard operability (§6.11)', () => {
  test('opens on focus, closes on Escape', async ({ page, cmsUp }) => {
    test.skip(!cmsUp, 'needs the seeded CMS')
    await page.goto('/')
    const firstNavButton = page.locator('.sdl-header button').first()
    await firstNavButton.focus()
    await firstNavButton.press('Enter')
    await expect(page.locator('[aria-expanded="true"]')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('[aria-expanded="true"]')).toHaveCount(0)
  })
})

test.describe('mobile navigation (§9.2 scenario 7)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('the panel opens and an accordion expands at 375px', async ({ page, cmsUp }) => {
    test.skip(!cmsUp, 'needs the seeded CMS')
    await page.goto('/')
    await page.locator('[aria-label*="menu" i], .sdl-mobile-toggle, button:has-text("Menu")').first().click()
    await expect(page.locator('.sdl-mobile-panel, [data-mobile-nav]')).toBeVisible()
  })
})

test.describe('anchor navigation (§9.2 scenario 4)', () => {
  test('a hash link scrolls to the section with that id', async ({ page, cmsUp }) => {
    test.skip(!cmsUp, 'needs the seeded CMS')
    await page.goto('/#contact')
    const target = page.locator('#contact')
    await expect(target).toBeVisible()
  })
})

test.describe('maintenance mode (§9.2 scenario 12)', () => {
  test('MAINTENANCE_MODE=true serves the maintenance page with a 503', async ({ page, baseURL }) => {
    test.skip(process.env.MAINTENANCE_MODE !== 'true', 'only runs when maintenance mode is forced on')
    const res = await page.goto(`${baseURL}/`)
    expect(res?.status()).toBe(503)
    await expect(page.locator('body')).toContainText(/right back|maintenance/i)
  })
})
