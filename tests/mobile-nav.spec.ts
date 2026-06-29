/**
 * mobile-nav.spec.ts — Mobile navigation toggle behavior.
 *
 * Forces the Pixel 5 viewport so the hamburger toggle is visible.
 *
 * Verifies:
 *   - .nav-toggle is visible on mobile
 *   - Clicking toggle opens #site-nav: aria-expanded → "true", .is-open added
 *   - Body scroll lock (overflow: hidden) is applied when nav opens
 *   - Clicking toggle again closes nav: aria-expanded → "false", .is-open removed
 *   - Body overflow is cleared when nav closes
 *   - Clicking a nav link while open closes the nav
 */

import { test, expect, devices } from '@playwright/test';

// Force mobile viewport for the entire file regardless of the active project
test.use({ ...devices['Pixel 5'] });

test.describe('mobile nav toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('.nav-toggle is visible on mobile viewport', async ({ page }) => {
    const toggle = page.locator('.nav-toggle');
    await expect(toggle).toBeVisible();
  });

  test('clicking toggle opens the nav', async ({ page }) => {
    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#site-nav');

    // Initial state
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).not.toHaveClass(/is-open/);

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toHaveClass(/is-open/);
  });

  test('body scroll is locked when nav is open', async ({ page }) => {
    const toggle = page.locator('.nav-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const overflow = await page.evaluate(
      () => document.body.style.overflow,
    );
    expect(overflow).toBe('hidden');
  });

  test('clicking toggle again closes the nav', async ({ page }) => {
    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#site-nav');

    // Open
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Close
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).not.toHaveClass(/is-open/);
  });

  test('body scroll is restored when nav is closed', async ({ page }) => {
    const toggle = page.locator('.nav-toggle');

    await toggle.click(); // open
    await toggle.click(); // close

    const overflow = await page.evaluate(
      () => document.body.style.overflow,
    );
    expect(overflow).toBe('');
  });

  test('clicking a nav link closes the nav', async ({ page }) => {
    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#site-nav');

    await toggle.click();
    await expect(nav).toHaveClass(/is-open/);

    // Click the Features link (a safe same-origin page)
    const featuresLink = nav.locator('a[href="/features.html"]');
    await featuresLink.click();

    // After navigation the toggle should be back to collapsed
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).not.toHaveClass(/is-open/);
  });
});
