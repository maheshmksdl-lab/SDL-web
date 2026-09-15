import { test as base, expect, type Page } from '@playwright/test'

/**
 * Shared fixtures. `cmsUp` lets a test skip cleanly when the CMS admin is not reachable, so the
 * public-site checks still run against a bare `next dev`.
 */

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001'

export const test = base.extend<{ cmsUp: boolean }>({
  // eslint-disable-next-line no-empty-pattern -- Playwright's idiom for a fixture with no deps
  cmsUp: async ({}, use) => {
    let up = false
    try {
      const res = await fetch(`${CMS_URL}/api/access`, { signal: AbortSignal.timeout(3000) })
      up = res.status < 500
    } catch {
      up = false
    }
    await use(up)
  },
})

export { expect }

/** Logs into the Payload admin as the founding superadmin (seeded credentials from env). */
export async function loginToAdmin(page: Page): Promise<void> {
  const email = process.env.E2E_ADMIN_EMAIL || 'admin@socialdnalabs.com'
  const password = process.env.E2E_ADMIN_PASSWORD || 'test-Password-123'
  await page.goto(`${CMS_URL}/admin/login`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL(/\/admin(\/|$)/)
}

export const CMS = CMS_URL
