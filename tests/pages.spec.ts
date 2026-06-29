/**
 * pages.spec.ts — Per-page structural checks for the Cloudly-template site.
 *
 * Verifies:
 *   - Each page loads (HTTP 200)
 *   - Exactly one <h1>
 *   - <title> is non-empty and contains "FocusJam"
 *   - meta description present (all pages except 404)
 *   - 404 carries noindex robots tag
 *   - Footer year span (#footer-year) is populated with a 4-digit year
 *   - No uncaught JS errors on load (CDN resource failures are tolerated)
 */

import { test, expect } from '@playwright/test';

interface PageDef {
  url: string;
  hasDescription: boolean;
}

const pages: PageDef[] = [
  { url: '/', hasDescription: true },
  { url: '/features.html', hasDescription: true },
  { url: '/pricing.html', hasDescription: true },
  { url: '/integrations.html', hasDescription: true },
  { url: '/security.html', hasDescription: true },
  { url: '/404.html', hasDescription: false },
];

// Error messages that are benign and should not count as failures.
// Covers CDN resource load failures (offline CI) and browser extension noise.
function isBenignError(msg: string): boolean {
  return (
    msg.includes('cdn.jsdelivr.net') ||
    msg.includes('Failed to load resource') ||
    msg.includes('net::ERR_') ||
    msg.includes('favicon') ||
    msg.includes('ResizeObserver')
  );
}

for (const { url, hasDescription } of pages) {
  test.describe(`page ${url}`, () => {
    test('returns HTTP 200', async ({ page }) => {
      const response = await page.goto(url);
      expect(response?.status()).toBe(200);
    });

    test('has exactly one <h1>', async ({ page }) => {
      await page.goto(url);
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test('has a non-empty <title> containing "FocusJam"', async ({ page }) => {
      await page.goto(url);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
      expect(title).toContain('FocusJam');
    });

    if (hasDescription) {
      test('has a non-empty meta description', async ({ page }) => {
        await page.goto(url);
        const content = await page
          .locator('meta[name="description"]')
          .getAttribute('content');
        expect(content?.trim().length).toBeGreaterThan(0);
      });
    } else {
      test('404 carries noindex robots tag', async ({ page }) => {
        await page.goto(url);
        const robots = await page
          .locator('meta[name="robots"]')
          .getAttribute('content');
        expect(robots).toContain('noindex');
      });
    }

    test('footer #footer-year span has a valid 4-digit year', async ({ page }) => {
      await page.goto(url);
      // The inline script `document.getElementById('footer-year').textContent = new Date().getFullYear()`
      // runs synchronously at end-of-body before DOMContentLoaded completes.
      const yearSpan = page.locator('#footer-year');
      await expect(yearSpan).toHaveCount(1);
      const text = await yearSpan.textContent();
      expect(text?.trim()).toMatch(/^\d{4}$/);
    });

    test('no uncaught JS errors on load', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !isBenignError(msg.text())) {
          errors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => {
        if (!isBenignError(err.message)) {
          errors.push(err.message);
        }
      });

      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');

      expect(errors, `Console errors on ${url}: ${errors.join(' | ')}`).toHaveLength(0);
    });
  });
}
