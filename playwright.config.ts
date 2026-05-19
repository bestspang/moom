import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for MOOM end-to-end tests.
 *
 * - Local dev: `bunx playwright install chromium` then `bunx playwright test`.
 * - CI: see `.github/workflows/e2e.yml`. The workflow skips itself if the
 *   `E2E_ADMIN_EMAIL` secret is not configured, so forks and contributors
 *   without test credentials see a green tick.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'bun run build && bun run preview --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
