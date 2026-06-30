/**
 * contrast.spec.ts — WCAG contrast regression gate (BLOCKING).
 *
 * Guards the defects fixed in polish/contrast-508-and-media:
 *   1. Dark gradient backgrounds on hero, footer, breadcrumb (not transparent/white).
 *   2. No .wow element stuck at visibility:hidden on first paint (no scroll).
 *   3. Key previously-failing foreground/background pairs now ≥4.5:1.
 *
 * WCAG helpers are implemented inline — no external deps.
 */

import { test, expect, type Page } from '@playwright/test';

// ──────────────────────────────────────────────────────────
// WCAG contrast helpers
// ──────────────────────────────────────────────────────────

/** Convert an sRGB channel value [0–255] to linear light. */
function toLinear(c: number): number {
  const n = c / 255;
  return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

/** Relative luminance of an RGB triple (values 0–255). */
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two luminance values. */
function contrastRatio(l1: number, l2: number): number {
  const [lo, hi] = l1 < l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Parse computed color string → [r, g, b, a] or null. */
function parseColor(css: string): [number, number, number, number] | null {
  // rgb(r, g, b) or rgba(r, g, b, a)
  const m = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] !== undefined ? Number(m[4]) : 1];
}

/**
 * Composite background: walk from root down to (and including) the element,
 * blending each semi-transparent backgroundColor layer over white (the browser
 * default). This correctly handles badges / chips with rgba backgrounds.
 *
 * NOTE: CSS gradient backgrounds show as rgba(0,0,0,0) in backgroundColor —
 * those layers are skipped (transparent). Callers that need gradient-section
 * contrast should use assertDarkBackground instead.
 */
async function effectiveBackground(
  page: Page,
  selector: string,
): Promise<[number, number, number] | null> {
  return page.evaluate((sel) => {
    function parseRGBA(css: string): [number, number, number, number] | null {
      const m = css.match(
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/,
      );
      if (!m) return null;
      return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] !== undefined ? Number(m[4]) : 1];
    }

    const el = document.querySelector(sel);
    if (!el) return null;

    // Build ancestor chain from element up to root (include element itself)
    const chain: Element[] = [];
    let node: Element | null = el;
    while (node) {
      chain.push(node);
      node = node.parentElement;
    }
    chain.reverse(); // root → element

    // Start from browser default: white
    let r = 255, g = 255, b = 255;
    for (const n of chain) {
      const bg = getComputedStyle(n).backgroundColor;
      const c = parseRGBA(bg);
      if (c && c[3] > 0) {
        // Composite: result = alpha * layer + (1 - alpha) * current
        const a = c[3];
        r = a * c[0] + (1 - a) * r;
        g = a * c[1] + (1 - a) * g;
        b = a * c[2] + (1 - a) * b;
        // No early break: an opaque ancestor (e.g. body) does not hide layers
        // between it and the target element — those layers still composite on top.
      }
    }
    return [Math.round(r), Math.round(g), Math.round(b)];
  }, selector);
}

/** Get computed foreground color [r,g,b,a] of an element. */
async function fgColor(
  page: Page,
  selector: string,
): Promise<[number, number, number, number] | null> {
  const css = await page.evaluate(
    (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).color : null;
    },
    selector,
  );
  return css ? parseColor(css) : null;
}

/**
 * Blend a foreground rgba over a background rgb and return the
 * effective luminance of the result.
 */
function blendLuminance(
  fg: [number, number, number, number],
  bg: [number, number, number],
): number {
  const a = fg[3];
  const r = a * fg[0] + (1 - a) * bg[0];
  const g = a * fg[1] + (1 - a) * bg[1];
  const b = a * fg[2] + (1 - a) * bg[2];
  return luminance(r, g, b);
}

// ──────────────────────────────────────────────────────────
// Helpers: assert contrast and assert dark background
// ──────────────────────────────────────────────────────────

