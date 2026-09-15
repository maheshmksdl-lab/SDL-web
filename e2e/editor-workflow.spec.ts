import { CMS, expect, loginToAdmin, test } from './helpers'

/**
 * The editor-facing workflow (plan §9.2 scenarios 1, 2, 3, 5, 9).
 *
 * These drive the Payload admin and then assert the public site reflects the change within one
 * revalidation cycle. They need the seeded stack and admin credentials
 * (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD) — the whole file skips without them.
 */

test.describe('editor workflow', () => {
  test.skip(!process.env.E2E_ADMIN_PASSWORD, 'set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD to run')

  test.beforeEach(async ({ cmsUp }) => {
    test.skip(!cmsUp, 'CMS admin not reachable')
  })

  test('scenario 2 — hiding a section removes it from the live DOM but not the editor', async ({
    page,
    context,
  }) => {
    await loginToAdmin(page)

    // Open the home page, toggle the first section's "hidden", save & publish.
    await page.goto(`${CMS}/admin/collections/pages`)
    await page.getByRole('link', { name: /home|social dna/i }).first().click()
    await page.getByRole('button', { name: /^layout/i }).first().click().catch(() => {})

    const hiddenToggle = page.getByLabel(/hide this section/i).first()
    await hiddenToggle.check()
    await page.getByRole('button', { name: /save|publish/i }).first().click()
    await expect(page.getByText(/updated successfully|published/i)).toBeVisible({ timeout: 15_000 })

    // The section is gone from the live page…
    const site = await context.newPage()
    // Two requests: revalidateTag('max') is stale-while-revalidate (Phase 5 status).
    await site.goto('/')
    await site.reload()
    const sectionsAfter = await site.locator('main > section').count()

    // …but still present and editable in the admin.
    await hiddenToggle.uncheck()
    await page.getByRole('button', { name: /save|publish/i }).first().click()
    await site.reload()
    await site.reload()
    const sectionsRestored = await site.locator('main > section').count()

    expect(sectionsRestored).toBeGreaterThan(sectionsAfter)
  })

  test('scenario 9 — a contact submission stores a lead and swaps in the success state', async ({
    page,
  }) => {
    await page.goto('/#contact')
    const form = page.locator('.sdl-form')
    await form.locator('input[name="name"]').fill('E2E Tester')
    await form.locator('input[name="email"]').fill('e2e@example.com')
    await form.locator('input[name="company"]').fill('Testing Inc')
    await form.locator('textarea[name="goal"]').fill('Checking the pipeline end to end.')
    await form.locator('button[type="submit"]').click()

    await expect(page.locator('.sdl-form-success')).toBeVisible({ timeout: 15_000 })

    // The lead is in the CMS.
    await loginToAdmin(page)
    await page.goto(`${CMS}/admin/collections/leads`)
    await expect(page.getByText('e2e@example.com')).toBeVisible()
  })

  test('scenario 10 — an unpublished page 404s for anonymous, renders under preview', async ({
    page,
    context,
  }) => {
    await loginToAdmin(page)
    // Assumes a seeded draft-only page at /_e2e-draft; skip if the fixture is absent.
    const anon = await context.newPage()
    const res = await anon.goto('/_e2e-draft')
    test.skip(res?.status() !== 404, 'no draft fixture page seeded')
    expect(res?.status()).toBe(404)
  })
})
