/**
 * DROPDOWN — https://the-internet.herokuapp.com/dropdown
 *
 * Page structure:
 *   <select id="dropdown">
 *     <option value=""  disabled selected>Please select an option</option>
 *     <option value="1">Option 1</option>
 *     <option value="2">Option 2</option>
 *   </select>
 *
 * Locator strategies used:
 *   Primary  — getByRole('combobox')  [semantic, accessibility-first]
 *   CSS      — locator('#dropdown')   [ID selector, compact and unambiguous]
 *
 * getByRole('combobox') is preferred: a <select> element has an implicit
 * ARIA role of "combobox", which is browser-exposed and doesn't depend on
 * fragile CSS classes.  The CSS ID selector is included to demonstrate an
 * alternative and for the per-option assertions where CSS is more concise.
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
      path: path.join(SCREENSHOT_DIR, `dropdown-${safe}.png`),
      fullPage: true,
    });
  }
}

// ── summary tracking ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const strategyUsed = 'getByRole("combobox") + locator("#dropdown")';

// ── tests ────────────────────────────────────────────────────────────────────
test.describe('Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dropdown');
  });

  test.afterEach(async ({ page }, testInfo) => {
    testInfo.status === testInfo.expectedStatus ? passed++ : failed++;
    await captureOnFailure(page, testInfo);
  });

  // 1. Verify initial page and element state ─────────────────────────────────
  test('dropdown is visible and enabled', async ({ page }) => {
    // getByRole('combobox') resolves the <select> by its implicit ARIA role —
    // the most semantically stable locator when the element has a stable ID
    // but also a meaningful role.
    const dropdown = page.getByRole('combobox');

    await expect(dropdown).toBeVisible();
    await expect(dropdown).toBeEnabled();
  });

  test('default selected option is the disabled placeholder', async ({ page }) => {
    // CSS #dropdown used here because we need to inspect the :checked option
    // text directly — CSS pseudo-class is more expressive than role for this.
    await expect(page.locator('#dropdown option:checked')).toHaveText('Please select an option');
  });

  test('dropdown contains exactly 3 options', async ({ page }) => {
    await expect(page.locator('#dropdown option')).toHaveCount(3);
  });

  // 2. Select Option 1 and assert ────────────────────────────────────────────
  test('selectOption("Option 1") sets value to "1"', async ({ page }) => {
    const dropdown = page.getByRole('combobox');

    // selectOption by visible text — most readable; matches what a user sees
    await dropdown.selectOption('Option 1');

    // Assert the DOM value attribute, not just visual text
    await expect(dropdown).toHaveValue('1');
  });

  test('selectOption("Option 1") — selected option text is "Option 1"', async ({ page }) => {
    await page.getByRole('combobox').selectOption('Option 1');

    await expect(page.locator('#dropdown option:checked')).toHaveText('Option 1');
  });

  test('selectOption by value "1" — resolves to Option 1', async ({ page }) => {
    // Selecting by value is more robust than text when option text may change.
    await page.locator('#dropdown').selectOption({ value: '1' });

    await expect(page.locator('#dropdown')).toHaveValue('1');
    await expect(page.locator('#dropdown option:checked')).toHaveText('Option 1');
  });

  // 3. Select Option 2 and re-assert ─────────────────────────────────────────
  test('selectOption("Option 2") sets value to "2"', async ({ page }) => {
    const dropdown = page.getByRole('combobox');

    await dropdown.selectOption('Option 2');

    await expect(dropdown).toHaveValue('2');
  });

  test('selectOption("Option 2") — selected option text is "Option 2"', async ({ page }) => {
    await page.getByRole('combobox').selectOption('Option 2');

    await expect(page.locator('#dropdown option:checked')).toHaveText('Option 2');
  });

  test('selectOption by value "2" — resolves to Option 2', async ({ page }) => {
    await page.locator('#dropdown').selectOption({ value: '2' });

    await expect(page.locator('#dropdown')).toHaveValue('2');
    await expect(page.locator('#dropdown option:checked')).toHaveText('Option 2');
  });

  // 4. Switch from Option 1 → Option 2 and re-assert ─────────────────────────
  test('switching from Option 1 to Option 2 updates the value', async ({ page }) => {
    const dropdown = page.getByRole('combobox');

    await dropdown.selectOption('Option 1');
    await expect(dropdown).toHaveValue('1');

    await dropdown.selectOption('Option 2');
    await expect(dropdown).toHaveValue('2');
  });

  test('switching from Option 2 back to Option 1 updates the value', async ({ page }) => {
    const dropdown = page.getByRole('combobox');

    await dropdown.selectOption('Option 2');
    await expect(dropdown).toHaveValue('2');

    await dropdown.selectOption('Option 1');
    await expect(dropdown).toHaveValue('1');
  });

  // 5. Verify the disabled placeholder option cannot be programmatically selected ─
  test('disabled placeholder option has the "disabled" attribute', async ({ page }) => {
    // CSS attribute selector confirms the DOM-level disabled flag.
    // A disabled <option> cannot be selected by the user and is skipped
    // by selectOption() when referenced by index 0.
    const placeholderOption = page.locator('#dropdown option[disabled]');

    await expect(placeholderOption).toHaveCount(1);
    await expect(placeholderOption).toHaveAttribute('disabled');
  });

  test('disabled option has empty value attribute', async ({ page }) => {
    // An empty value="" on the disabled default option is a common pattern;
    // this assertion guards against accidental form submissions with no value.
    const placeholderOption = page.locator('#dropdown option[disabled]');

    await expect(placeholderOption).toHaveAttribute('value', '');
  });

  test('after selecting an option, the disabled placeholder is no longer checked', async ({ page }) => {
    await page.getByRole('combobox').selectOption('Option 1');

    // The disabled placeholder should no longer be the checked option
    await expect(page.locator('#dropdown option[disabled]:checked')).toHaveCount(0);
  });
});

// ── console summary ──────────────────────────────────────────────────────────
test.afterAll(() => {
  const total = passed + failed;
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║               DROPDOWN — TEST SUMMARY                   ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Feature         : Dropdown                             ║`);
  console.log(`║  Total Tests     : ${String(total).padEnd(36)}║`);
  console.log(`║  ✅ Passed        : ${String(passed).padEnd(36)}║`);
  console.log(`║  ❌ Failed        : ${String(failed).padEnd(36)}║`);
  console.log(`║  Locator Strategy: ${strategyUsed.padEnd(36)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
});
