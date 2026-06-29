/**
 * nav.spec.ts — Primary navigation checks on every page.
 *
 * Verifies:
 *   - All 7 nav links render on every page
 *   - Brand anchor points to "/"
 *   - Each nav link has the expected href
 *   - aria-current="page" is set on the correct link per page
 *   - "Open FocusJam" CTA is present
 */

import { test, expect } from '@playwright/test';

// Pages under test: [url, expected aria-current link text]
// 404 has no aria-current on any nav link — represented as null.
const pages: [string, string | null][] = [
  ['/', 'Product'],
  ['/features.html', 'Features'],
  ['/integrations.html', 'Integrations'],
  ['/security.html', 'Security'],
  ['/pricing.html', 'Pricing'],
  ['/404.html', null],
];

// Expected nav links in order: [display text, href]
const expectedLinks: [string, string][] = [
  ['Product', '/index.html#product'],
  ['Features', '/features.html'],
  ['Integrations', '/integrations.html'],
  ['Security', '/security.html'],
  ['Pricing', '/pricing.html'],
  ['Join a meeting', 'https://join.focusjam.com'],
  ['Open FocusJam', 'https://app.focusjam.com'],
];

for (const [url, currentPageLabel] of pages) {
  test.describe(`nav on ${url}`, () => {
    test('renders 7 nav links', async ({ page }) => {
      await page.goto(url);
      const nav = page.locator('#site-nav');
      // NOTE: on mobile viewport the nav is CSS-hidden (hamburger pattern) — we
      // check DOM presence and link count, not container visibility. The
      // mobile-nav.spec.ts suite covers the open/close behaviour separately.
      const links = nav.locator('a');
      await expect(links).toHaveCount(7);
    });

    test('brand link points to /', async ({ page }) => {
      await page.goto(url);
      const brand = page.locator('.site-header .brand').first();
      await expect(brand).toHaveAttribute('href', '/');
    });

    test('nav links have correct hrefs', async ({ page }) => {
      await page.goto(url);
      const nav = page.locator('#site-nav');
      const links = nav.locator('a');

      for (let i = 0; i < expectedLinks.length; i++) {
        const [text, href] = expectedLinks[i];
        const link = links.nth(i);
        await expect(link).toHaveText(text);
        await expect(link).toHaveAttribute('href', href);
      }
    });

    test('aria-current="page" is on the correct link', async ({ page }) => {
      await page.goto(url);
      const nav = page.locator('#site-nav');

      if (currentPageLabel === null) {
        // 404: no link should carry aria-current
        const currentLinks = nav.locator('[aria-current="page"]');
        await expect(currentLinks).toHaveCount(0);
      } else {
        // Exactly one link has aria-current="page", and its text matches
        const currentLinks = nav.locator('[aria-current="page"]');
        await expect(currentLinks).toHaveCount(1);
        await expect(currentLinks.first()).toHaveText(currentPageLabel);
      }
    });

    test('"Open FocusJam" CTA is present', async ({ page }) => {
      await page.goto(url);
      const cta = page.locator('#site-nav a.button.button-small');
      await expect(cta).toHaveText('Open FocusJam');
      await expect(cta).toHaveAttribute('href', 'https://app.focusjam.com');
    });
  });
}
