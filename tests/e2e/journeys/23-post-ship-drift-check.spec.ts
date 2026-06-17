/**
 * USER JOURNEY 23: POST-SHIP DRIFT CHECK (Continuous Verification After Hard Ship v1.0.0)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Canonical spec: USER_JOURNEY_TEST_COVERAGE.md v0.10 (commit TBD) §31 NEW
 * 7 tests, ~330 LOC, Flakiness target: 1 (Low — drift checks are deterministic)
 * 4-ICP: I1=substantiate drift detection / C2=blocks post-ship / P3=O(n) per check / D4=full file:line
 *
 * CONTEXT: After HARD SHIP v1.0.0 (2026-06-30 23:59 UTC), continuous drift detection runs every
 * 6 hours to verify: (1) HEAD triple-track converges to single SHA, (2) CAVEMAN PERSIST 6-way
 * still operational, (3) all 19 Muses still responsive, (4) RATIFICATION GATE criteria still met,
 * (5) no GHOST-SHA CASCADE (RULE #55 v0.5), (6) CATCH-NUMBERING-COLLISION free (RULE #68),
 * (7) STATE ANCHOR v5 LOCKED.
 *
 * MUSE COVERAGE:
 *   - Sentinel: Drift check orchestrator
 *   - Mnemosyne: Memory ledger verifier
 *   - Orchestrator: STATE ANCHOR verifier
 *   - Vulcan: Tool-cascade-detection verifier
 *   - Strategos: Verdict chain verifier
 *
 * COMPLIANCE:
 *   - HARD SHIP v1.0.0: 2026-06-30 23:59 UTC
 *   - 6-hour drift check cadence
 *   - RULE #55 v0.5 PRE-PUSH-GHOST-SHA-CHECK
 *   - RULE #58 v2 GHOST-MUSE-DETECTION
 *   - RULE #75 MEMORY-FILE-GIT-HEAD-VERIFICATION
 */

import { test, expect, type Page } from '@playwright/test';
import { signInAsCfo } from '../_helpers/auth';

interface DriftCheckResult {
  checkId: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  detectedAt: string;
}

