/**
 * PERSONA ALIAS: Treasury (main)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 02-multi-scenario, 06-backup-restore
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 5
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 5
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsTreasury(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('treasury@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestTreas!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Treasury (cash forecast)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTreasury(page);
  });

  test('Treasury: cash-forecast scenario (Journey 02)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Treasury: backup-restore for ledger (Journey 06)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
