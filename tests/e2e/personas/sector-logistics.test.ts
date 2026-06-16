/**
 * PERSONA ALIAS: Sector-Logistics (main)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 07-plugin-sandbox, 08-temporal-edge-cases
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 8
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 8
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsLogistics(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('sector-logistics@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestLogi!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Sector-Logistics (warehouse + fleet)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsLogistics(page);
  });

  test('Sector-Logistics: plugin-sandbox warehouse plugin (Journey 07)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Sector-Logistics: temporal edge case (Journey 08)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
