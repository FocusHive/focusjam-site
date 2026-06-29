/**
 * mobile-nav.spec.ts — Mobile navigation / offcanvas sidebar.
 *
 * The Cloudly template uses two mobile nav mechanisms:
 *   1. Offcanvas sidebar — triggered by .sidebar__toggle in the header.
 *      jQuery adds/removes info-open on .offcanvas__info and
 *      overlay-open on .offcanvas__overlay.
 *   2. meanmenu — runs on #mobile-menu for viewports ≤1199 px, injects
 *      its toggle into .mobile-menu inside the offcanvas, used for
 *      accordion sub-menu expansion (no sub-menus on this site).
 *
 * Tests focus on the offcanvas pattern since that's the primary mobile
 * navigation entry point.
 */

import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

test.describe('mobile offcanvas sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('.sidebar__toggle hamburger is visible on mobile viewport', async ({ page }) => {
    // .header__hamburger.d-xl-none is shown at < 1200 px (Pixel 5 = 393 px)
    const hamburger = page.locator('.header__hamburger');
    await expect(hamburger).toBeVisible();
    const toggle = page.locator('.sidebar__toggle');
    await expect(toggle).toBeVisible();
  });

  test('clicking .sidebar__toggle opens the offcanvas sidebar', async ({ page }) => {
    const toggle = page.locator('.sidebar__toggle');
    const sidebar = page.locator('.offcanvas__info');

    // Initial state: sidebar closed (no info-open class)
    await expect(sidebar).not.toHaveClass(/info-open/);

    await toggle.click();

    // After click: info-open added by jQuery sidebar__toggle handler
    await expect(sidebar).toHaveClass(/info-open/);
  });

  test('overlay becomes active when sidebar opens', async ({ page }) => {
    const toggle = page.locator('.sidebar__toggle');
    await toggle.click();
    await expect(page.locator('.offcanvas__overlay')).toHaveClass(/overlay-open/);
  });

  test('clicking close button closes the sidebar', async ({ page }) => {
    const toggle = page.locator('.sidebar__toggle');
    const sidebar = page.locator('.offcanvas__info');

    await toggle.click();
    await expect(sidebar).toHaveClass(/info-open/);

    // Close via the ✕ button inside the sidebar
    await page.locator('.offcanvas__close button').click();
    await expect(sidebar).not.toHaveClass(/info-open/);
    await expect(page.locator('.offcanvas__overlay')).not.toHaveClass(/overlay-open/);
  });

  test('clicking the overlay closes the sidebar', async ({ page }) => {
    const toggle = page.locator('.sidebar__toggle');
    const sidebar = page.locator('.offcanvas__info');

    await toggle.click();
    await expect(sidebar).toHaveClass(/info-open/);

    await page.locator('.offcanvas__overlay').click();
    await expect(sidebar).not.toHaveClass(/info-open/);
  });

  test('sidebar contains nav links for all 5 pages', async ({ page }) => {
    const toggle = page.locator('.sidebar__toggle');
    await toggle.click();

    const sidebar = page.locator('.offcanvas__info');
    await expect(sidebar).toHaveClass(/info-open/);

    // meanmenu clones the nav into .mean-nav inside .mobile-menu; OR the
    // offcanvas shows the mean-nav items. Check for the 5 expected hrefs.
    for (const href of ['index.html', 'features.html', 'pricing.html', 'integrations.html', 'security.html']) {
      // mean-nav items or original nav (meanmenu may clone into .mean-nav)
      const link = page.locator(`.mean-nav a[href="${href}"], nav#mobile-menu a[href="${href}"]`).first();
      await expect(link).toHaveCount(1);
    }
  });

  test('offcanvas CTA "Open FocusJam" links to app.focusjam.com', async ({ page }) => {
    await page.locator('.sidebar__toggle').click();
    const cta = page.locator('.offcanvas__contact a.pp-theme-btn');
    await expect(cta).toContainText('Open FocusJam');
    await expect(cta).toHaveAttribute('href', 'https://app.focusjam.com');
  });
});
