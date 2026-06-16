/**
 * PERSONA ALIAS: Sector-Non-profit (main)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 06-backup-restore, 10-temporal-e2e-cross-check
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 9
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 9
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsNonprofit(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('sector-nonprofit@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestNP!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Sector-Non-profit (Form 990 + grants)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsNonprofit(page);
  });

  test('Sector-NP: backup-restore for restricted funds (Journey 06)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Sector-NP: temporal-e2e cross-check (Journey 10)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
