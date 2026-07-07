import { test, expect } from '@playwright/test';

/**
 * Regression: LobbyFilters must never call the locations table with
 * `location_status=eq.active` — that value is not part of the enum
 * (open/closed) and yields a 400. Also asserts that no request from
 * the /lobby page returns 4xx/5xx.
 *
 * Skipped automatically unless E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are set.
 */

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const hasCreds = Boolean(adminEmail && adminPassword);

test.describe('Lobby filters — no bad location_status', () => {
  test.skip(!hasCreds, 'Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD to run');

  test('no request uses location_status=eq.active and no 4xx/5xx responses', async ({ page }) => {
    const badLocationCalls: string[] = [];
    const errored: { url: string; status: number }[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('location_status=eq.active')) {
        badLocationCalls.push(url);
      }
    });

    page.on('response', (res) => {
      const url = res.url();
      const status = res.status();
      // Ignore unrelated third-party or Playwright-injected assets
      if (status >= 400 && (url.includes('/rest/v1/') || url.includes('/functions/v1/'))) {
        errored.push({ url, status });
      }
    });

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(adminEmail!);
    await page.getByLabel(/password/i).fill(adminPassword!);
    await page.getByRole('button', { name: /sign in|log in|เข้าสู่ระบบ/i }).click();
    await page.waitForURL(/\/(dashboard|lobby|home)/, { timeout: 15_000 });

    await page.goto('/lobby');
    // Let LobbyFilters mount and fire its location query
    await page.waitForLoadState('networkidle');

    // Try to open the location filter (if visible) and pick each option
    const locationSelect = page.locator('[role="combobox"]').first();
    if (await locationSelect.isVisible().catch(() => false)) {
      await locationSelect.click();
      const options = page.getByRole('option');
      const count = await options.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        await locationSelect.click();
        await options.nth(i).click();
        await page.waitForLoadState('networkidle');
      }
    }

    expect(
      badLocationCalls,
      `LobbyFilters must not query location_status=eq.active — got:\n${badLocationCalls.join('\n')}`,
    ).toEqual([]);

    expect(
      errored,
      `Lobby made failing requests:\n${errored.map((e) => `${e.status}  ${e.url}`).join('\n')}`,
    ).toEqual([]);
  });
});
