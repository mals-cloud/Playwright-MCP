/**
 * CHECKBOXES — https://the-internet.herokuapp.com/checkboxes
 *
 * Page structure (no IDs on the inputs, no labels):
 *   <div id="checkboxes">
 *     <input type="checkbox">           ← checkbox 1, UNCHECKED by default
 *     checkbox 1                        ← adjacent text node
 *     <input type="checkbox" checked>   ← checkbox 2, CHECKED by default
 *     checkbox 2
 *   </div>
 *
 * Locator strategy chosen: getByRole('checkbox')
 *   • The inputs carry no id, name, or label — role is the only semantic
 *     handle available.
 *   • .nth(0) / .nth(1) address each checkbox by its DOM position inside
 *     the container, which is stable for this two-checkbox page.
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ── screenshot helper (called in afterEach on failure) ──────────────────────
const SCREENSHOT_DIR = path.join('test-results', 'screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function captureOnFailure(page: Page, testInfo: { status?: string; expectedStatus?: string; title: string }) {
  if (testInfo.status !== testInfo.expectedStatus) {
    const safe = testInfo.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `checkboxes-${safe}.png`),
      fullPage: true,
    });
  }
}

// ── summary tracking ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const strategyUsed = 'getByRole("checkbox") + nth()';

// ── tests ───────────────────────────────────────────────────────────────────
test.describe('Checkboxes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkboxes');
  });

  test.afterEach(async ({ page }, testInfo) => {
    testInfo.status === testInfo.expectedStatus ? passed++ : failed++;
    await captureOnFailure(page, testInfo);
  });

  // 1. Verify initial states ─────────────────────────────────────────────────
  test('checkbox 1 is unchecked by default', async ({ page }) => {
    // getByRole('checkbox') — semantic role is the recommended locator for
    // interactive controls when no label or test-id is present.
    const cb1 = page.getByRole('checkbox').nth(0);

    await expect(cb1).toBeVisible();
    await expect(cb1).toBeEnabled();
    await expect(cb1).not.toBeChecked();
  });

  test('checkbox 2 is checked by default', async ({ page }) => {
    const cb2 = page.getByRole('checkbox').nth(1);

    await expect(cb2).toBeVisible();
    await expect(cb2).toBeEnabled();
    await expect(cb2).toBeChecked();
  });

  test('page contains exactly 2 checkboxes', async ({ page }) => {
    // Counting ensures no hidden checkboxes skew the nth() indexing.
    await expect(page.getByRole('checkbox')).toHaveCount(2);
  });

  // 2. Check checkbox 1 and verify ──────────────────────────────────────────
  test('can check checkbox 1 and assert toBeChecked()', async ({ page }) => {
    const cb1 = page.getByRole('checkbox').nth(0);

    await cb1.check();
    // Primary assertion required by spec
    await expect(cb1).toBeChecked();
  });

  // 3. Uncheck checkbox 2 and verify ────────────────────────────────────────
  test('can uncheck checkbox 2 and assert not.toBeChecked()', async ({ page }) => {
    const cb2 = page.getByRole('checkbox').nth(1);

    await cb2.uncheck();
    await expect(cb2).not.toBeChecked();
  });

  // 4. Full check → uncheck → recheck cycle on each checkbox ────────────────
  test('checkbox 1: check → uncheck → re-check cycle', async ({ page }) => {
    const cb1 = page.getByRole('checkbox').nth(0);

    // Step 1: check
    await cb1.check();
    await expect(cb1).toBeChecked();

    // Step 2: uncheck
    await cb1.uncheck();
    await expect(cb1).not.toBeChecked();

    // Step 3: re-check — final state assertion
    await cb1.check();
    await expect(cb1).toBeChecked();
  });

  test('checkbox 2: uncheck → check → uncheck cycle', async ({ page }) => {
    const cb2 = page.getByRole('checkbox').nth(1);

    // Step 1: uncheck (starts checked)
    await cb2.uncheck();
    await expect(cb2).not.toBeChecked();

    // Step 2: check
    await cb2.check();
    await expect(cb2).toBeChecked();

    // Step 3: uncheck — final state assertion
    await cb2.uncheck();
    await expect(cb2).not.toBeChecked();
  });

  // 5. Both checkboxes can be checked simultaneously ─────────────────────────
  test('both checkboxes can be checked at the same time', async ({ page }) => {
    const cb1 = page.getByRole('checkbox').nth(0);
    const cb2 = page.getByRole('checkbox').nth(1);

    await cb1.check();
    await cb2.check();

    await expect(cb1).toBeChecked();
    await expect(cb2).toBeChecked();
  });

  // 6. Both checkboxes can be unchecked simultaneously ──────────────────────
  test('both checkboxes can be unchecked at the same time', async ({ page }) => {
    const cb1 = page.getByRole('checkbox').nth(0);
    const cb2 = page.getByRole('checkbox').nth(1);

    await cb1.uncheck();
    await cb2.uncheck();

    await expect(cb1).not.toBeChecked();
    await expect(cb2).not.toBeChecked();
  });
});

// ── console summary ─────────────────────────────────────────────────────────
test.afterAll(() => {
  const total = passed + failed;
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              CHECKBOXES — TEST SUMMARY                  ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Feature         : Checkboxes                           ║`);
  console.log(`║  Total Tests     : ${String(total).padEnd(36)}║`);
  console.log(`║  ✅ Passed        : ${String(passed).padEnd(36)}║`);
  console.log(`║  ❌ Failed        : ${String(failed).padEnd(36)}║`);
  console.log(`║  Locator Strategy: ${strategyUsed.padEnd(36)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
});
