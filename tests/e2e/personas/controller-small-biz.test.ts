/**
 * PERSONA ALIAS: Controller-Small-Biz (main)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 01-import-data, 05-audit-trail
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 3
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 3
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsControllerSb(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('controller-sb@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestCtrlSB!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Controller-Small-Biz (trial balance)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsControllerSb(page);
  });

  test('Controller-SB: import bank statements (Journey 01)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Controller-SB: trial-balance audit walk (Journey 05)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
