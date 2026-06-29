/**
 * branding.spec.ts — Brand integrity checks.
 *
 * Verifies:
 *   - The string "Ringi" (case-insensitive) appears NOWHERE in any rendered page
 *   - The string "AI Jammer" appears on the home page (index)
 *   - The string "AI Jammer" appears on the features page
 */

import { test, expect } from '@playwright/test';

const allPages = [
  '/',
  '/features.html',
  '/integrations.html',
  '/security.html',
  '/pricing.html',
  '/404.html',
];

test.describe('brand rule: no "Ringi" on any page', () => {
  for (const url of allPages) {
    test(`"Ringi" absent on ${url}`, async ({ page }) => {
      await page.goto(url);
      const bodyText = await page.locator('body').innerText();
      // Case-insensitive check — "Ringi", "ringi", "RINGI" all must be absent
      expect(bodyText).not.toMatch(/ringi/i);
    });
  }
});

test.describe('"AI Jammer" present on key pages', () => {
  test('"AI Jammer" appears on home page', async ({ page }) => {
    await page.goto('/');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('AI Jammer');
  });

  test('"AI Jammer" appears on features page', async ({ page }) => {
    await page.goto('/features.html');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('AI Jammer');
  });
});