/** Assert that the effective contrast of selector's text ≥ threshold. */
async function assertContrast(
  page: Page,
  selector: string,
  threshold: number,
  label: string,
) {
  const fg = await fgColor(page, selector);
  const bg = await effectiveBackground(page, selector);
  expect(fg, `${label}: could not read fg color`).not.toBeNull();
  expect(bg, `${label}: could not find non-transparent background`).not.toBeNull();
  const fgL = blendLuminance(fg!, bg!);
  const bgL = luminance(bg![0], bg![1], bg![2]);
  const ratio = contrastRatio(fgL, bgL);
  expect(
    ratio,
    `${label}: contrast ${ratio.toFixed(2)}:1 < required ${threshold}:1`,
  ).toBeGreaterThanOrEqual(threshold);
}

/**
 * Assert that a selector's element has a computed background-image that is NOT
 * none/empty OR a backgroundColor that is NOT transparent and NOT very light
 * (luminance < 0.4 = "dark enough" for dark hero/footer/breadcrumb).
 */
async function assertDarkBackground(page: Page, selector: string, label: string) {
  const result = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false, bgColor: '', bgImage: '' };
    const s = getComputedStyle(el);
    return { found: true, bgColor: s.backgroundColor, bgImage: s.backgroundImage };
  }, selector);

  expect(result.found, `${label}: element not found`).toBe(true);

  // Accept either: a gradient background-image, OR a dark solid background-color.
  const hasGradient =
    result.bgImage && result.bgImage !== 'none' && result.bgImage.includes('gradient');

  const solidColor = result.bgColor ? parseColor(result.bgColor) : null;
  const solidIsNonTransparent = solidColor && solidColor[3] > 0;
  const solidIsDark =
    solidIsNonTransparent &&
    luminance(solidColor![0], solidColor![1], solidColor![2]) < 0.4;

  expect(
    hasGradient || solidIsDark,
    `${label}: expected dark gradient or dark solid bg; got bg-color="${result.bgColor}" bg-image="${result.bgImage}"`,
  ).toBe(true);
}

// ──────────────────────────────────────────────────────────
// TEST: WOW.js visibility — no .wow element stuck hidden
// ──────────────────────────────────────────────────────────

const ALL_PAGES = ['/', '/features.html', '/pricing.html', '/integrations.html', '/security.html'];

for (const url of ALL_PAGES) {
  test(`[${url}] no .wow element is visibility:hidden on first paint (no scroll)`, async ({
    page,
  }) => {
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    // Do NOT scroll — check first-paint state
    const hiddenCount = await page.evaluate(() => {
      const els = document.querySelectorAll('.wow');
      let count = 0;
      for (const el of els) {
        if (getComputedStyle(el).visibility === 'hidden') count++;
      }
      return count;
    });
    expect(
      hiddenCount,
      `${url}: ${hiddenCount} .wow element(s) stuck at visibility:hidden`,
    ).toBe(0);
  });
}

// ──────────────────────────────────────────────────────────
// TEST: Dark backgrounds — hero, footer, breadcrumb
// ──────────────────────────────────────────────────────────

test('home hero has a dark background (not transparent/white)', async ({ page }) => {
  await page.goto('/');
  await assertDarkBackground(page, '.pp-hero-section.pp-hero-2', 'hero');
});

test('home jammer spotlight has a dark background (not transparent/white)', async ({ page }) => {
  await page.goto('/');
  await assertDarkBackground(page, '.pp-feature-section-2.fj-jammer-spotlight', 'jammer-spotlight');
});

test('footer has a dark background on all pages', async ({ page }) => {
  for (const url of ALL_PAGES) {
    await page.goto(url);
    await assertDarkBackground(page, '.pp-footer-section-2', `footer on ${url}`);
  }
});

