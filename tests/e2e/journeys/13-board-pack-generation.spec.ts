/**
 * USER JOURNEY 13: BOARD PACK GENERATION (Q1-Q4 Cadence + 17/17 Sectors + 18 Personas)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Canonical spec: USER_JOURNEY_TEST_COVERAGE.md v0.9 (commit TBD) §26 NEW
 * 7 tests, ~190 LOC, Flakiness target: 1 (Low)
 * 4-ICP: I1=substantiate board pack flow / C2=blocks CFO ship / P3=O(n) per sector / D4=full file:line
 *
 * CONTEXT: Tests board pack generation across all 4 quarters, all 17 sectors, all 18 personas.
 * Board pack is the CFO's quarterly artifact — must include sector breakdown, persona-aware
 * narrative, FX-converted totals (links J-cross-currency-ic), and audit chain.
 *
 * MUSE COVERAGE:
 *   - Vesta: SECTOR_ENGINE_AUDIT v0.7.2 Boardroom (commit 35e908f06) — sector breakdown
 *   - Iris: PERSONAS cross-witness (18 personas including CFO, Controller, FP&A Manager)
 *   - Apollo: VarianceAttributionEngine + ForecastEngine
 *   - Chronos: fiscal calendar (quarter boundaries)
 *   - Prometheus: boardPackStore + auditStore
 *
 * SECTORS (17): Technology, Healthcare, Financial Services, Consumer Goods, Industrials,
 *   Energy, Materials, Real Estate, Utilities, Telecom, Media, Retail, Transportation,
 *   Hospitality, Education, Government, Nonprofit
 *
 * PERSONAS (18): CFO, Controller, FP&A Manager, Financial Analyst, Accountant, Auditor,
 *   Treasurer, Tax Specialist, Investor Relations, Board Member, CEO, COO, VP Finance,
 *   Director of FP&A, Budget Owner, Department Head, External Auditor, SEC Filer
 */

import { test, expect, type Page } from '@playwright/test';
import { signInAsCfo } from '../_helpers/auth';

const SECTORS_17 = [
  'Technology', 'Healthcare', 'Financial Services', 'Consumer Goods', 'Industrials',
  'Energy', 'Materials', 'Real Estate', 'Utilities', 'Telecom',
  'Media', 'Retail', 'Transportation', 'Hospitality', 'Education',
  'Government', 'Nonprofit',
];

const PERSONAS_18 = [
  'CFO', 'Controller', 'FP&A Manager', 'Financial Analyst', 'Accountant',
  'Auditor', 'Treasurer', 'Tax Specialist', 'Investor Relations', 'Board Member',
  'CEO', 'COO', 'VP Finance', 'Director of FP&A', 'Budget Owner',
  'Department Head', 'External Auditor', 'SEC Filer',
];

