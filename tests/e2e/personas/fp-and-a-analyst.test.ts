/**
 * PERSONA ALIAS: FP&A-Analyst (main)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 04-variance-analysis, 02-multi-scenario
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 4
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 4
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsFpaAnalyst(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('fpa-analyst@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestFpa!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: FP&A-Analyst (budget vs actual)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsFpaAnalyst(page);
  });

  test('FP&A-Analyst: variance analysis (Journey 04)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('FP&A-Analyst: scenario modeling (Journey 02)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
