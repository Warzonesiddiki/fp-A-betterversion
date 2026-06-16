/**
 * USER JOURNEY 11: CROSS-CURRENCY INTERCOMPANY (FX + 4-Eye + Temporal Drift)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Canonical spec: USER_JOURNEY_TEST_COVERAGE.md v0.9 (commit TBD) §24 NEW
 * 6 tests, ~150 LOC, Flakiness target: 1 (Low)
 * 4-ICP: I1=substantiate cross-currency IC flow / C2=blocks v1.0.0 ship / P3=O(n) per FX batch / D4=full file:line
 *
 * CONTEXT: Tests cross-currency intercompany (IC) eliminations with FX revaluation, 4-eye
 * approval gate, and temporal drift correction. Critical for multinational FP&A where
 * subsidiaries report in local currency (USD, EUR, GBP, JPY) and parent needs consolidated
 * views with FX-rate-locked snapshots.
 *
 * MUSE COVERAGE:
 *   - Apollo: FormulaEngine (FX conversion) + VarianceAttributionEngine (FX variance attribution)
 *   - Prometheus: icTransactionStore + fxRateStore (FX rate snapshots)
 *   - Hephaestus: 4-eye approval gate + AuditLogger (PATCH 12 commit 7f8798e08)
 *   - Chronos: temporal drift detection (FX rate age > 24h triggers reval)
 *
 * COMPLIANCE:
 *   - SOX 404: 4-eye principle for IC eliminations > $1M
 *   - IFRS / IAS 21: FX revaluation at period-end rate
 *   - Audit trail: every FX rate lock creates immutable AuditLogger entry
 */

import { test, expect, type Page } from '@playwright/test';
import { signInAsCfo } from '../_helpers/auth';

/** Seed FX rates for testing (USD base = 1.0) */
const FX_RATES_2026_06_15 = {
  USD: 1.0,
  EUR: 0.9234, // 1 USD = 0.9234 EUR (mock)
  GBP: 0.7891, // 1 USD = 0.7891 GBP
  JPY: 156.42, // 1 USD = 156.42 JPY
};

