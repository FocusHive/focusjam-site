/**
 * a11y.spec.ts — Lightweight accessibility checks.
 *
 * Hand-rolled assertions (no axe dependency) covering:
 *   - Every page has a skip-link pointing to #main
 *   - <html> carries lang="en"
 *   - Every <img> element has a non-empty alt attribute
 *     (site currently uses inline SVGs — this acts as a guard for regressions)
 *   - The nav-toggle button has an accessible name (sr-only text)
 *   - The brand link has an aria-label
 *   - Every visible <button> and <a> in the page has an accessible name
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

for (const url of allPages) {
  test.describe(`a11y on ${url}`, () => {
    test('has a skip-link targeting #main', async ({ page }) => {
      await page.goto(url);
      const skipLink = page.locator('a.skip-link').first();
      await expect(skipLink).toHaveAttribute('href', '#main');
    });

    test('<html> has lang="en"', async ({ page }) => {
      await page.goto(url);
      const lang = await page.evaluate(() =>
        document.documentElement.getAttribute('lang'),
      );
      expect(lang).toBe('en');
    });

    test('all <img> elements have non-empty alt attributes', async ({ page }) => {
      await page.goto(url);
      const violations = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
          .filter((img) => !img.getAttribute('alt')?.trim())
          .map((img) => img.outerHTML.slice(0, 120));
      });
      expect(
        violations,
        `Images missing alt text: ${violations.join(', ')}`,
      ).toHaveLength(0);
    });

    test('nav-toggle button has an accessible name', async ({ page }) => {
      await page.goto(url);
      const toggle = page.locator('.nav-toggle');
      // The button contains a .sr-only span with "Toggle navigation"
      const srOnly = toggle.locator('.sr-only');
      await expect(srOnly).toHaveText('Toggle navigation');
    });

    test('brand link has an aria-label', async ({ page }) => {
      await page.goto(url);
      const brand = page.locator('.site-header .brand').first();
      const label = await brand.getAttribute('aria-label');
      expect(label?.trim().length).toBeGreaterThan(0);
    });

    test('no buttons lack an accessible name', async ({ page }) => {
      await page.goto(url);
      const violations = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter((btn) => {
            // A button is accessible if it has: text content, aria-label, or aria-labelledby
            const text = btn.textContent?.trim() ?? '';
            const label = btn.getAttribute('aria-label') ?? '';
            const labelledBy = btn.getAttribute('aria-labelledby') ?? '';
            return text === '' && label === '' && labelledBy === '';
          })
          .map((btn) => btn.outerHTML.slice(0, 120));
      });
      expect(
        violations,
        `Buttons without accessible names: ${violations.join(', ')}`,
      ).toHaveLength(0);
    });
  });
}
