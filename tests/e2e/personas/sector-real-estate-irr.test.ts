/**
 * PERSONA ALIAS: Sector-Real-Estate-IRR (sub-persona drill-down)
 * Owner: Iris (slot 019ecc6f-1bcc-7d73-9cd8-e1deb114d270)
 * v0.1.2 amendment (PICK M, 2026-06-17) — sub-persona for IRR engine (per-sector deep dive)
 * Mapped journeys: 04-variance-analysis
 * Sector engine: IRR (Internal Rate of Return) — Real-Estate-Developer / REIT-CFO primary use
 * See: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1.2 §Dim 5 row 12.1
 *      Vesta SECTOR_ENGINE_AUDIT v0.6 §16.1 (IRR engine, NOI/IRR/IRR-derived metrics)
 */
import { test, expect, type Page } from '@playwright/test';

async function signInAsRealEstateIRR(page: Page): Promise<void> {
  await page.goto('/');
  await page
    .locator('input[type="email"]')
    .first()
    .fill('sector-real-estate-irr@finplan-test.local');
  await page.locator('input[type="password"]').first().fill('TestRE-IRR!2026');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Persona: Sector-Real-Estate-IRR (Real-Estate-Developer + REIT-CFO)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsRealEstateIRR(page);
  });

  test('Sector-Real-Estate-IRR: IRR variance analysis (Journey 04)', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });
});
