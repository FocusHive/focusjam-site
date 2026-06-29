/**
 * links.spec.ts — Internal link integrity.
 *
 * Crawls every page, collects internal hrefs, and asserts:
 *   - Each internal file path (without fragment) returns HTTP 200
 *   - Known fragment targets exist as elements in the DOM
 *
 * External links (https://, mailto:) are skipped intentionally.
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

// Fragments known to exist on their respective pages (path → id list)
const knownAnchors: Record<string, string[]> = {
  '/': ['product', 'jammer', 'top', 'main'],
  '/features.html': ['participation', 'triggers', 'activities', 'blueprints', 'commands', 'recap', 'personalize', 'main'],
  '/integrations.html': ['main'],
  '/security.html': ['main'],
  '/pricing.html': ['main'],
  '/404.html': ['main'],
};

// Collect all unique internal file paths across the site
test('all internal page paths return HTTP 200', async ({ page, request }) => {
  const internalPaths = new Set<string>();

  for (const pageUrl of allPages) {
    await page.goto(pageUrl);

    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
        .map((a) => a.getAttribute('href') ?? '')
        .filter(Boolean),
    );

    for (const href of hrefs) {
      // Skip external links and mailto/tel
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) {
        continue;
      }

      // Strip fragment to get the file path
      const path = href.split('#')[0];

      if (path && path !== '') {
        // Normalise: treat '/' as a path that should 200
        internalPaths.add(path === '' ? '/' : path);
      }
    }
  }

  // Every collected internal path must return 200
  for (const path of internalPaths) {
    const response = await request.get(`http://localhost:4173${path}`);
    expect(
      response.status(),
      `Expected ${path} to return 200, got ${response.status()}`,
    ).toBe(200);
  }
});

// Verify anchor targets exist in the DOM on their respective pages
for (const [pagePath, ids] of Object.entries(knownAnchors)) {
  test(`anchor targets exist on ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath);
    for (const id of ids) {
      const el = page.locator(`#${id}`);
      await expect(
        el,
        `Expected #${id} to exist on ${pagePath}`,
      ).toHaveCount(1);
    }
  });
}
