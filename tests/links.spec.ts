/**
 * links.spec.ts — Internal link integrity.
 *
 * Crawls every page, collects internal hrefs, and asserts:
 *   - Each internal file path returns HTTP 200
 *   - Known section anchor IDs exist in the DOM on the correct pages
 *
 * External links (https://, mailto:) are skipped intentionally.
 * Relative hrefs (e.g. "index.html") are normalised to absolute paths
 * ("/index.html") before the HTTP check.
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

// Section IDs that should exist on specific pages
const knownAnchors: Record<string, string[]> = {
  '/features.html': [
    'participation',
    'triggers',
    'activities',
    'blueprints',
    'commands',
    'recap',
    'personalize',
  ],
};

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
      // Skip external links and special protocols
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#')
      ) {
        continue;
      }

      // Strip fragment
      const withoutFragment = href.split('#')[0];
      if (!withoutFragment) continue;

      // Normalise relative hrefs to absolute paths
      const normalized = withoutFragment.startsWith('/')
        ? withoutFragment
        : `/${withoutFragment}`;

      internalPaths.add(normalized);
    }
  }

  expect(internalPaths.size, 'No internal paths were collected').toBeGreaterThan(0);

  for (const path of internalPaths) {
    const response = await request.get(`http://localhost:4173${path}`);
    expect(
      response.status(),
      `Expected ${path} to return 200, got ${response.status()}`,
    ).toBe(200);
  }
});

for (const [pagePath, ids] of Object.entries(knownAnchors)) {
  test(`section anchor IDs exist on ${pagePath}`, async ({ page }) => {
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