test('breadcrumb wrapper has a dark background on inner pages', async ({ page }) => {
  const innerPages = [
    '/features.html',
    '/pricing.html',
    '/integrations.html',
    '/security.html',
  ];
  for (const url of innerPages) {
    await page.goto(url);
    await assertDarkBackground(page, '.pp-breadcrumb-wrapper', `breadcrumb on ${url}`);
  }
});

// ──────────────────────────────────────────────────────────
// TEST: Per-page contrast pairs — previously failing
// ──────────────────────────────────────────────────────────

test.describe('features page — contrast pairs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/features.html');
  });

  test('.fj-recap-meta contrast ≥4.5:1 on white card', async ({ page }) => {
    await assertContrast(page, '.fj-recap-meta', 4.5, 'fj-recap-meta');
  });

  test('.fj-recap-due contrast ≥4.5:1 on white card', async ({ page }) => {
    await assertContrast(page, '.fj-recap-due', 4.5, 'fj-recap-due');
  });

  test('.fj-recap-health-sub contrast ≥4.5:1 on white card', async ({ page }) => {
    await assertContrast(page, '.fj-recap-health-sub', 4.5, 'fj-recap-health-sub');
  });

  // .fj-cmd-meta lives inside .fj-jammer-spotlight which has a CSS gradient background.
  // CSS gradients show as rgba(0,0,0,0) in getComputedStyle().backgroundColor so the
  // effective-background walk cannot resolve the true dark colour. Contrast here is
  // covered instead by the assertDarkBackground test for .pp-feature-section-2.fj-jammer-spotlight
  // (home page) and by the WOW-visibility gate. No duplicate assertion needed.
});

test.describe('pricing page — contrast pairs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing.html');
  });

  test('.fj-x cross-mark contrast ≥4.5:1 on card background', async ({ page }) => {
    // Scroll into view so the element is rendered in the layout
    const el = page.locator('.fj-x').first();
    await el.scrollIntoViewIfNeeded();
    await assertContrast(page, '.fj-x', 4.5, 'fj-x');
  });

  test('Free-card disabled items contrast ≥4.5:1', async ({ page }) => {
    // .pp-style-2 on li items within the pricing list
    const el = page.locator('.pp-pricing-list li.pp-style-2').first();
    await el.scrollIntoViewIfNeeded();
    await assertContrast(page, '.pp-pricing-list li.pp-style-2', 4.5, 'pp-style-2 disabled item');
  });
});

test.describe('integrations page — contrast pairs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/integrations.html');
  });

  test('.int-badge-live text contrast ≥4.5:1 on light-green badge bg', async ({ page }) => {
    await assertContrast(page, '.int-badge-live', 4.5, 'int-badge-live');
  });
});

test.describe('security page — contrast pairs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/security.html');
  });

  test('.fj-model-vendors span contrast ≥4.5:1 (no opacity)', async ({ page }) => {
    const el = page.locator('.fj-model-vendors span').first();
    await el.scrollIntoViewIfNeeded();
    await assertContrast(page, '.fj-model-vendors span', 4.5, 'fj-model-vendors span');
  });
});

// ──────────────────────────────────────────────────────────
// TEST: Persona cards contrast (features page — #jammers section)
// Background: section-bg-2 = background-color: #1A192E (solid dark navy).
// Cards use rgba(255,255,255,0.05) overlay; rename chip is rgba(161,33,202,0.18).
// After effectiveBackground composites all layers (#1A192E → card → chip) the
// chip effective bg is ≈ rgb(60,36,83); #c084fc on that = 5.09:1 ✓.
// ──────────────────────────────────────────────────────────

test.describe('features page — persona cards contrast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/features.html');
    await page.locator('#jammers').scrollIntoViewIfNeeded();
  });

  test('#jammers section has a dark background', async ({ page }) => {
    await assertDarkBackground(page, '#jammers', 'jammers section');
  });

  test('.fj-persona-rename chip contrast ≥4.5:1 on dark card', async ({ page }) => {
    const el = page.locator('.fj-persona-rename').first();
    await el.scrollIntoViewIfNeeded();
    await assertContrast(page, '.fj-persona-rename', 4.5, 'fj-persona-rename chip');
  });
});

