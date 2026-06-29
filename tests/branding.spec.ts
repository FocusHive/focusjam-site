/**
 * branding.spec.ts — Brand integrity checks.
 *
 * Verifies:
 *   - The string "Ringi" (case-insensitive) appears NOWHERE in any rendered page
 *   - "AI Jammer" appears on the home page
 *   - "AI Jammer" appears on the features page
 */

import { test, expect } from '@playwright/test';

const allPages = [
  '/',
  '/features.html',
  '/pricing.html',
  '/integrations.html',
  '/security.html',
  '/404.html',
];

test.describe('brand rule: no "Ringi" on any rendered page', () => {
  for (const url of allPages) {
    test(`"Ringi" absent on ${url}`, async ({ page }) => {
      await page.goto(url);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toMatch(/ringi/i);
    });
  }
});

test.describe('"AI Jammer" present on key pages', () => {
  test('"AI Jammer" appears on home page (/)', async ({ page }) => {
    await page.goto('/');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('AI Jammer');
  });

  test('"AI Jammer" appears on features page (/features.html)', async ({ page }) => {
    await page.goto('/features.html');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('AI Jammer');
  });
});
