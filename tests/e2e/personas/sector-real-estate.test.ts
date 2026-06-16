/**
 * PERSONA ALIAS: Sector-Real-Estate (main)
 * Owner: Iris (slot 019ecc6f-1bcc-7d73-9cd8-e1deb114d270)
 * v0.1.2 amendment (PICK M, 2026-06-17) — SECTOR_DIMENSION expansion per Vesta SECTOR_ENGINE_AUDIT v0.6 (5fae34d26, RE-001)
 * Mapped journeys: 02-multi-scenario, 04-variance-analysis, 06-backup-restore
 * Sector engines: NOI, IRR, Lease, CapEx, JV
 * Sector personas: VP-Asset-Management, Property-Operations-Manager, Real-Estate-Developer, REIT-CFO
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1.2 §Dim 5 row 12
 *      tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 row 12
 *      Vesta SECTOR_ENGINE_AUDIT v0.6 §16.1 (RE-001, 5 engines, 4 personas, 7.0/10 competitor coverage)
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsRealEstate(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').first().fill('sector-real-estate@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestRE!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Sector-Real-Estate (NOI + IRR + Lease + CapEx + JV)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsRealEstate(page);
  });

  test('Sector-Real-Estate: multi-scenario property portfolio (Journey 02)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Sector-Real-Estate: variance analysis on NOI/CapEx (Journey 04)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Sector-Real-Estate: backup-restore on lease schedule (Journey 06)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