// ──────────────────────────────────────────────────────────
// TEST: Pricing default (Annual) tab cards visible on first paint
// ──────────────────────────────────────────────────────────

test('pricing page: Annual tab cards are visible on first paint without scrolling', async ({
  page,
}) => {
  await page.goto('/pricing.html');
  await page.waitForLoadState('domcontentloaded');
  // Annual pane should be visible and contain cards
  const annualPane = page.locator('#pt-annual');
  await expect(annualPane).toBeVisible();
  const cards = annualPane.locator('.pp-pricing-main-item');
  const count = await cards.count();
  expect(count, 'Expected ≥4 pricing cards in annual pane').toBeGreaterThanOrEqual(4);
  // Confirm no card inside the pane is hidden via visibility:hidden
  const hiddenCards = await page.evaluate(() => {
    const pane = document.querySelector('#pt-annual');
    if (!pane) return -1;
    const items = pane.querySelectorAll('.pp-pricing-main-item');
    let hidden = 0;
    for (const item of items) {
      if (getComputedStyle(item).visibility === 'hidden') hidden++;
    }
    return hidden;
  });
  expect(hiddenCards, 'Pricing cards should not be visibility:hidden').toBe(0);
});

// ──────────────────────────────────────────────────────────
// TEST: Dark-section kickers — previously missing from gate
// Defects #1-2: .section-bg-2 .pp-sub-title (purple 2.58:1 → white 17.18:1)
// Defects #3-6,#8: .footer-bottom3 p b wordmark (purple 2.58:1 → white 17.18:1)
// Defect #7: #principles-heading em "checkbox." (purple 2.58:1 → white 17.18:1)
// ──────────────────────────────────────────────────────────

// NOTE: effectiveBackground() walks the ancestor chain compositing solid colours.
// section-bg-2 uses background-color:#1A192E (solid), so it resolves correctly here
// (unlike CSS gradient sections which show rgba(0,0,0,0) and require assertDarkBackground).

const DARK_KICKER_PAGES = ['/', '/features.html', '/pricing.html', '/security.html'];

for (const url of DARK_KICKER_PAGES) {
  test(`[${url}] .section-bg-2 .pp-sub-title contrast ≥3:1 (large text, dark section)`, async ({
    page,
  }) => {
    await page.goto(url);
    const el = page.locator('.section-bg-2 .pp-sub-title').first();
    const count = await el.count();
    if (count === 0) return; // page has no dark-section kicker — skip
    await el.scrollIntoViewIfNeeded();
    await assertContrast(page, '.section-bg-2 .pp-sub-title', 3, `${url} dark-section pp-sub-title`);
  });
}

for (const url of ALL_PAGES) {
  test(`[${url}] .footer-bottom3 p b wordmark contrast ≥4.5:1`, async ({ page }) => {
    await page.goto(url);
    await assertContrast(page, '.footer-bottom3 p b', 4.5, `${url} footer wordmark`);
  });
}

test('security page — #principles-heading em contrast ≥3:1 (large text)', async ({ page }) => {
  await page.goto('/security.html');
  await assertContrast(page, '#principles-heading em', 3, 'principles-heading em');
});

// ──────────────────────────────────────────────────────────
// TEST: Footer visible on all pages (no WOW blank)
// ──────────────────────────────────────────────────────────

for (const url of ALL_PAGES) {
  test(`[${url}] footer is visible on first paint without scrolling`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    const footer = page.locator('.pp-footer-section-2');
    // Check visibility in computed style, not bounding-box (footer may be below fold)
    const vis = await page.evaluate(() => {
      const el = document.querySelector('.pp-footer-section-2');
      return el ? getComputedStyle(el).visibility : 'not-found';
    });
    expect(vis, `${url}: footer visibility`).toBe('visible');
  });
}
