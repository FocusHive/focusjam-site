/**
 * public-surface.spec.ts: the public marketing site must stay a pure
 * marketing site.
 *
 * - It never links to the application hostnames (the app is private and
 *   reachable only over the private network).
 * - It never names internal infrastructure or the technology stack.
 */

import { test, expect } from '@playwright/test';

const allPages = [
  '/',
  '/features.html',
  '/pricing.html',
  '/integrations.html',
  '/security.html',
  '/contact.html',
  '/404.html',
];

const FORBIDDEN_HOSTS = /(app|join|meet|rtc|api|admin|mcp|agent|turn)\.focusjam\.com/i;
const FORBIDDEN_TERMS =
  /\b(livekit|keycloak|ziti|argocd|kubernetes|k8s|talos|sops|buildkit|key vault|whisper|qwen|kokoro|turnstile|cloudflare)\b/i;

test.describe('public surface hygiene', () => {
  for (const url of allPages) {
    test(`no application hostnames in markup on ${url}`, async ({ page }) => {
      const response = await page.goto(url);
      const html = (await response?.text()) ?? '';
      expect(html).not.toMatch(FORBIDDEN_HOSTS);
    });

    test(`no internal stack names in visible copy on ${url}`, async ({ page }) => {
      await page.goto(url);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toMatch(FORBIDDEN_TERMS);
    });
  }

  test('contact page exposes a labelled demo request form', async ({ page }) => {
    await page.goto('/contact.html');
    await expect(page.getByLabel('Your name')).toBeVisible();
    await expect(page.getByLabel('Work email')).toBeVisible();
    await expect(page.getByRole('button', { name: /request a demo/i })).toBeVisible();
  });
});
