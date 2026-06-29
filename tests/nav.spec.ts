/**
 * nav.spec.ts — Primary navigation checks on every page.
 *
 * Targets the Cloudly template markup:
 *   - nav#mobile-menu  (desktop accordion nav, hidden by meanmenu on mobile)
 *   - .logo a.header-logo  (wordmark / brand link)
 *   - header .header-right a.pp-theme-btn  ("Open FocusJam" CTA)
 *   - header .header-right a.pp-btn-outline  ("Join a meeting" CTA)
 *   - li.active  (per-page active state)
 *
 * Restricted to Desktop Chrome only — on mobile viewports meanmenu
 * hides nav#mobile-menu and rewrites the nav into the offcanvas sidebar;
 * mobile nav behaviour is covered by mobile-nav.spec.ts.
 */

import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Desktop Chrome'] });

// [url, expected active link text | null for 404]
const pages: [string, string | null][] = [
  ['/', 'Home'],
  ['/features.html', 'Features'],
  ['/pricing.html', 'Pricing'],
  ['/integrations.html', 'Integrations'],
  ['/security.html', 'Security'],
  ['/404.html', null],
];

// Expected nav items in order: [display text, href attribute]
const expectedNavItems: [string, string][] = [
  ['Home', 'index.html'],
  ['Features', 'features.html'],
  ['Pricing', 'pricing.html'],
  ['Integrations', 'integrations.html'],
  ['Security', 'security.html'],
];

for (const [url, activeText] of pages) {
  test.describe(`nav on ${url}`, () => {
    test('renders 5 nav items', async ({ page }) => {
      await page.goto(url);
      const items = page.locator('nav#mobile-menu ul li');
      await expect(items).toHaveCount(5);
    });

    test('nav items have correct text and hrefs', async ({ page }) => {
      await page.goto(url);
      for (const [text, href] of expectedNavItems) {
        const link = page.locator(`nav#mobile-menu ul li a[href="${href}"]`);
        await expect(link).toHaveCount(1);
        await expect(link).toContainText(text);
      }
    });

    test('brand wordmark links to index.html', async ({ page }) => {
      await page.goto(url);
      const brand = page.locator('.logo a.header-logo').first();
      await expect(brand).toHaveAttribute('href', 'index.html');
    });

    test('correct nav item carries class="active"', async ({ page }) => {
      await page.goto(url);
      const activeItems = page.locator('nav#mobile-menu ul li.active');

      if (activeText === null) {
        // 404: no item should be active
        await expect(activeItems).toHaveCount(0);
      } else {
        await expect(activeItems).toHaveCount(1);
        await expect(activeItems.first().locator('a')).toContainText(activeText);
      }
    });

    test('"Open FocusJam" CTA is present and links to app.focusjam.com', async ({ page }) => {
      await page.goto(url);
      const cta = page.locator('header .header-right a.pp-theme-btn').first();
      await expect(cta).toContainText('Open FocusJam');
      await expect(cta).toHaveAttribute('href', 'https://app.focusjam.com');
    });

    test('"Join a meeting" CTA is present and links to join.focusjam.com', async ({ page }) => {
      await page.goto(url);
      // d-none d-lg-inline-block: visible on desktop
      const cta = page.locator('header .header-right a.pp-btn-outline').first();
      await expect(cta).toContainText('Join a meeting');
      await expect(cta).toHaveAttribute('href', 'https://join.focusjam.com');
    });
  });
}
