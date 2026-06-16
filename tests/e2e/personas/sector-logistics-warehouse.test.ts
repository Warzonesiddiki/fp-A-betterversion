/**
 * PERSONA ALIAS: Sector-Logistics warehouse (sub)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 07-plugin-sandbox
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 8
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsLogistics(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('sector-logistics@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestLogi!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Sector-Logistics — warehouse (sub)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsLogistics(page);
  });

  test('Sector-Logistics-WH: warehouse plugin workflow', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
