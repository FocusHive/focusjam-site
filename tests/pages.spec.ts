/**
 * pages.spec.ts — Per-page structural checks.
 *
 * Verifies:
 *   - Each page loads (HTTP 200)
 *   - Exactly one <h1>
 *   - Has a <title>
 *   - Has a meta description (all pages except 404)
 *   - Footer has the dynamic year span with a valid 4-digit year
 *   - No console errors on load
 */

import { test, expect } from '@playwright/test';

interface PageDef {
  url: string;
  hasDescription: boolean;
}

const pages: PageDef[] = [
  { url: '/', hasDescription: true },
  { url: '/features.html', hasDescription: true },
  { url: '/integrations.html', hasDescription: true },
  { url: '/security.html', hasDescription: true },
  { url: '/pricing.html', hasDescription: true },
  { url: '/404.html', hasDescription: false },
];

for (const { url, hasDescription } of pages) {
  test.describe(`page ${url}`, () => {
    test('returns HTTP 200', async ({ page }) => {
      const response = await page.goto(url);
      expect(response?.status()).toBe(200);
    });

    test('has exactly one h1', async ({ page }) => {
      await page.goto(url);
      const headings = page.locator('h1');
      await expect(headings).toHaveCount(1);
    });

    test('has a non-empty <title>', async ({ page }) => {
      await page.goto(url);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
      expect(title).toContain('FocusJam');
    });

    if (hasDescription) {
      test('has a meta description', async ({ page }) => {
        await page.goto(url);
        const content = await page
          .locator('meta[name="description"]')
          .getAttribute('content');
        expect(content?.trim().length).toBeGreaterThan(0);
      });
    } else {
      test('does not require a meta description (404)', async ({ page }) => {
        await page.goto(url);
        // 404 omits a description — just verify the page loads and has the noindex tag
        const robots = await page
          .locator('meta[name="robots"]')
          .getAttribute('content');
        expect(robots).toContain('noindex');
      });
    }

    test('footer has a [data-year] span with a valid year', async ({ page }) => {
      await page.goto(url);
      // site.js populates [data-year] spans with the current year
      const yearSpan = page.locator('footer [data-year]').first();
      await expect(yearSpan).toBeVisible();
      const text = await yearSpan.textContent();
      expect(text).toMatch(/^\d{4}$/);
    });

    test('no console errors on load', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(url);

      // Allow a moment for deferred scripts to run
      await page.waitForLoadState('networkidle');

      expect(errors).toHaveLength(0);
    });
  });
}
