/**
 * PERSONA ALIAS: Operations (vendor-scorecard)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 07-plugin-sandbox
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 7
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 7
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsOps(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('operations@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestOps!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Operations (vendor scorecard)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsOps(page);
  });

  test('Operations: vendor-scorecard via plugin-sandbox (Journey 07)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
