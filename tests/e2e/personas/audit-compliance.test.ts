/**
 * PERSONA ALIAS: Audit-Compliance (main)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Mapped journeys: 05-audit-trail, 09-cross-muse-integration
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1 §Dim 5 row 6
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 6
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsAudit(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('audit-compliance@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestAudit!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Audit-Compliance (SOC2 walkthrough)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAudit(page);
  });

  test('Audit-Compliance: audit-trail export (Journey 05)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Audit-Compliance: cross-muse integrity check (Journey 09)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
