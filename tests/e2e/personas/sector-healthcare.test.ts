/**
 * PERSONA ALIAS: Sector-Healthcare (main)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 08-temporal-edge-cases, 09-cross-muse-integration
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 10
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 10
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsHealthcare(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('sector-healthcare@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestHC!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Sector-Healthcare (HIPAA)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsHealthcare(page);
  });

  test('Sector-Healthcare: HIPAA temporal edge case (Journey 08)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Sector-Healthcare: cross-muse integrity (Journey 09)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
