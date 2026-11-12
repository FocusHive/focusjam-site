/**
 * legal.spec.ts: the Terms of Service and Privacy Policy are published and
 * reachable from every page.
 *
 * A first customer cannot sign without them (FocusHive/focusjam#226), so the
 * suite pins: both pages load, carry an effective date and a contact, cover
 * the clauses a buyer checks first, and every page's footer links to both.
 */

import { test, expect } from '@playwright/test';

const legalPages = [
  {
    url: '/terms.html',
    heading: 'Terms of Service',
    sections: [/Plans, fees and payment/, /Acceptable use/, /Your content/, /Limitation of liability/, /Governing law/],
  },
  {
    url: '/privacy.html',
    heading: 'Privacy Policy',
    sections: [/Information we collect/, /AI processing/, /Retention/, /Your rights/, /Cookies/],
  },
];

const allPages = [
  '/',
  '/features.html',
  '/pricing.html',
  '/integrations.html',
  '/security.html',
  '/contact.html',
  '/terms.html',
  '/privacy.html',
  '/404.html',
];

for (const { url, heading, sections } of legalPages) {
  test.describe(`legal page ${url}`, () => {
    test('loads with its heading, effective date and contact', async ({ page }) => {
      const response = await page.goto(url);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(heading);
      await expect(page.locator('.fj-legal-effective')).toContainText('Effective date:');
      await expect(page.locator('.fj-legal a[href="mailto:hello@focusjam.com"]').first()).toBeVisible();
    });

    test('covers the clauses a buyer reviews', async ({ page }) => {
      await page.goto(url);
      const headings = page.locator('.fj-legal h2');
      for (const section of sections) {
        await expect(headings.filter({ hasText: section })).toHaveCount(1);
      }
    });
  });
}

test.describe('footer legal links', () => {
  for (const url of allPages) {
    test(`footer links to Terms and Privacy on ${url}`, async ({ page }) => {
      await page.goto(url);
      const footer = page.locator('footer');
      await expect(footer.locator('a[href="terms.html"]')).toHaveCount(1);
      await expect(footer.locator('a[href="privacy.html"]')).toHaveCount(1);
    });
  }
});

test('terms and privacy cross-link each other', async ({ page }) => {
  await page.goto('/terms.html');
  await expect(page.locator('.fj-legal a[href="privacy.html"]').first()).toBeVisible();
  await page.goto('/privacy.html');
  await expect(page.locator('.fj-legal a[href="terms.html"]').first()).toBeVisible();
});
