/**
 * DRAG AND DROP — https://the-internet.herokuapp.com/drag_and_drop
 *
 * Page structure:
 *   <div id="columns">
 *     <div id="column-a" draggable="true"><header>A</header></div>
 *     <div id="column-b" draggable="true"><header>B</header></div>
 *   </div>
 *
 * Known issue: this page uses a jQuery UI sortable widget that fires
 * custom drag events.  Playwright's native dragTo() dispatches HTML5
 * drag-event sequences which jQuery UI intercepts correctly in Chromium
 * but may be inconsistent across browsers.
 *
 * Strategy:
 *   Primary  — locator.dragTo()   (Playwright high-level API)
 *   Fallback — mouse.move/down/up (low-level pointer API, browser-agnostic)
 *
 * Locator strategy chosen: locator('css') with ID selectors (#column-a, #column-b)
 *   • Both drag targets have stable IDs — CSS ID selectors are the most
 *     concise and direct handles for uniquely identified draggable elements.
 *   • header child selector is used for text assertions because the header
 *     element holds the visible label text.
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
      path: path.join(SCREENSHOT_DIR, `drag-drop-${safe}.png`),
      fullPage: true,
    });
  }
}

// ── summary tracking ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const strategyUsed = 'locator("css") #column-a / #column-b';

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Perform a drag using the low-level mouse API.
 * Used as a fallback / explicit test to cover mouse.move/down/up path.
 */
async function dragViaMouseApi(page: Page, sourceSelector: string, targetSelector: string) {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);

  const srcBox = await source.boundingBox();
  const tgtBox = await target.boundingBox();

  if (!srcBox || !tgtBox) throw new Error('Bounding box unavailable for drag source or target');

  const srcX = srcBox.x + srcBox.width / 2;
  const srcY = srcBox.y + srcBox.height / 2;
  const tgtX = tgtBox.x + tgtBox.width / 2;
  const tgtY = tgtBox.y + tgtBox.height / 2;

  // Move to source, hold mouse down, glide to target, release
  await page.mouse.move(srcX, srcY);
  await page.mouse.down();
  // Intermediate steps help jQuery UI register the drag gesture
  await page.mouse.move(srcX + (tgtX - srcX) / 4, srcY + (tgtY - srcY) / 4, { steps: 5 });
  await page.mouse.move(srcX + (tgtX - srcX) / 2, srcY + (tgtY - srcY) / 2, { steps: 5 });
  await page.mouse.move(tgtX, tgtY, { steps: 10 });
  await page.mouse.up();
}

// ── tests ────────────────────────────────────────────────────────────────────
test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/drag_and_drop');
  });

  test.afterEach(async ({ page }, testInfo) => {
    testInfo.status === testInfo.expectedStatus ? passed++ : failed++;
    await captureOnFailure(page, testInfo);
  });

  // 1. Verify initial page state ─────────────────────────────────────────────
  test('initial state: column A header reads "A"', async ({ page }) => {
    // CSS ID + child selector — most direct path to the header text inside
    // a uniquely identified draggable column.
    await expect(page.locator('#column-a header')).toHaveText('A');
  });

  test('initial state: column B header reads "B"', async ({ page }) => {
    await expect(page.locator('#column-b header')).toHaveText('B');
  });

  test('both draggable columns are visible', async ({ page }) => {
    await expect(page.locator('#column-a')).toBeVisible();
    await expect(page.locator('#column-b')).toBeVisible();
  });

  // 2. dragTo() — Playwright high-level drag API ──────────────────────────────
  test('dragTo(): dragging A onto B swaps the labels', async ({ page }) => {
    // locator.dragTo() is the preferred Playwright API; it handles the full
    // HTML5 drag-event sequence (dragstart → dragover → drop → dragend).
    const colA = page.locator('#column-a');
    const colB = page.locator('#column-b');

    await colA.dragTo(colB);

    // After the swap the DOM order changes: what was column-a is now second
    // and shows "B"; what was column-b is first and shows "A".
    await expect(page.locator('#columns div:nth-child(1) header')).toHaveText('B');
    await expect(page.locator('#columns div:nth-child(2) header')).toHaveText('A');
  });

  test('dragTo(): drag B onto A swaps them back', async ({ page }) => {
    // Perform first swap
    await page.locator('#column-a').dragTo(page.locator('#column-b'));
    // Perform reverse swap — columns should return to A, B order
    await page.locator('#column-b').dragTo(page.locator('#column-a'));

    await expect(page.locator('#columns div:nth-child(1) header')).toHaveText('A');
    await expect(page.locator('#columns div:nth-child(2) header')).toHaveText('B');
  });

  // 3. mouse.move/down/up — low-level fallback path ──────────────────────────
  test('mouse API: dragging A onto B via mouse.move/down/up swaps labels', async ({ page }) => {
    // Explicit mouse API test — required by spec as the retry strategy.
    // Also useful in environments where dragTo() is flaky for custom widgets.
    await dragViaMouseApi(page, '#column-a', '#column-b');

    // Allow the jQuery UI transition to complete
    await page.waitForTimeout(300);

    await expect(page.locator('#columns div:nth-child(1) header')).toHaveText('B');
    await expect(page.locator('#columns div:nth-child(2) header')).toHaveText('A');
  });

  test('mouse API: dragging B onto A via mouse.move/down/up swaps labels', async ({ page }) => {
    // Dragging B (index 1) leftward onto A (index 0) inserts B before A in
    // the sortable DOM order — the result is [B, A] for both drag directions
    // when starting from the same initial state.
    await dragViaMouseApi(page, '#column-b', '#column-a');
    await page.waitForTimeout(300);

    await expect(page.locator('#columns div:nth-child(1) header')).toHaveText('B');
    await expect(page.locator('#columns div:nth-child(2) header')).toHaveText('A');
  });

  // 4. dragTo() with retry fallback wrapped in a single test ─────────────────
  test('dragTo() with automatic mouse-API fallback if labels do not swap', async ({ page }) => {
    const colA = page.locator('#column-a');
    const colB = page.locator('#column-b');

    // Attempt primary strategy
    await colA.dragTo(colB);
    await page.waitForTimeout(200);

    const firstHeader = await page.locator('#columns div:nth-child(1) header').textContent();

    if (firstHeader !== 'B') {
      // Primary failed — reload and retry with mouse API
      await page.reload();
      await dragViaMouseApi(page, '#column-a', '#column-b');
      await page.waitForTimeout(300);
    }

    await expect(page.locator('#columns div:nth-child(1) header')).toHaveText('B');
    await expect(page.locator('#columns div:nth-child(2) header')).toHaveText('A');
  });
});

// ── console summary ──────────────────────────────────────────────────────────
test.afterAll(() => {
  const total = passed + failed;
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║             DRAG AND DROP — TEST SUMMARY                ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Feature         : Drag and Drop                        ║`);
  console.log(`║  Total Tests     : ${String(total).padEnd(36)}║`);
  console.log(`║  ✅ Passed        : ${String(passed).padEnd(36)}║`);
  console.log(`║  ❌ Failed        : ${String(failed).padEnd(36)}║`);
  console.log(`║  Locator Strategy: ${strategyUsed.padEnd(36)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
});
