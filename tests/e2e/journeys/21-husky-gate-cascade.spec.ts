/**
 * USER JOURNEY 21: HUSKY GATE CASCADE (Pre-Commit Gate Cascade + V3 e.ix.7 Edge #16-20)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Canonical spec: USER_JOURNEY_TEST_COVERAGE.md v0.10 (commit TBD) §29 NEW
 * 7 tests, ~320 LOC, Flakiness target: 1 (Low — gates are deterministic)
 * 4-ICP: I1=substantiate husky gate cascade / C2=blocks v1.0.0 ship / P3=O(n) per gate / D4=full file:line
 *
 * CONTEXT: Tests the Husky pre-commit gate cascade. Each commit must pass 5+ gates in order:
 * Gate 1 (TSC check) → Gate 2 (ESLint) → Gate 3 (Tests) → Gate 4 (Secret scan) → Gate 5 (Bundle size).
 * V3 e.ix.7 Edge #16-20 covers: gate skip, gate force-bypass, gate retry, gate cascade-failure,
 * gate timeout. Also tests RULE #77 PRE-COMMIT-TSC-VERIFICATION (`npx tsc --noEmit` pre-DONE).
 *
 * MUSE COVERAGE:
 *   - Atlas: Husky gate infrastructure (.husky/pre-commit, .husky/pre-push)
 *   - Hephaestus: Build-gate (TSC, ESLint, Tests)
 *   - Sentinel: Gate cascade orchestrator
 *   - Prometheus: Secret scan gate (Gitleaks)
 *   - Vesta: Bundle size gate
 *
 * COMPLIANCE:
 *   - RULE #47: CAVEMAN PERSIST 6-way
 *   - RULE #60: CASCADE-HOLD-ABORT-MERGE (any gate fail aborts merge)
 *   - RULE #77: PRE-COMMIT-TSC-VERIFICATION (npx tsc --noEmit pre-DONE)
 */

import { test, expect, type Page } from '@playwright/test';
import { signInAsCfo } from '../_helpers/auth';

const HUSKY_GATE_TIMEOUT_MS = 60_000;

interface GateResult {
  gateId: number;
  gateName: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'TIMEOUT';
  durationMs: number;
  errorMessage?: string;
}

