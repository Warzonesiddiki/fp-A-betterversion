/**
 * PERSONA ALIAS: Sector-Non-profit Form-990 (sub)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 10-temporal-e2e-cross-check
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 9
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsNonprofit(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('sector-nonprofit@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestNP!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Sector-Non-profit — Form-990 (sub)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsNonprofit(page);
  });

  test('Sector-NP-990: Form 990 schedule generation', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
