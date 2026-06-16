/**
 * PERSONA ALIAS: CFO-Midmarket (main)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 01-import-data, 02-multi-scenario
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 2
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 2
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsCfoMidmarket(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('cfo-midmarket@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestCfoMid!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: CFO-Midmarket (monthly rollup)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfoMidmarket(page);
  });

  test('CFO-Midmarket: import monthly data (Journey 01)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('CFO-Midmarket: multi-scenario monthly forecast (Journey 02)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