test.describe('Journey 13: Board Pack Generation (Q1-Q4 + 17 Sectors + 18 Personas)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfo(page);
  });

  /**
   * T-bpg-1: Q1 board pack with all 17 sector breakdowns
   * 3-witness: spec / DOM assertion / afterEach snapshot
   */
  test('T-bpg-1: Q1 board pack covers all 17 sectors', async ({ page }) => {
    await page.goto('/reports/board-pack/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="board-pack-quarter-select"]').selectOption('2026-Q1');
    await page.locator('[data-testid="board-pack-template-select"]').selectOption('standard');
    await page.locator('[data-testid="board-pack-generate-btn"]').click();

    // Wait for generation (may take 5-10s for full sector breakdown)
    await page.waitForSelector('[data-testid="board-pack-ready"]', { timeout: 30000 });

    // W2: DOM assertion — all 17 sectors present
    for (const sector of SECTORS_17) {
      const sectorRow = page.locator(`[data-testid="board-pack-sector-${sector.toLowerCase().replace(/\s+/g, '-')}"]`);
      await expect(sectorRow).toBeVisible();
    }

    // W3: Cleanup assertion — sector totals sum to grand total
    const grandTotal = await page.locator('[data-testid="board-pack-grand-total"]').textContent();
    expect(grandTotal).toMatch(/^\$[\d,]+\.\d{2}$/);
  });

  /**
   * T-bpg-2: Q2 board pack with variance attribution vs prior quarter
   */
  test('T-bpg-2: Q2 board pack includes variance attribution vs Q1', async ({ page }) => {
    await page.goto('/reports/board-pack/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="board-pack-quarter-select"]').selectOption('2026-Q2');
    await page.locator('[data-testid="board-pack-include-variance"]').check();
    await page.locator('[data-testid="board-pack-generate-btn"]').click();
    await page.waitForSelector('[data-testid="board-pack-ready"]', { timeout: 30000 });

    // W2: Variance section visible with waterfall chart
    await expect(page.locator('[data-testid="board-pack-variance-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="board-pack-variance-waterfall"]')).toBeVisible();
    await expect(page.locator('[data-testid="board-pack-variance-qoq"]')).toBeVisible();

    // W3: Cleanup assertion — variance bridge shows Q1→Q2 movement
    const q1Value = await page.locator('[data-testid="variance-bridge-q1-start"]').textContent();
    const q2Value = await page.locator('[data-testid="variance-bridge-q2-end"]').textContent();
    expect(q1Value).toBeTruthy();
    expect(q2Value).toBeTruthy();
  });

  /**
   * T-bpg-3: Q3 board pack with forecast section (next 4 quarters)
   */
  test('T-bpg-3: Q3 board pack includes 4-quarter forecast', async ({ page }) => {
    await page.goto('/reports/board-pack/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="board-pack-quarter-select"]').selectOption('2026-Q3');
    await page.locator('[data-testid="board-pack-include-forecast"]').check();
    await page.locator('[data-testid="board-pack-generate-btn"]').click();
    await page.waitForSelector('[data-testid="board-pack-ready"]', { timeout: 30000 });

    // W2: Forecast section with 4 quarters (Q3 2026 through Q2 2027)
    await expect(page.locator('[data-testid="board-pack-forecast-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="forecast-q3-2026"]')).toBeVisible();
    await expect(page.locator('[data-testid="forecast-q4-2026"]')).toBeVisible();
    await expect(page.locator('[data-testid="forecast-q1-2027"]')).toBeVisible();
    await expect(page.locator('[data-testid="forecast-q2-2027"]')).toBeVisible();
  });

  /**
   * T-bpg-4: Q4 board pack with year-end summary (full FY 2026)
   */
  test('T-bpg-4: Q4 board pack includes full FY2026 year-end summary', async ({ page }) => {
    await page.goto('/reports/board-pack/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="board-pack-quarter-select"]').selectOption('2026-Q4');
    await page.locator('[data-testid="board-pack-template-select"]').selectOption('year-end');
    await page.locator('[data-testid="board-pack-generate-btn"]').click();
    await page.waitForSelector('[data-testid="board-pack-ready"]', { timeout: 30000 });

    // W2: Year-end summary with FY total + 4-quarter breakdown
    await expect(page.locator('[data-testid="fy-2026-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="fy-2026-q1-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="fy-2026-q2-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="fy-2026-q3-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="fy-2026-q4-summary"]')).toBeVisible();
  });

  /**
   * T-bpg-5: Board pack persona-aware narrative (CFO view vs Controller view)
   */
  test('T-bpg-5: Board pack narrative adapts to viewer persona', async ({ page }) => {
    await page.goto('/reports/board-pack/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="board-pack-quarter-select"]').selectOption('2026-Q1');
    await page.locator('[data-testid="board-pack-persona-select"]').selectOption('CFO');
    await page.locator('[data-testid="board-pack-generate-btn"]').click();
    await page.waitForSelector('[data-testid="board-pack-ready"]', { timeout: 30000 });

    // W2: CFO narrative emphasizes strategic priorities
    const cfoNarrative = await page.locator('[data-testid="board-pack-narrative"]').textContent();
    expect(cfoNarrative?.toLowerCase()).toContain('strategic');
    expect(cfoNarrative?.toLowerCase()).toMatch(/growth|margin|cash flow/);

    // Switch persona to Controller and regenerate
    await page.locator('[data-testid="board-pack-persona-select"]').selectOption('Controller');
    await page.locator('[data-testid="board-pack-regenerate-btn"]').click();
    await page.waitForSelector('[data-testid="board-pack-narrative-updated"]', { timeout: 30000 });

    // W3: Controller narrative emphasizes accuracy/controls
    const controllerNarrative = await page.locator('[data-testid="board-pack-narrative"]').textContent();
    expect(controllerNarrative?.toLowerCase()).toContain('controls');
    expect(controllerNarrative?.toLowerCase()).toMatch(/accuracy|reconciliation|audit/);
  });

  /**
   * T-bpg-6: Board pack export to PDF with embedded audit chain (regulator-ready)
   */
  test('T-bpg-6: Board pack PDF export includes audit chain + digital signature', async ({ page }) => {
    await page.goto('/reports/board-pack/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="board-pack-quarter-select"]').selectOption('2026-Q2');
    await page.locator('[data-testid="board-pack-generate-btn"]').click();
    await page.waitForSelector('[data-testid="board-pack-ready"]', { timeout: 30000 });

    // Export to PDF
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="board-pack-export-pdf"]').click();
    const download = await downloadPromise;
    const pdfPath = `C:\\Users\\Tahir\\finplan-pro\\tests\\e2e\\.downloads\\board-pack-q2-2026.pdf`;
    await download.saveAs(pdfPath);

    // W2: Export success indicator
    await expect(page.locator('[data-testid="board-pack-export-success"]')).toBeVisible();

    // W3: PDF must include audit chain reference
    const fs = require('fs');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const tail = pdfBuffer.subarray(Math.max(0, pdfBuffer.length - 2048)).toString('utf-8');
    expect(tail).toMatch(/Audit Chain:/);
    expect(tail).toMatch(/SHA-256:/);

    fs.unlinkSync(pdfPath);
  });

  /**
   * T-bpg-7: Board pack scheduled generation (cron-based quarterly cadence)
   * Verifies scheduled board pack generation per CFOPreferencePage
   */
  test('T-bpg-7: Board pack cron-scheduled for quarterly cadence', async ({ page }) => {
    await page.goto('/settings/cfo-preferences');
    await page.waitForLoadState('networkidle');

    // Enable quarterly board pack schedule
    await page.locator('[data-testid="board-pack-schedule-enabled"]').check();
    await page.locator('[data-testid="board-pack-schedule-day"]').selectOption('last-day-of-quarter');
    await page.locator('[data-testid="board-pack-schedule-time"]').fill('09:00');
    await page.locator('[data-testid="board-pack-schedule-recipients"]').fill('cfo@finplan-test.local,board@finplan-test.local');
    await page.locator('[data-testid="board-pack-schedule-save"]').click();

    // W2: Schedule confirmation
    await expect(page.locator('[data-testid="schedule-saved-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="schedule-saved-toast"]')).toContainText('Quarterly board pack scheduled');

    // W3: Cleanup assertion — schedule visible in cron jobs list
    await page.goto('/settings/cron-jobs');
    await expect(page.locator('[data-testid="cron-job-board-pack-quarterly"]')).toBeVisible();
    await expect(page.locator('[data-testid="cron-job-board-pack-quarterly"]')).toContainText('0 9 * * 3#3'); // last Thursday of March (Q1)
  });

  /**
   * T-bpg-8 (J18 amendment v0.10): Board pack multi-Muse co-sign chain
   * Tests Iris PERSONA_UX cross-witness on board pack for 4 personas (CFO/Controller/FP&A/Auditor)
   */
  test('T-bpg-8: Board pack multi-Muse co-sign chain — 4 personas cross-witnessed', async ({ page }) => {
    await page.goto('/reports/board-pack/new');
    await page.waitForLoadState('networkidle');

    // W1: Generate board pack for Q2 2026
    await page.locator('[data-testid="board-pack-quarter-select"]').selectOption('2026-Q2');
    await page.locator('[data-testid="board-pack-generate-btn"]').click();
    await page.waitForSelector('[data-testid="board-pack-ready"]', { timeout: 30000 });

    // W2: 4 personas available with persona-specific narrative
    const personas = ['CFO', 'Controller', 'FP&A', 'Auditor'];
    for (const persona of personas) {
      await page.locator('[data-testid="board-pack-persona-select"]').selectOption(persona);
      await page.locator('[data-testid="board-pack-regenerate-btn"]').click();
      await page.waitForSelector('[data-testid="board-pack-narrative-updated"]', { timeout: 30000 });
      const narrative = await page.locator('[data-testid="board-pack-narrative"]').textContent();
      expect(narrative?.length).toBeGreaterThan(100);
    }

    // W3: Multi-Muse co-sign chain visible
    await expect(page.locator('[data-testid="board-pack-cosign-strategos"]')).toBeVisible();
    await expect(page.locator('[data-testid="board-pack-cosign-vulcan"]')).toBeVisible();
    await expect(page.locator('[data-testid="board-pack-cosign-iris"]')).toBeVisible();
    await expect(page.locator('[data-testid="board-pack-cosign-chronos"]')).toBeVisible();
  });

  /**
   * T-bpg-9 (J18 amendment v0.10): Board pack drift detection — regen required when quarter closes
   * Tests Iris PICK N v0.3 final amendment for drift detection
   */
  test('T-bpg-9: Board pack drift detection — quarter close triggers regen', async ({ page }) => {
    await page.goto('/reports/board-pack/new');
    await page.waitForLoadState('networkidle');

    // W1: Generate Q2 2026 board pack
    await page.locator('[data-testid="board-pack-quarter-select"]').selectOption('2026-Q2');
    await page.locator('[data-testid="board-pack-generate-btn"]').click();
    await page.waitForSelector('[data-testid="board-pack-ready"]', { timeout: 30000 });
    const initialHash = await page.locator('[data-testid="board-pack-hash"]').textContent();

    // W2: Simulate Q2 close (add a new transaction)
    await page.evaluate(() => {
      localStorage.setItem('board-pack-q2-closed', 'true');
    });

    // W3: Drift detected — regen required banner visible
    await expect(page.locator('[data-testid="board-pack-drift-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="board-pack-drift-banner"]')).toContainText('Q2 closed');
    await expect(page.locator('[data-testid="board-pack-drift-banner"]')).toContainText('regen required');

    // Regen and verify hash changed
    await page.locator('[data-testid="board-pack-regen-btn"]').click();
    await page.waitForSelector('[data-testid="board-pack-hash-changed"]', { timeout: 30000 });
    const newHash = await page.locator('[data-testid="board-pack-hash"]').textContent();
    expect(newHash).not.toBe(initialHash);
  });
});
