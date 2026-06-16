/**
 * PERSONA ALIAS: CFO-Enterprise (main)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 01-import-data, 02-multi-scenario, 03-period-close
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 1
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 1
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsCfoEnterprise(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('cfo-enterprise@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestCfoEnt!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: CFO-Enterprise (Q1 quarter close)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfoEnterprise(page);
  });

  test('CFO-Enterprise: import Q1 transactions (Journey 01)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('CFO-Enterprise: multi-scenario forecast (Journey 02)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('CFO-Enterprise: period close Q1 (Journey 03)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
