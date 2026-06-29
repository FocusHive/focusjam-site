/**
 * pricing.spec.ts — Pricing page functionality.
 *
 * Verifies:
 *   - Four plan tiers (Free, Solo, Team, Enterprise) are present
 *   - Annual billing is the default headline; monthly is revealed by toggling
 *   - Clicking the billing toggle flips aria-checked and the [hidden] attribute
 *   - After the [hidden] { display: none !important } fix (styles.css), toggling
 *     also visually hides the non-active price (not just the DOM attribute)
 *   - The comparison table renders with all five column headers
 */

import { test, expect, type Page } from '@playwright/test';

// The <input> is pointer-covered by .billing-toggle-track — click the label.
async function clickBillingToggle(page: Page) {
  await page.locator('label.billing-toggle').click();
}

test.describe('pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing.html');
  });

  test('shows four pricing tiers: Free, Solo, Team, Enterprise', async ({ page }) => {
    const tiers = page.locator('.pricing-tier-name');
    await expect(tiers).toHaveCount(4);
    await expect(tiers.nth(0)).toHaveText('Free');
    await expect(tiers.nth(1)).toHaveText('Solo');
    await expect(tiers.nth(2)).toHaveText('Team');
    await expect(tiers.nth(3)).toHaveText('Enterprise');
  });

  test('annual billing is the default: checkbox checked, aria-checked true, monthly carries [hidden]', async ({ page }) => {
    const toggle = page.locator('#billing-cycle');
    await expect(toggle).toBeChecked();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Annual containers should NOT have [hidden] (visible by default)
    const annualPrice = page.locator('.price-display.price-annual').first();
    const annualHidden = await annualPrice.evaluate((el) => el.hasAttribute('hidden'));
    expect(annualHidden, 'annual price must not have [hidden] on load').toBe(false);

    // Monthly containers start with [hidden] attribute
    const monthlyPrice = page.locator('.price-display.price-monthly').first();
    const monthlyHidden = await monthlyPrice.evaluate((el) => el.hasAttribute('hidden'));
    expect(monthlyHidden, 'monthly price must carry [hidden] on load').toBe(true);
  });

  test('annual Solo price is $12 (default headline)', async ({ page }) => {
    // Solo is the 2nd card (index 1) — Free is first
    const soloAnnual = page
      .locator('.pricing-card')
      .nth(1)
      .locator('.price-annual .price-number');
    await expect(soloAnnual).toHaveText('$12');
  });

  test('annual Team price is $18 (default headline)', async ({ page }) => {
    // Team is the 3rd card (index 2)
    const teamAnnual = page
      .locator('.pricing-card')
      .nth(2)
      .locator('.price-annual .price-number');
    await expect(teamAnnual).toHaveText('$18');
  });

  test('toggling to monthly: aria-checked flips to false, annual gets [hidden], monthly loses [hidden] and is visible', async ({ page }) => {
    await clickBillingToggle(page);

    const toggle = page.locator('#billing-cycle');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Annual containers now carry [hidden]
    const annualPrice = page.locator('.price-display.price-annual').first();
    const annualHidden = await annualPrice.evaluate((el) => el.hasAttribute('hidden'));
    expect(annualHidden, 'annual price must carry [hidden] after switching to monthly').toBe(true);

    // Annual price is visually hidden ([hidden] { display: none !important } fix)
    await expect(annualPrice).not.toBeVisible();

    // Monthly containers lose [hidden] and are visible
    const monthlyPrice = page.locator('.price-display.price-monthly').first();
    const monthlyHidden = await monthlyPrice.evaluate((el) => el.hasAttribute('hidden'));
    expect(monthlyHidden, 'monthly price must not have [hidden] after switching to monthly').toBe(false);
    await expect(monthlyPrice).toBeVisible();
  });

  test('monthly Solo price is $16', async ({ page }) => {
    await clickBillingToggle(page);

    const soloMonthly = page
      .locator('.pricing-card')
      .nth(1)
      .locator('.price-monthly .price-number');
    await expect(soloMonthly).toHaveText('$16');
  });

  test('monthly Team price is $24', async ({ page }) => {
    await clickBillingToggle(page);

    const teamMonthly = page
      .locator('.pricing-card')
      .nth(2)
      .locator('.price-monthly .price-number');
    await expect(teamMonthly).toHaveText('$24');
  });

  test('toggling back to annual restores aria-checked to true', async ({ page }) => {
    const toggle = page.locator('#billing-cycle');
    await clickBillingToggle(page); // → monthly
    await clickBillingToggle(page); // → annual

    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    const annualPrice = page.locator('.price-display.price-annual').first();
    const annualHidden = await annualPrice.evaluate((el) => el.hasAttribute('hidden'));
    expect(annualHidden, 'annual price must not have [hidden] after toggling back to annual').toBe(false);
  });

  test('comparison table renders with five column headers: Feature, Free, Solo, Team, Enterprise', async ({ page }) => {
    const table = page.locator('table.compare-table');
    await expect(table).toBeVisible();

    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(5);
    await expect(headers.nth(0)).toHaveText('Feature');
    await expect(headers.nth(1)).toHaveText('Free');
    await expect(headers.nth(2)).toHaveText('Solo');
    await expect(headers.nth(3)).toHaveText('Team');
    await expect(headers.nth(4)).toHaveText('Enterprise');
  });

  test('comparison table has data rows', async ({ page }) => {
    const bodyRows = page.locator('table.compare-table tbody tr');
    const count = await bodyRows.count();
    expect(count).toBeGreaterThan(10);
  });
});
