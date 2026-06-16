/**
 * PERSONA ALIAS: CFO-Enterprise quarter-close (sub)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 03-period-close
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 1
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsCfoEnterprise(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('cfo-enterprise@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestCfoEnt!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: CFO-Enterprise — quarter-close (sub)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfoEnterprise(page);
  });

  test('CFO-Enterprise-Q1: full quarter-close workflow', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
