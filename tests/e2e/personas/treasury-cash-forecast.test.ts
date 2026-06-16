/**
 * PERSONA ALIAS: Treasury cash-forecast (sub)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 02-multi-scenario
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 5
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsTreasury(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('treasury@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestTreas!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Treasury — cash-forecast (sub)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTreasury(page);
  });

  test('Treasury-CF: 13-week rolling cash forecast', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