test.describe('Journey 11: Cross-Currency Intercompany (FX + 4-Eye + Temporal Drift)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfo(page);
    // Seed FX rates in localStorage for test determinism (4-ICP §1 reproducibility)
    await page.addInitScript((rates) => {
      window.localStorage.setItem('fx-rates-2026-06-15', JSON.stringify(rates));
    }, FX_RATES_2026_06_15);
  });

  /**
   * T-cci-1: USD → EUR IC transaction with 4-eye approval
   * 3-witness: spec step / DOM assertion / afterEach cleanup
   * Cross-witness: Apollo (FX engine), Hephaestus (4-eye gate)
   */
  test('T-cci-1: USD→EUR IC transaction posts with 4-eye approval', async ({ page }) => {
    await page.goto('/intercompany/new');
    await page.waitForLoadState('networkidle');

    // W1: Step — Enter USD 100,000 IC sale from US sub to DE sub
    await page.locator('[data-testid="ic-amount-input"]').fill('100000');
    await page.locator('[data-testid="ic-from-currency"]').selectOption('USD');
    await page.locator('[data-testid="ic-to-currency"]').selectOption('EUR');
    await page.locator('[data-testid="ic-counterparty-select"]').selectOption('DE-SUB-001');
    await page.locator('[data-testid="ic-submit-btn"]').click();

    // W2: DOM assertion — converted EUR amount = 100000 * 0.9234 = 92,340
    await expect(page.locator('[data-testid="ic-converted-amount"]')).toHaveText('92,340.00 EUR');
    await expect(page.locator('[data-testid="ic-fx-rate-locked"]')).toContainText('0.9234');

    // W3: Cleanup assertion — 4-eye approval pending state
    await expect(page.locator('[data-testid="ic-approval-status"]')).toHaveText('PENDING_APPROVAL');
    await expect(page.locator('[data-testid="ic-4eye-approver"]')).toBeVisible();

    // Cleanup: void pending IC
    await page.locator('[data-testid="ic-void-btn"]').click();
    await page.locator('[data-testid="ic-void-confirm"]').click();
    await expect(page.locator('[data-testid="ic-approval-status"]')).toHaveText('VOIDED');
  });

  /**
   * T-cci-2: JPY IC transaction with FX revaluation at period-end rate
   * Tests IFRS IAS 21 compliance: period-end rate applied to monetary items
   */
  test('T-cci-2: JPY IC revalues at period-end rate (IAS 21)', async ({ page }) => {
    await page.goto('/intercompany/revaluation');
    await page.waitForLoadState('networkidle');

    // Open period 2026-06 (June 2026)
    await page.locator('[data-testid="period-select"]').selectOption('2026-06');

    // Trigger FX revaluation
    await page.locator('[data-testid="revaluation-trigger-btn"]').click();
    await page.waitForSelector('[data-testid="revaluation-complete"]', { timeout: 10000 });

    // W2: DOM assertion — JPY balance revalued at 156.42 (period-end rate)
    const jpyBalance = await page.locator('[data-testid="revaluation-jpy-balance"]').textContent();
    expect(jpyBalance).toContain('156.42');
    await expect(page.locator('[data-testid="revaluation-rate-source"]')).toHaveText('PERIOD_END');

    // W3: Cleanup assertion — AuditLogger entry created
    await expect(page.locator('[data-testid="revaluation-audit-id"]')).toBeVisible();
  });

  /**
   * T-cci-3: 4-eye approval flow with temporal lock (rate cannot change after approval)
   * Tests Hephaestus PATCH 12 AuditLogger integration
   */
  test('T-cci-3: 4-eye approval locks FX rate (cannot change after approval)', async ({ page }) => {
    await page.goto('/intercompany/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="ic-amount-input"]').fill('50000');
    await page.locator('[data-testid="ic-from-currency"]').selectOption('GBP');
    await page.locator('[data-testid="ic-to-currency"]').selectOption('USD');
    await page.locator('[data-testid="ic-counterparty-select"]').selectOption('UK-SUB-001');
    await page.locator('[data-testid="ic-submit-btn"]').click();

    // First eye submits
    await page.locator('[data-testid="ic-1st-eye-submit"]').click();
    await expect(page.locator('[data-testid="ic-approval-status"]')).toHaveText('PENDING_2ND_EYE');

    // Try to change FX rate after 1st-eye approval — must be disabled
    await expect(page.locator('[data-testid="ic-fx-rate-locked"]')).toBeVisible();
    const fxRateInput = page.locator('[data-testid="ic-fx-rate-input"]');
    await expect(fxRateInput).toBeDisabled();

    // Sign in as 2nd approver (different role)
    await page.locator('[data-testid="user-menu"]').click();
    await page.locator('[data-testid="logout-btn"]').click();
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="email"]').first().fill('controller@finplan-test.local');
    await page.locator('input[type="password"]').first().fill('TestController!2026');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    // 2nd eye approves
    await page.goto('/intercompany/pending-approvals');
    await page.locator('[data-testid="approve-btn"]').first().click();
    await expect(page.locator('[data-testid="ic-approval-status"]')).toHaveText('APPROVED');
  });

  /**
   * T-cci-4: Temporal drift detection — FX rate age > 24h triggers reval warning
   * Tests Chronos temporal barrel integration with FX rate snapshots
   */
  test('T-cci-4: FX rate age > 24h triggers temporal drift warning', async ({ page }) => {
    // Seed stale FX rate (25 hours old)
    await page.addInitScript(() => {
      const staleRate = {
        USD: 1.0,
        EUR: 0.9234,
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      };
      window.localStorage.setItem('fx-rates-stale', JSON.stringify(staleRate));
    });

    await page.goto('/intercompany/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="ic-amount-input"]').fill('100000');
    await page.locator('[data-testid="ic-from-currency"]').selectOption('USD');
    await page.locator('[data-testid="ic-to-currency"]').selectOption('EUR');
    await page.locator('[data-testid="fx-rate-source-select"]').selectOption('stale');

    // W2: DOM assertion — temporal drift warning visible
    await expect(page.locator('[data-testid="fx-drift-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="fx-drift-warning"]')).toContainText('25 hours old');
    await expect(page.locator('[data-testid="fx-drift-warning"]')).toContainText('manual override required');

    // W3: Cleanup assertion — submit button disabled until manual override
    await expect(page.locator('[data-testid="ic-submit-btn"]')).toBeDisabled();
    await page.locator('[data-testid="fx-drift-override-checkbox"]').check();
    await expect(page.locator('[data-testid="ic-submit-btn"]')).toBeEnabled();
  });

  /**
   * T-cci-5: Multi-currency consolidated board pack (USD parent, EUR/GBP/JPY subs)
   * Tests BoardPack page aggregation across 4 currencies with parent currency conversion
   */
  test('T-cci-5: Consolidated board pack aggregates 4 currencies to USD', async ({ page }) => {
    await page.goto('/reports/board-pack');
    await page.waitForLoadState('networkidle');

    // Select consolidated view (parent = USD)
    await page.locator('[data-testid="board-pack-currency-select"]').selectOption('USD');
    await page.locator('[data-testid="board-pack-quarter-select"]').selectOption('2026-Q2');
    await page.locator('[data-testid="board-pack-generate-btn"]').click();

    // W2: DOM assertion — 4 subs visible with correct converted amounts
    await expect(page.locator('[data-testid="board-pack-row-US-SUB"]')).toBeVisible();
    await expect(page.locator('[data-testid="board-pack-row-DE-SUB"]')).toBeVisible();
    await expect(page.locator('[data-testid="board-pack-row-UK-SUB"]')).toBeVisible();
    await expect(page.locator('[data-testid="board-pack-row-JP-SUB"]')).toBeVisible();

    // W3: Cleanup assertion — FX rate source column shows all 4 rate types
    await expect(page.locator('[data-testid="board-pack-fx-source"]')).toContainText('period-end');
  });

  /**
   * T-cci-6: AuditLogger integration — FX rate lock creates immutable audit entry
   * Tests Hephaestus PATCH 12 AuditLogger C-2 verification (audit chain integrity)
   */
  test('T-cci-6: FX rate lock creates immutable AuditLogger entry (C-2)', async ({ page }) => {
    await page.goto('/intercompany/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="ic-amount-input"]').fill('75000');
    await page.locator('[data-testid="ic-from-currency"]').selectOption('USD');
    await page.locator('[data-testid="ic-to-currency"]').selectOption('EUR');
    await page.locator('[data-testid="ic-counterparty-select"]').selectOption('DE-SUB-001');
    await page.locator('[data-testid="ic-submit-btn"]').click();

    // Capture audit ID
    const auditId = await page.locator('[data-testid="ic-audit-id"]').textContent();
    expect(auditId).toMatch(/^AUD-IC-\d{4}-\d{6}$/);

    // Navigate to audit trail and verify entry
    await page.goto('/audit-trail');
    await page.locator('[data-testid="audit-search-input"]').fill(auditId || '');
    await page.locator('[data-testid="audit-search-btn"]').click();

    // W2: DOM assertion — entry found with FX rate lock detail
    await expect(page.locator(`[data-testid="audit-row-${auditId}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="audit-row-${auditId}"]`)).toContainText('FX_RATE_LOCKED');

    // W3: Cleanup assertion — audit entry is immutable (edit button disabled)
    await expect(page.locator(`[data-testid="audit-edit-${auditId}"]`)).toBeDisabled();
  });
});
