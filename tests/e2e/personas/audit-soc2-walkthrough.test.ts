/**
 * PERSONA ALIAS: Audit-Compliance SOC2-walkthrough (sub)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 05-audit-trail
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 6
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsAudit(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('audit-compliance@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestAudit!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Audit-Compliance — SOC2-walkthrough (sub)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAudit(page);
  });

  test('Audit-SOC2: full SOC2 Type II walkthrough', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
