/**
 * pricing.spec.ts — Pricing page functionality.
 *
 * The pricing page uses Bootstrap 5 tabs (not a checkbox toggle):
 *   - #pt-annual-tab  (default active, aria-selected="true")
 *   - #pt-monthly-tab (inactive by default)
 *   - #pt-annual      (tab pane, default visible: show active)
 *   - #pt-monthly     (tab pane, initially hidden)
 *
 * Verifies:
 *   - Annual tab is active by default
 *   - Four tiers (Free / Solo / Team / Enterprise) in the annual pane
 *   - Annual prices: Solo $12, Team $18
 *   - Switching to monthly shows Solo $16, Team $24
 *   - Annual pane is hidden after switching to monthly
 *   - Feature comparison table renders with 5 column headers
 */

import { test, expect, type Page } from '@playwright/test';

async function clickMonthlyTab(page: Page) {
  await page.locator('#pt-monthly-tab').click();
  // Wait for Bootstrap tab transition to complete
  await expect(page.locator('#pt-monthly')).toBeVisible();
}

async function clickAnnualTab(page: Page) {
  await page.locator('#pt-annual-tab').click();
  await expect(page.locator('#pt-annual')).toBeVisible();
}

test.describe('pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing.html');
  });

  // ── Tab default state ──────────────────────────────────────────
  test('annual tab is active by default (aria-selected="true")', async ({ page }) => {
    await expect(page.locator('#pt-annual-tab')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pt-monthly-tab')).toHaveAttribute('aria-selected', 'false');
  });

  test('annual pane is visible and monthly pane is hidden by default', async ({ page }) => {
    await expect(page.locator('#pt-annual')).toBeVisible();
    await expect(page.locator('#pt-monthly')).not.toBeVisible();
  });

  // ── Four tiers in annual pane ──────────────────────────────────
  test('annual pane shows four tiers: Free, Solo, Team, Enterprise', async ({ page }) => {
    const annualPane = page.locator('#pt-annual');
    const tiers = annualPane.locator('.pp-pricing-header h5');
    await expect(tiers).toHaveCount(4);
    await expect(tiers.nth(0)).toHaveText('Free');
    await expect(tiers.nth(1)).toHaveText('Solo');
    await expect(tiers.nth(2)).toHaveText('Team');
    await expect(tiers.nth(3)).toHaveText('Enterprise');
  });

  // ── Annual prices ──────────────────────────────────────────────
  test('annual Solo price is $12', async ({ page }) => {
    const annualPane = page.locator('#pt-annual');
    // Solo is the 2nd card (index 1), after Free
    const soloH2 = annualPane.locator('.pp-pricing-main-item').nth(1).locator('.pp-pricing-header h2');
    await expect(soloH2).toContainText('$12');
  });

  test('annual Team price is $18', async ({ page }) => {
    const annualPane = page.locator('#pt-annual');
    // Team is the 3rd card (index 2)
    const teamH2 = annualPane.locator('.pp-pricing-main-item').nth(2).locator('.pp-pricing-header h2');
    await expect(teamH2).toContainText('$18');
  });

  // ── Tab toggle to monthly ──────────────────────────────────────
  test('switching to monthly: monthly pane visible, annual pane hidden', async ({ page }) => {
    await clickMonthlyTab(page);

    await expect(page.locator('#pt-monthly')).toBeVisible();
    await expect(page.locator('#pt-annual')).not.toBeVisible();
    await expect(page.locator('#pt-monthly-tab')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pt-annual-tab')).toHaveAttribute('aria-selected', 'false');
  });

  test('monthly Solo price is $16', async ({ page }) => {
    await clickMonthlyTab(page);
    const monthlyPane = page.locator('#pt-monthly');
    const soloH2 = monthlyPane.locator('.pp-pricing-main-item').nth(1).locator('.pp-pricing-header h2');
    await expect(soloH2).toContainText('$16');
  });

  test('monthly Team price is $24', async ({ page }) => {
    await clickMonthlyTab(page);
    const monthlyPane = page.locator('#pt-monthly');
    const teamH2 = monthlyPane.locator('.pp-pricing-main-item').nth(2).locator('.pp-pricing-header h2');
    await expect(teamH2).toContainText('$24');
  });

  test('switching back to annual restores annual tab as active', async ({ page }) => {
    await clickMonthlyTab(page);
    await clickAnnualTab(page);

    await expect(page.locator('#pt-annual-tab')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pt-annual')).toBeVisible();
    await expect(page.locator('#pt-monthly')).not.toBeVisible();
  });

  // ── Feature comparison table ───────────────────────────────────
  test('comparison table has 5 column headers: Feature, Free, Solo, Team, Enterprise', async ({ page }) => {
    const table = page.locator('table.fj-compare-table');
    // Scroll into view to trigger WOW.js reveal (it holds visibility:hidden until viewport entry)
    await table.scrollIntoViewIfNeeded();
    await expect(table).toBeVisible({ timeout: 5000 });

    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(5);
    await expect(headers.nth(0)).toHaveText('Feature');
    await expect(headers.nth(1)).toHaveText('Free');
    await expect(headers.nth(2)).toHaveText('Solo');
    await expect(headers.nth(3)).toHaveText('Team');
    await expect(headers.nth(4)).toHaveText('Enterprise');
  });

  test('comparison table has more than 10 body rows', async ({ page }) => {
    await page.locator('table.fj-compare-table').scrollIntoViewIfNeeded();
    const bodyRows = page.locator('table.fj-compare-table tbody tr');
    const count = await bodyRows.count();
    expect(count).toBeGreaterThan(10);
  });
});