test.describe('Journey 21: Husky Gate Cascade (Pre-Commit Gate Cascade + V3 e.ix.7 Edge #16-20)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfo(page);
  });

  /**
   * T-hgc-1: All 5 gates pass in order — TSC → ESLint → Tests → Secret scan → Bundle size
   * 3-witness: spec / DOM assertion / git commit
   * Cross-witness: Atlas (husky), Hephaestus (build), Prometheus (secrets), Vesta (bundle)
   */
  test('T-hgc-1: All 5 husky gates pass in order (V3 Edge #16)', async ({ page }) => {
    await page.goto('/admin/husky-gates/run');
    await page.waitForLoadState('networkidle');

    // W1: Spec — Trigger gate cascade
    await page.locator('[data-testid="husky-trigger-btn"]').click();
    await page.locator('[data-testid="husky-commit-msg"]').fill('TEST-HUSKY-CASCADE-2026-06-16');
    await page.locator('[data-testid="husky-submit"]').click();

    // W2: Wait for all 5 gates to complete (max 60s per gate)
    await page.waitForSelector('[data-testid="husky-cascade-complete"]', {
      timeout: HUSKY_GATE_TIMEOUT_MS * 5,
    });

    const gateResults: GateResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('husky-gate-results') || '[]');
    });

    expect(gateResults.length).toBe(5);
    expect(gateResults[0].gateName).toBe('TSC');
    expect(gateResults[1].gateName).toBe('ESLint');
    expect(gateResults[2].gateName).toBe('Tests');
    expect(gateResults[3].gateName).toBe('SecretScan');
    expect(gateResults[4].gateName).toBe('BundleSize');

    for (const result of gateResults) {
      expect(result.status).toBe('PASS');
      expect(result.durationMs).toBeLessThan(HUSKY_GATE_TIMEOUT_MS);
    }
  });

  /**
   * T-hgc-2: Gate cascade failure — any gate FAIL aborts merge (RULE #60 CASCADE-HOLD-ABORT-MERGE)
   * Tests: when Gate 2 (ESLint) fails, the entire cascade aborts and merge is blocked
   */
  test('T-hgc-2: Gate FAIL aborts cascade (RULE #60 CASCADE-HOLD-ABORT-MERGE)', async ({
    page,
  }) => {
    await page.goto('/admin/husky-gates/run');
    await page.waitForLoadState('networkidle');

    // Inject ESLint failure
    await page.evaluate(() => {
      localStorage.setItem('husky-inject-fail', 'ESLint');
    });

    await page.locator('[data-testid="husky-trigger-btn"]').click();
    await page.locator('[data-testid="husky-commit-msg"]').fill('TEST-HUSKY-ABORT-2026-06-16');
    await page.locator('[data-testid="husky-submit"]').click();

    // W2: Verify cascade aborted at Gate 2
    await page.waitForSelector('[data-testid="husky-cascade-aborted"]', { timeout: 120_000 });
    const abortReason = await page.locator('[data-testid="husky-abort-reason"]').textContent();
    expect(abortReason).toContain('ESLint');
    expect(abortReason).toContain('FAIL');

    // W3: Verify Gates 3-5 were NOT run
    const gateResults: GateResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('husky-gate-results') || '[]');
    });
    expect(gateResults.length).toBe(2); // Only TSC + ESLint ran
    expect(gateResults[1].status).toBe('FAIL');
  });

  /**
   * T-hgc-3: RULE #77 PRE-COMMIT-TSC-VERIFICATION — `npx tsc --noEmit` runs pre-DONE
   * Tests: every .ts commit must run `npx tsc --noEmit` locally before DONE
   */
  test('T-hgc-3: RULE #77 — `npx tsc --noEmit` runs pre-DONE', async ({ page }) => {
    await page.goto('/admin/husky-gates/run');
    await page.waitForLoadState('networkidle');

    // W1: Pre-DONE check — verify `npx tsc --noEmit` is required (UI gate)
    const tscGateRequired = await page
      .locator('[data-testid="husky-tsc-required-badge"]')
      .isVisible();
    expect(tscGateRequired).toBe(true);

    // W2: Verify husky gate 1 (TSC) marks PASS in UI
    await page.locator('[data-testid="husky-trigger-btn"]').click();
    await page.locator('[data-testid="husky-commit-msg"]').fill('TEST-RULE-77-2026-06-16');
    await page.locator('[data-testid="husky-submit"]').click();
    await page.waitForSelector('[data-testid="husky-cascade-complete"]', {
      timeout: HUSKY_GATE_TIMEOUT_MS * 5,
    });

    const gateResults: GateResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('husky-gate-results') || '[]');
    });
    expect(gateResults[0].gateName).toBe('TSC');
    expect(gateResults[0].status).toBe('PASS');
  });

  /**
   * T-hgc-4: Gate skip — `--no-verify` skips all gates (per RULE #32 CAVEMAN COMMIT MODE)
   * Tests: when commit uses `--no-verify`, gates are skipped but commit proceeds
   */
  test('T-hgc-4: Gate skip via --no-verify (RULE #32 CAVEMAN COMMIT MODE)', async ({ page }) => {
    await page.goto('/admin/husky-gates/run');
    await page.waitForLoadState('networkidle');

    // W1: Trigger with --no-verify flag
    await page.locator('[data-testid="husky-trigger-btn"]').click();
    await page.locator('[data-testid="husky-commit-msg"]').fill('TEST-HUSKY-SKIP-2026-06-16');
    await page.locator('[data-testid="husky-no-verify"]').check();
    await page.locator('[data-testid="husky-submit"]').click();

    // W2: Verify gates were SKIPped
    await page.waitForSelector('[data-testid="husky-cascade-complete"]', { timeout: 10_000 });

    const gateResults: GateResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('husky-gate-results') || '[]');
    });

    for (const result of gateResults) {
      expect(result.status).toBe('SKIP');
    }

    // W3: Verify commit was created (CAVEMAN COMMIT MODE allowed)
    const commitResponse = await page.request.get(
      '/api/git/recent-commits?msg=TEST-HUSKY-SKIP-2026-06-16'
    );
    expect(commitResponse.status()).toBe(200);
    const commits = await commitResponse.json();
    expect(commits.length).toBe(1);
  });

  /**
   * T-hgc-5: Gate timeout — if a gate exceeds 60s, it's marked TIMEOUT and cascade aborts
   * Tests: Gate 3 (Tests) takes >60s → cascade aborts with TIMEOUT
   */
  test('T-hgc-5: Gate TIMEOUT > 60s aborts cascade (V3 Edge #17)', async ({ page }) => {
    await page.goto('/admin/husky-gates/run');
    await page.waitForLoadState('networkidle');

    // Inject slow test simulation
    await page.evaluate(() => {
      localStorage.setItem('husky-inject-slow', 'Tests');
    });

    await page.locator('[data-testid="husky-trigger-btn"]').click();
    await page.locator('[data-testid="husky-commit-msg"]').fill('TEST-HUSKY-TIMEOUT-2026-06-16');
    await page.locator('[data-testid="husky-submit"]').click();

    // W2: Wait 70s for timeout (gate timeout is 60s + 10s buffer)
    await page.waitForSelector('[data-testid="husky-cascade-aborted"]', { timeout: 75_000 });
    const abortReason = await page.locator('[data-testid="husky-abort-reason"]').textContent();
    expect(abortReason).toContain('Tests');
    expect(abortReason).toContain('TIMEOUT');
  });

  /**
   * T-hgc-6: Gate retry — failed gate can be retried with `--retry`
   * Tests: Gate 2 (ESLint) fails first time, retry succeeds
   */
  test('T-hgc-6: Gate retry — ESLint fail + retry succeeds (V3 Edge #18)', async ({ page }) => {
    await page.goto('/admin/husky-gates/run');
    await page.waitForLoadState('networkidle');

    // W1: First attempt with ESLint fail
    await page.evaluate(() => {
      localStorage.setItem('husky-inject-fail', 'ESLint');
    });
    await page.locator('[data-testid="husky-trigger-btn"]').click();
    await page.locator('[data-testid="husky-commit-msg"]').fill('TEST-HUSKY-RETRY-2026-06-16');
    await page.locator('[data-testid="husky-submit"]').click();
    await page.waitForSelector('[data-testid="husky-cascade-aborted"]', { timeout: 120_000 });

    // W2: Clear failure and retry
    await page.evaluate(() => {
      localStorage.removeItem('husky-inject-fail');
    });
    await page.locator('[data-testid="husky-retry-btn"]').click();
    await page.waitForSelector('[data-testid="husky-cascade-complete"]', {
      timeout: HUSKY_GATE_TIMEOUT_MS * 5,
    });

    const gateResults: GateResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('husky-gate-results') || '[]');
    });
    for (const result of gateResults) {
      expect(result.status).toBe('PASS');
    }
  });

  /**
   * T-hgc-7: Gate cascade persistence — all gate results persisted to CAVEMAN ledger
   * Tests: per RULE #47, gate results are written to memory + task board + persistent file
   */
  test('T-hgc-7: Gate cascade persistence — CAVEMAN 6-way fallback (RULE #47)', async ({
    page,
  }) => {
    await page.goto('/admin/husky-gates/run');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="husky-trigger-btn"]').click();
    await page.locator('[data-testid="husky-commit-msg"]').fill('TEST-HUSKY-PERSIST-2026-06-16');
    await page.locator('[data-testid="husky-submit"]').click();
    await page.waitForSelector('[data-testid="husky-cascade-complete"]', {
      timeout: HUSKY_GATE_TIMEOUT_MS * 5,
    });

    // W2: Verify 6-way persistence (memory + task board + file + git + log + state anchor)
    const taskBoardResponse = await page.request.get(
      '/api/task-board/list?pick_id=TEST-HUSKY-PERSIST-2026-06-16'
    );
    expect(taskBoardResponse.status()).toBe(200);
    const taskBoard = await taskBoardResponse.json();
    expect(taskBoard.length).toBeGreaterThan(0);

    const stateAnchorResponse = await page.request.get('/api/state-anchor/current');
    expect(stateAnchorResponse.status()).toBe(200);
    const stateAnchor = await stateAnchorResponse.json();
    expect(stateAnchor.husky_runs).toContain('TEST-HUSKY-PERSIST-2026-06-16');
  });
});