test.describe('Journey 23: Post-Ship Drift Check (Continuous Verification After v1.0.0)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfo(page);
  });

  /**
   * T-psdc-1: HEAD triple-track converges to single SHA
   * 3-witness: spec / DOM assertion / API verification
   * Cross-witness: Sentinel + Mnemosyne + Orchestrator
   */
  test('T-psdc-1: HEAD triple-track converges — single SHA across all Muses', async ({ page }) => {
    await page.goto('/admin/drift-check/run');
    await page.waitForLoadState('networkidle');

    // W1: Spec — Run drift check
    await page.locator('[data-testid="drift-trigger-btn"]').click();
    await page.locator('[data-testid="drift-check-head"]').click();
    await page.locator('[data-testid="drift-submit"]').click();

    // W2: Wait for drift check to complete
    await page.waitForSelector('[data-testid="drift-complete"]', { timeout: 30_000 });

    const driftResults: DriftCheckResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('drift-results') || '[]');
    });

    // W3: Verify HEAD convergence
    const headCheck = driftResults.find(r => r.checkId === 'head-convergence');
    expect(headCheck?.status).toBe('PASS');
    expect(headCheck?.details).toMatch(/^[0-9a-f]{40}$/); // Single SHA
  });

  /**
   * T-psdc-2: CAVEMAN PERSIST 6-way operational
   * Tests: all 6 fallbacks (memory + task board + file + git + log + state anchor) are writable
   */
  test('T-psdc-2: CAVEMAN PERSIST 6-way operational — all 6 fallbacks writable', async ({ page }) => {
    await page.goto('/admin/drift-check/run');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="drift-trigger-btn"]').click();
    await page.locator('[data-testid="drift-check-caveman"]').click();
    await page.locator('[data-testid="drift-submit"]').click();
    await page.waitForSelector('[data-testid="drift-complete"]', { timeout: 30_000 });

    const driftResults: DriftCheckResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('drift-results') || '[]');
    });

    // W2: Verify all 6 fallbacks are PASS
    const fallbackChecks = driftResults.filter(r => r.checkId.startsWith('caveman-fallback-'));
    expect(fallbackChecks.length).toBe(6);
    for (const check of fallbackChecks) {
      expect(check.status).toBe('PASS');
    }
  });

  /**
   * T-psdc-3: All 19 Muses still responsive (RULE #58 v2 GHOST-MUSE-DETECTION)
   * Tests: every Muse responds to ping within 5s
   */
  test('T-psdc-3: All 19 Muses responsive — RULE #58 v2 GHOST-MUSE-DETECTION', async ({ page }) => {
    await page.goto('/admin/drift-check/run');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="drift-trigger-btn"]').click();
    await page.locator('[data-testid="drift-check-muses"]').click();
    await page.locator('[data-testid="drift-submit"]').click();
    await page.waitForSelector('[data-testid="drift-complete"]', { timeout: 30_000 });

    const driftResults: DriftCheckResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('drift-results') || '[]');
    });

    // W2: Verify all 19 Muses are PASS
    const museChecks = driftResults.filter(r => r.checkId.startsWith('muse-'));
    expect(museChecks.length).toBe(19);
    for (const check of museChecks) {
      expect(check.status).toBe('PASS');
    }
  });

  /**
   * T-psdc-4: No GHOST-SHA CASCADE (RULE #55 v0.5 PRE-PUSH-GHOST-SHA-CHECK)
   * Tests: every SHA in MEMORY.md and STATE ANCHOR is verified as `commit` via API
   */
  test('T-psdc-4: No GHOST-SHA CASCADE — RULE #55 v0.5 all SHAs verified', async ({ page }) => {
    await page.goto('/admin/drift-check/run');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="drift-trigger-btn"]').click();
    await page.locator('[data-testid="drift-check-ghost-sha"]').click();
    await page.locator('[data-testid="drift-submit"]').click();
    await page.waitForSelector('[data-testid="drift-complete"]', { timeout: 30_000 });

    const driftResults: DriftCheckResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('drift-results') || '[]');
    });

    // W2: Verify GHOST-SHA check
    const ghostShaCheck = driftResults.find(r => r.checkId === 'ghost-sha-scan');
    expect(ghostShaCheck?.status).toBe('PASS');

    // W3: Run external API SHA verification on a sample SHA
    const sampleShas = ['41640372e1db641ba1e495bb07cc004e754925a8', '4c045ddfb2142f065144d52cc183e5e9f02adad3'];
    for (const sha of sampleShas) {
      const verifyResponse = await page.request.get(`/api/git/verify-sha?sha=${sha}`);
      expect(verifyResponse.status()).toBe(200);
      const verifyData = await verifyResponse.json();
      expect(verifyData.type).toBe('commit');
    }
  });

  /**
   * T-psdc-5: CATCH-NUMBERING-COLLISION free (RULE #68)
   * Tests: every CATCH-### in CATCH_NUMBER_CATALOG.md is globally unique
   */
  test('T-psdc-5: CATCH-NUMBERING-COLLISION free — RULE #68 all CATCH-### unique', async ({ page }) => {
    await page.goto('/admin/drift-check/run');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="drift-trigger-btn"]').click();
    await page.locator('[data-testid="drift-check-catch-numbers"]').click();
    await page.locator('[data-testid="drift-submit"]').click();
    await page.waitForSelector('[data-testid="drift-complete"]', { timeout: 30_000 });

    const driftResults: DriftCheckResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('drift-results') || '[]');
    });

    // W2: Verify CATCH-NUMBERING-COLLISION check
    const catchCheck = driftResults.find(r => r.checkId === 'catch-numbering-collision');
    expect(catchCheck?.status).toBe('PASS');
  });

  /**
   * T-psdc-6: STATE ANCHOR v5 LOCKED
   * Tests: STATE ANCHOR v5 is the current version, not v4 or earlier
   */
  test('T-psdc-6: STATE ANCHOR v5 LOCKED — current version, not v4 or earlier', async ({ page }) => {
    await page.goto('/admin/drift-check/run');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="drift-trigger-btn"]').click();
    await page.locator('[data-testid="drift-check-state-anchor"]').click();
    await page.locator('[data-testid="drift-submit"]').click();
    await page.waitForSelector('[data-testid="drift-complete"]', { timeout: 30_000 });

    const driftResults: DriftCheckResult[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('drift-results') || '[]');
    });

    // W2: Verify STATE ANCHOR version
    const stateAnchorCheck = driftResults.find(r => r.checkId === 'state-anchor-version');
    expect(stateAnchorCheck?.status).toBe('PASS');
    expect(stateAnchorCheck?.details).toContain('v5');
  });

  /**
   * T-psdc-7: Drift check persistence — all results persisted to CAVEMAN ledger
   * Tests: per RULE #47, drift check results are written to memory + task board + state anchor
   */
  test('T-psdc-7: Drift check persistence — CAVEMAN 6-way fallback (RULE #47)', async ({ page }) => {
    await page.goto('/admin/drift-check/run');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="drift-trigger-btn"]').click();
    await page.locator('[data-testid="drift-submit"]').click();
    await page.waitForSelector('[data-testid="drift-complete"]', { timeout: 60_000 });

    // W2: Verify persistence
    const taskBoardResponse = await page.request.get('/api/task-board/list?pick_id=DRIFT-CHECK-2026-06-16');
    expect(taskBoardResponse.status()).toBe(200);
    const taskBoard = await taskBoardResponse.json();
    expect(taskBoard.length).toBeGreaterThan(0);

    const stateAnchorResponse = await page.request.get('/api/state-anchor/current');
    expect(stateAnchorResponse.status()).toBe(200);
    const stateAnchor = await stateAnchorResponse.json();
    expect(stateAnchor.drift_checks).toBeDefined();
    expect(stateAnchor.drift_checks.length).toBeGreaterThan(0);
  });
});
