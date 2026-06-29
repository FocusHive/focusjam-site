/**
 * a11y.spec.ts — Lightweight accessibility checks for the Cloudly-template site.
 *
 * Hand-rolled assertions (no axe dependency) covering:
 *   - Skip link targeting #main is present on every page
 *   - <html> carries lang="en"
 *   - All <img> elements have an alt attribute (empty alt="" is valid for decorative)
 *   - .sidebar__toggle (mobile hamburger) has an aria-label
 *   - Brand wordmark link has an accessible name from its text content
 *   - No <button> elements lack an accessible name
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

for (const url of allPages) {
  test.describe(`a11y on ${url}`, () => {
    test('has a skip-link targeting #main', async ({ page }) => {
      await page.goto(url);
      const skipLink = page.locator('a.skip-link');
      await expect(skipLink).toHaveCount(1);
      await expect(skipLink).toHaveAttribute('href', '#main');
    });

    test('<html> has lang="en"', async ({ page }) => {
      await page.goto(url);
      const lang = await page.evaluate(() =>
        document.documentElement.getAttribute('lang'),
      );
      expect(lang).toBe('en');
    });

    test('all <img> elements have an alt attribute (empty allowed for decorative)', async ({ page }) => {
      await page.goto(url);
      // Only fail on images that have NO alt attribute at all.
      // Empty alt="" is valid (marks image as decorative).
      const violations = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
          .filter((img) => !img.hasAttribute('alt'))
          .map((img) => img.outerHTML.slice(0, 120));
      });
      expect(
        violations,
        `Images missing alt attribute on ${url}: ${violations.join(', ')}`,
      ).toHaveLength(0);
    });

    test('.sidebar__toggle (mobile hamburger) has an aria-label', async ({ page }) => {
      await page.goto(url);
      // The hamburger div carries aria-label="Open menu" and role="button"
      const toggle = page.locator('.sidebar__toggle');
      await expect(toggle).toHaveCount(1);
      const label = await toggle.getAttribute('aria-label');
      expect(label?.trim().length, '.sidebar__toggle must have a non-empty aria-label').toBeGreaterThan(0);
    });

    test('brand wordmark link (.logo a.header-logo) has text content "FocusJam"', async ({ page }) => {
      await page.goto(url);
      const brand = page.locator('.logo a.header-logo').first();
      // The .fj-wordmark-text span provides the visible text
      await expect(brand).toContainText('FocusJam');
    });

    test('no <button> elements lack an accessible name', async ({ page }) => {
      await page.goto(url);
      const violations = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter((btn) => {
            const text = (btn.textContent ?? '').trim();
            const label = (btn.getAttribute('aria-label') ?? '').trim();
            const labelledBy = (btn.getAttribute('aria-labelledby') ?? '').trim();
            return text === '' && label === '' && labelledBy === '';
          })
          .map((btn) => btn.outerHTML.slice(0, 120));
      });
      expect(
        violations,
        `Buttons without accessible names on ${url}: ${violations.join(', ')}`,
      ).toHaveLength(0);
    });
  });
}
