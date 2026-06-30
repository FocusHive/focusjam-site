/**
 * jammers.spec.ts — "Meet your AI Jammers" persona-card section.
 *
 * Asserts that:
 *   - The #jammers section exists on features.html.
 *   - Exactly 4 persona cards are rendered.
 *   - Each card contains a persona image that loads without error.
 *   - Each card shows a persona name and role.
 *   - The rename affordance chip is present on every card.
 *   - The section heading is visible at both desktop and mobile viewports.
 */

import { test, expect } from '@playwright/test';

test.describe('features page — jammers persona section', () => {
  test.beforeEach(async ({ page }) => {
    // page.goto waits for the load event; no explicit waitForLoadState needed.
    await page.goto('/features.html');
  });

  test('#jammers section exists and is visible', async ({ page }) => {
    const section = page.locator('#jammers');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
  });

  test('section heading "Pick a vibe. Rename them anything." is present', async ({ page }) => {
    const heading = page.locator('#jammers h2');
    await expect(heading).toContainText('Rename them anything');
  });

  test('exactly 4 persona cards are rendered', async ({ page }) => {
    await expect(page.locator('#jammers .fj-persona-card')).toHaveCount(4);
  });

  test('all 4 persona images are present with non-empty alt and src', async ({ page }) => {
    const imgs = page.locator('#jammers .fj-persona-avatar img');
    await expect(imgs).toHaveCount(4);

    for (const img of await imgs.all()) {
      const alt = await img.getAttribute('alt');
      expect(alt?.trim().length, 'persona image alt is empty').toBeGreaterThan(0);
      const src = await img.getAttribute('src');
      expect(src?.trim().length, 'persona image src is empty').toBeGreaterThan(0);
    }
  });

  test('all 4 persona images load without HTTP error', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (res) => {
      if (res.url().includes('jammer-persona') && res.status() !== 200)
        failed.push(`${res.url()} → ${res.status()}`);
    });
    // waitUntil networkidle ensures all image requests complete before asserting.
    await page.goto('/features.html', { waitUntil: 'networkidle' });
    expect(failed, `Failed persona image requests: ${failed.join(', ')}`).toHaveLength(0);
  });

  test('each card shows a non-empty persona name', async ({ page }) => {
    const names = page.locator('#jammers .fj-persona-name');
    await expect(names).toHaveCount(4);
    for (const el of await names.all()) {
      const text = await el.textContent();
      expect(text?.trim().length, 'persona name is empty').toBeGreaterThan(0);
    }
  });

  test('each card shows a non-empty persona role', async ({ page }) => {
    const roles = page.locator('#jammers .fj-persona-role');
    await expect(roles).toHaveCount(4);
    for (const el of await roles.all()) {
      const text = await el.textContent();
      expect(text?.trim().length, 'persona role is empty').toBeGreaterThan(0);
    }
  });

  test('each card has a "Rename to anything" chip', async ({ page }) => {
    const chips = page.locator('#jammers .fj-persona-rename');
    await expect(chips).toHaveCount(4);
    for (const chip of await chips.all()) {
      const text = await chip.textContent();
      expect(text?.toLowerCase()).toContain('rename');
    }
  });

  test('the word "Ringi" does not appear anywhere in the section', async ({ page }) => {
    const sectionText = await page.locator('#jammers').textContent();
    expect(sectionText?.toLowerCase()).not.toContain('ringi');
  });
});

test.describe('jammers section — responsive layout', () => {
  // Each test sets its own viewport before navigation so layout is correct on first load.

  test('section heading is visible at desktop (1440×900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/features.html');
    const heading = page.locator('#jammers h2');
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
    await expect(page.locator('#jammers .fj-persona-card')).toHaveCount(4);
  });

  test('section heading is visible at mobile (390×844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/features.html');
    const heading = page.locator('#jammers h2');
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
    await expect(page.locator('#jammers .fj-persona-card')).toHaveCount(4);
  });
});
