import { defineConfig, devices } from '@playwright/test'

/**
 * E2E + accessibility suite (plan §9.2, §9.3, §9.5).
 *
 * BASE_URL is the public site; CMS_URL is the admin. Tests that need the CMS (editor workflow,
 * lead creation) check availability in a fixture and skip when it is not up, so `pnpm e2e`
 * against a bare `next dev` still runs the public-site and a11y checks.
 *
 * CI starts both apps with a seeded database and runs the whole matrix.
 */

const BASE_URL = process.env.PARITY_TARGET_URL || process.env.BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],

  // In CI the workflow starts the servers; locally, start the web app if it is not already up.
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
