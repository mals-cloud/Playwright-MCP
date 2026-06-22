/**
 * HOVERS — https://the-internet.herokuapp.com/hovers
 *
 * Page structure (repeated × 3):
 *   <div class="figure">
 *     <img class="portrait" src="/img/avatar-blank.jpg" alt="User Avatar">
 *     <div class="figcaption">          ← hidden until hover
 *       <h5>name: user1</h5>
 *       <a href="/users/1">View profile</a>
 *     </div>
 *   </div>
 *
 * Locator strategies used:
 *   Primary    — locator('.figure')              [CSS class — only stable hook on the cards]
 *   Images     — getByAltText('User Avatar')     [alt-text — semantic, accessibility-first]
 *   Captions   — locator('.figcaption')          [CSS class scoped inside .figure]
 *   Links      — getByRole('link', {name:…})     [role + name inside each card]
 *
 * Why CSS class for the card containers?
 *   The .figure divs have no IDs and no ARIA roles; .figure is the only
 *   stable CSS hook available.  getByAltText is used for the images because
 *   all three share the same alt text — it's the correct semantic locator
 *   even when it returns multiple elements.
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ── screenshot helper ────────────────────────────────────────────────────────
const SCREENSHOT_DIR = path.join('test-results', 'screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function captureOnFailure(page: Page, testInfo: { status?: string; expectedStatus?: string; title: string }) {
  if (testInfo.status !== testInfo.expectedStatus) {
    const safe = testInfo.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `hovers-${safe}.png`),
      fullPage: true,
    });
  }
}

// ── summary tracking ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const strategyUsed = 'locator(".figure") + getByAltText + getByRole("link")';

// ── tests ────────────────────────────────────────────────────────────────────
test.describe('Hovers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hovers');
  });

  test.afterEach(async ({ page }, testInfo) => {
    testInfo.status === testInfo.expectedStatus ? passed++ : failed++;
    await captureOnFailure(page, testInfo);
  });

  // 1. Verify initial page state ─────────────────────────────────────────────
  test('page heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Hovers' })).toBeVisible();
  });

  test('exactly 3 user profile cards are present', async ({ page }) => {
    // CSS class selector — the only structural handle on the card wrappers.
    await expect(page.locator('.figure')).toHaveCount(3);
  });

  test('exactly 3 portrait images are present via getByAltText', async ({ page }) => {
    // getByAltText is the semantically correct locator for images;
    // all three share alt="User Avatar" which makes it ideal for a count check.
    await expect(page.getByAltText('User Avatar')).toHaveCount(3);
  });

  test('all 3 portrait images are visible before any hover', async ({ page }) => {
    const images = page.getByAltText('User Avatar');
    await expect(images.nth(0)).toBeVisible();
    await expect(images.nth(1)).toBeVisible();
    await expect(images.nth(2)).toBeVisible();
  });

  test('captions are hidden before hover', async ({ page }) => {
    // .figcaption elements exist in the DOM but are display:none until hover.
    // toBeHidden() correctly matches both display:none and visibility:hidden.
    const captions = page.locator('.figcaption');
    await expect(captions.nth(0)).toBeHidden();
    await expect(captions.nth(1)).toBeHidden();
    await expect(captions.nth(2)).toBeHidden();
  });

  // 2. Hover reveals caption — one test per card ─────────────────────────────
  test('hover on card 1 reveals caption with "name: user1"', async ({ page }) => {
    const card1 = page.locator('.figure').nth(0);

    // hover() dispatches a mouseover event on the element centre-point,
    // which triggers the CSS :hover rule that makes .figcaption visible.
    await card1.hover();

    const caption1 = card1.locator('.figcaption');
    await expect(caption1).toBeVisible();
    await expect(caption1).toContainText('name: user1');
  });

  test('hover on card 2 reveals caption with "name: user2"', async ({ page }) => {
    const card2 = page.locator('.figure').nth(1);
    await card2.hover();

    const caption2 = card2.locator('.figcaption');
    await expect(caption2).toBeVisible();
    await expect(caption2).toContainText('name: user2');
  });

  test('hover on card 3 reveals caption with "name: user3"', async ({ page }) => {
    const card3 = page.locator('.figure').nth(2);
    await card3.hover();

    const caption3 = card3.locator('.figcaption');
    await expect(caption3).toBeVisible();
    await expect(caption3).toContainText('name: user3');
  });

  // 3. Caption contains "View profile" link — one test per card ──────────────
  test('hover on card 1 reveals "View profile" link', async ({ page }) => {
    const card1 = page.locator('.figure').nth(0);
    await card1.hover();

    // getByRole('link') scoped inside the card — resolves the <a> by its
    // accessible role and visible text, independent of the href value.
    const link = card1.getByRole('link', { name: 'View profile' });
    await expect(link).toBeVisible();
  });

  test('hover on card 2 reveals "View profile" link', async ({ page }) => {
    const card2 = page.locator('.figure').nth(1);
    await card2.hover();

    await expect(card2.getByRole('link', { name: 'View profile' })).toBeVisible();
  });

  test('hover on card 3 reveals "View profile" link', async ({ page }) => {
    const card3 = page.locator('.figure').nth(2);
    await card3.hover();

    await expect(card3.getByRole('link', { name: 'View profile' })).toBeVisible();
  });

  // 4. "View profile" links point to correct user URLs ───────────────────────
  test('card 1 "View profile" href points to /users/1', async ({ page }) => {
    const card1 = page.locator('.figure').nth(0);
    await card1.hover();

    await expect(card1.getByRole('link', { name: 'View profile' }))
      .toHaveAttribute('href', '/users/1');
  });

  test('card 2 "View profile" href points to /users/2', async ({ page }) => {
    const card2 = page.locator('.figure').nth(1);
    await card2.hover();

    await expect(card2.getByRole('link', { name: 'View profile' }))
      .toHaveAttribute('href', '/users/2');
  });

  test('card 3 "View profile" href points to /users/3', async ({ page }) => {
    const card3 = page.locator('.figure').nth(2);
    await card3.hover();

    await expect(card3.getByRole('link', { name: 'View profile' }))
      .toHaveAttribute('href', '/users/3');
  });

  // 5. Clicking "View profile" navigates to the user page ───────────────────
  test('clicking "View profile" on card 1 navigates to /users/1', async ({ page }) => {
    const card1 = page.locator('.figure').nth(0);
    await card1.hover();
    await card1.getByRole('link', { name: 'View profile' }).click();

    await expect(page).toHaveURL(/\/users\/1/);
  });

  test('clicking "View profile" on card 2 navigates to /users/2', async ({ page }) => {
    const card2 = page.locator('.figure').nth(1);
    await card2.hover();
    await card2.getByRole('link', { name: 'View profile' }).click();

    await expect(page).toHaveURL(/\/users\/2/);
  });

  test('clicking "View profile" on card 3 navigates to /users/3', async ({ page }) => {
    const card3 = page.locator('.figure').nth(2);
    await card3.hover();
    await card3.getByRole('link', { name: 'View profile' }).click();

    await expect(page).toHaveURL(/\/users\/3/);
  });
});

// ── console summary ──────────────────────────────────────────────────────────
test.afterAll(() => {
  const total = passed + failed;
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                HOVERS — TEST SUMMARY                    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Feature         : Hovers                               ║`);
  console.log(`║  Total Tests     : ${String(total).padEnd(36)}║`);
  console.log(`║  ✅ Passed        : ${String(passed).padEnd(36)}║`);
  console.log(`║  ❌ Failed        : ${String(failed).padEnd(36)}║`);
  console.log(`║  Locator Strategy: ${strategyUsed.padEnd(36)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
});
