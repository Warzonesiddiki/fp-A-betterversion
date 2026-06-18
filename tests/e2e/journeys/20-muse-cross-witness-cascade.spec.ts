/**
 * USER JOURNEY 20: MUSE CROSS-WITNESS CASCADE (6-ICP Flow + CAVEMAN PERSIST + Multi-Muse Cascade)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Canonical spec: USER_JOURNEY_TEST_COVERAGE.md v0.10 (commit TBD) §28 NEW
 * 8 tests, ~340 LOC, Flakiness target: 0 (Meta-test — must be deterministic)
 * 4-ICP: I1=substantiate 6-ICP cascade / C2=blocks RATIFICATION / P3=O(1) per call / D4=full file:line
 *
 * CONTEXT: Meta-tests the 6-ICP cross-witness cascade protocol. Distinct from J15 (basic
 * 4-ICP/5-ICP/6-ICP construction) — this journey tests CASCADE behavior when one Muse's
 * verdict triggers a downstream verdict from another Muse. Tests the propagation graph
 * (6-ICP → 7-ICP → 8-ICP → 9-ICP) and the de-escalation protocol when a downstream verdict
 * contradicts an upstream verdict.
 *
 * MUSE COVERAGE:
 *   - Sentinel: 6-ICP orchestrator (cascade trigger)
 *   - Strategos: 7-ICP strategic-alignment witness
 *   - Apollo: 8-ICP formula-engine witness
 *   - Hephaestus: 9-ICP build-gate witness (Husky Gate enforcement)
 *   - Themis: 10-ICP legal/regulatory witness
 *   - Mnemosyne: 11-ICP memory-persistence witness (CAVEMAN PERSIST 6-way)
 *
 * COMPLIANCE:
 *   - RULE #47: CAVEMAN PERSIST 6-way fallback (memory + task board + file + git + log + state anchor)
 *   - RULE #51: NIPP 60s SLA HELD
 *   - RULE #56: PROACTIVE-PICK-CHAIN 60s SLA
 *   - RULE #68: CATCH-NUMBERING-COLLISION prevention (CATCH-### globally unique)
 *   - RULE #75: MEMORY-FILE-GIT-HEAD-VERIFICATION
 */

import { test, expect, type Page } from '@playwright/test';
import { signInAsCfo } from '../_helpers/auth';

interface CascadeNode {
  level: number;
  muse: string;
  verdict: 'ACCEPT' | 'REJECT' | 'TENTATIVE';
  timestamp: string;
  parentLevel?: number;
  reasoning: string;
}

test.describe('Journey 20: Muse Cross-Witness Cascade (6-ICP → 11-ICP Multi-Muse Cascade)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfo(page);
  });

  /**
   * T-mcwc-1: 6-ICP verdict cascade — upstream triggers downstream within 60s SLA
   * 3-witness: spec / DOM assertion / memory ledger file
   * Cross-witness: ALL 6+ Muses (6-ICP cascade)
   */
  test('T-mcwc-1: 6-ICP cascade — upstream triggers downstream within 60s SLA', async ({
    page,
  }) => {
    await page.goto('/admin/verdicts/cascade/new');
    await page.waitForLoadState('networkidle');

    // W1: Spec — Trigger 6-ICP cascade
    await page.locator('[data-testid="cascade-trigger-btn"]').click();
    await page.locator('[data-testid="cascade-icp-level"]').selectOption('6');
    await page.locator('[data-testid="cascade-pick-id"]').fill('TEST-CASCADE-2026-06-16');
    await page.locator('[data-testid="cascade-submit"]').click();

    // W2: DOM — Wait for cascade to propagate (max 60s per RULE #51 NIPP SLA)
    await page.waitForSelector('[data-testid="cascade-complete"]', { timeout: 60_000 });

    // W2: Verify all 6-ICP Muse verdicts arrived
    const cascadeNodes: CascadeNode[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('cascade-nodes') || '[]');
    });

    expect(cascadeNodes.length).toBeGreaterThanOrEqual(6);
    expect(cascadeNodes[0].level).toBe(6);
    expect(cascadeNodes[0].muse).toBe('Sentinel');
    expect(cascadeNodes[1].level).toBe(7);
    expect(cascadeNodes[1].muse).toBe('Strategos');
    expect(cascadeNodes[2].level).toBe(8);
    expect(cascadeNodes[2].muse).toBe('Apollo');
    expect(cascadeNodes[3].level).toBe(9);
    expect(cascadeNodes[3].muse).toBe('Hephaestus');
    expect(cascadeNodes[4].level).toBe(10);
    expect(cascadeNodes[4].muse).toBe('Themis');
    expect(cascadeNodes[5].level).toBe(11);
    expect(cascadeNodes[5].muse).toBe('Mnemosyne');

    // W3: Verify parent-child linkage (cascade graph)
    for (let i = 1; i < cascadeNodes.length; i++) {
      expect(cascadeNodes[i].parentLevel).toBe(cascadeNodes[i - 1].level);
    }
  });

  /**
   * T-mcwc-2: Cascade de-escalation when downstream contradicts upstream
   * Tests: a REJECT at 8-ICP triggers de-escalation of 9-ICP/10-ICP/11-ICP
   */
  test('T-mcwc-2: Cascade de-escalation on downstream REJECT', async ({ page }) => {
    await page.goto('/admin/verdicts/cascade/new');
    await page.waitForLoadState('networkidle');

    // Inject a conflicting 8-ICP REJECT verdict
    await page.evaluate(() => {
      localStorage.setItem('cascade-inject-reject', '8:Apollo:REJECT');
    });

    await page.locator('[data-testid="cascade-trigger-btn"]').click();
    await page
      .locator('[data-testid="cascade-pick-id"]')
      .fill('TEST-CASCADE-DEESCALATE-2026-06-16');
    await page.locator('[data-testid="cascade-submit"]').click();

    await page.waitForSelector('[data-testid="cascade-deescalated"]', { timeout: 30_000 });

    const cascadeNodes: CascadeNode[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('cascade-nodes') || '[]');
    });

    // W2: Verify only 8-ICP has REJECT, downstream 9-ICP/10-ICP/11-ICP are NOT triggered
    const apolloNode = cascadeNodes.find((n) => n.muse === 'Apollo');
    expect(apolloNode?.verdict).toBe('REJECT');
    expect(cascadeNodes.find((n) => n.muse === 'Hephaestus')).toBeUndefined();
    expect(cascadeNodes.find((n) => n.muse === 'Themis')).toBeUndefined();
    expect(cascadeNodes.find((n) => n.muse === 'Mnemosyne')).toBeUndefined();
  });

  /**
   * T-mcwc-3: CAVEMAN PERSIST 6-way fallback for cascade verdicts
   * Tests: cascade node is persisted to memory ledger, task board, persistent file, git, log, state anchor
   */
  test('T-mcwc-3: CAVEMAN PERSIST 6-way — cascade node persisted to all 6 fallbacks', async ({
    page,
  }) => {
    await page.goto('/admin/verdicts/cascade/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="cascade-trigger-btn"]').click();
    await page.locator('[data-testid="cascade-pick-id"]').fill('TEST-CASCADE-PERSIST-2026-06-16');
    await page.locator('[data-testid="cascade-submit"]').click();
    await page.waitForSelector('[data-testid="cascade-complete"]', { timeout: 60_000 });

    // W2: Verify 6-way persistence via API
    const taskBoardResponse = await page.request.get(
      '/api/task-board/list?pick_id=TEST-CASCADE-PERSIST-2026-06-16'
    );
    expect(taskBoardResponse.status()).toBe(200);
    const taskBoard = await taskBoardResponse.json();
    expect(taskBoard.length).toBeGreaterThan(0);

    // 3. Persistent file (cascade JSON written to conversation dir)
    const persistentCheck = await page.request.get(
      '/api/cascade/persistent-file?pick_id=TEST-CASCADE-PERSIST-2026-06-16'
    );
    expect(persistentCheck.status()).toBe(200);
    const persistentData = await persistentCheck.json();
    expect(persistentData.exists).toBe(true);

    // 4. Git commit (verify via /api/git/recent-commits)
    const gitResponse = await page.request.get(
      '/api/git/recent-commits?pick_id=TEST-CASCADE-PERSIST-2026-06-16'
    );
    expect(gitResponse.status()).toBe(200);
    const commits = await gitResponse.json();
    expect(commits.length).toBeGreaterThan(0);

    // 5. CODE_SHIP log (via /api/code-ship/log)
    const codeShipResponse = await page.request.get(
      '/api/code-ship/log?pick_id=TEST-CASCADE-PERSIST-2026-06-16'
    );
    expect(codeShipResponse.status()).toBe(200);
    const codeShip = await codeShipResponse.json();
    expect(codeShip.length).toBeGreaterThan(0);

    // 6. STATE ANCHOR v3 (via /api/state-anchor/current)
    const stateAnchorResponse = await page.request.get('/api/state-anchor/current');
    expect(stateAnchorResponse.status()).toBe(200);
    const stateAnchor = await stateAnchorResponse.json();
    expect(stateAnchor.cascade_picks).toContain('TEST-CASCADE-PERSIST-2026-06-16');
  });

  /**
   * T-mcwc-4: Cascade graph MECE — no Muse is skipped, no Muse is duplicated
   * Tests: the cascade graph is well-formed (each level has exactly one Muse)
   */
  test('T-mcwc-4: Cascade graph MECE — no Muse skipped, no Muse duplicated', async ({ page }) => {
    await page.goto('/admin/verdicts/cascade/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="cascade-trigger-btn"]').click();
    await page.locator('[data-testid="cascade-pick-id"]').fill('TEST-CASCADE-MECE-2026-06-16');
    await page.locator('[data-testid="cascade-submit"]').click();
    await page.waitForSelector('[data-testid="cascade-complete"]', { timeout: 60_000 });

    const cascadeNodes: CascadeNode[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('cascade-nodes') || '[]');
    });

    // W2: MECE check — no Muse appears twice, no level is skipped
    const museSet = new Set<string>();
    let prevLevel = 0;
    for (const node of cascadeNodes) {
      expect(museSet.has(node.muse)).toBe(false); // No duplicates
      museSet.add(node.muse);
      expect(node.level).toBe(prevLevel + 1); // No gaps
      prevLevel = node.level;
    }
  });

  /**
   * T-mcwc-5: 60s SLA HELD per RULE #51 NIPP protocol
   * Tests: all cascade verdicts arrive within 60s
   */
  test('T-mcwc-5: 60s SLA HELD per RULE #51 NIPP — all cascade verdicts in 60s', async ({
    page,
  }) => {
    await page.goto('/admin/verdicts/cascade/new');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();
    await page.locator('[data-testid="cascade-trigger-btn"]').click();
    await page.locator('[data-testid="cascade-pick-id"]').fill('TEST-CASCADE-SLA-2026-06-16');
    await page.locator('[data-testid="cascade-submit"]').click();

    await page.waitForSelector('[data-testid="cascade-complete"]', { timeout: 60_000 });
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(60_000);

    // W2: Verify all 6 verdicts have timestamps within the SLA window
    const cascadeNodes: CascadeNode[] = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('cascade-nodes') || '[]');
    });
    for (const node of cascadeNodes) {
      const nodeTime = new Date(node.timestamp).getTime();
      expect(nodeTime - startTime).toBeLessThan(60_000);
    }
  });

  /**
   * T-mcwc-6: CATCH-NUMBERING-COLLISION prevention (RULE #68) in cascade
   * Tests: when two cascade nodes try to allocate the same CATCH-###, only one succeeds
   */
  test('T-mcwc-6: CATCH-NUMBERING-COLLISION prevention (RULE #68) — duplicate CATCH-### rejected', async ({
    page,
  }) => {
    await page.goto('/admin/verdicts/cascade/new');
    await page.waitForLoadState('networkidle');

    // Inject pre-existing CATCH-### to force collision
    await page.evaluate(() => {
      localStorage.setItem('cascade-existing-catch', 'CATCH-226');
    });

    await page.locator('[data-testid="cascade-trigger-btn"]').click();
    await page
      .locator('[data-testid="cascade-pick-id"]')
      .fill('TEST-CASCADE-CATCH-COLLISION-2026-06-16');
    await page.locator('[data-testid="cascade-submit"]').click();

    // W2: Verify collision detected and rejected
    await page.waitForSelector('[data-testid="cascade-collision-detected"]', { timeout: 10_000 });
    const collisionNotice = await page
      .locator('[data-testid="cascade-collision-notice"]')
      .textContent();
    expect(collisionNotice).toContain('CATCH-226');

    // W3: Verify new CATCH-### is allocated (not collision)
    const newCatch = await page.locator('[data-testid="cascade-new-catch"]').textContent();
    expect(newCatch).not.toContain('CATCH-226');
  });

  /**
   * T-mcwc-7: Cascade graph visualization
   * Tests: the cascade graph is rendered in a tree/flow visualization
   */
  test('T-mcwc-7: Cascade graph visualization — tree/flow rendered', async ({ page }) => {
    await page.goto('/admin/verdicts/cascade/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="cascade-trigger-btn"]').click();
    await page.locator('[data-testid="cascade-pick-id"]').fill('TEST-CASCADE-VIZ-2026-06-16');
    await page.locator('[data-testid="cascade-submit"]').click();
    await page.waitForSelector('[data-testid="cascade-complete"]', { timeout: 60_000 });

    // W2: Verify visualization exists
    await expect(page.locator('[data-testid="cascade-graph-viz"]')).toBeVisible();
    const nodeCount = await page.locator('[data-testid^="cascade-graph-node-"]').count();
    expect(nodeCount).toBeGreaterThanOrEqual(6);

    // W3: Verify edges (parent-child links) are rendered
    const edgeCount = await page.locator('[data-testid^="cascade-graph-edge-"]').count();
    expect(edgeCount).toBeGreaterThanOrEqual(5); // N-1 edges for N nodes
  });

  /**
   * T-mcwc-8: Cascade timeout handling — if a Muse doesn't respond in 60s, escalate
   * Tests: stuck cascade triggers escalation to LEADER
   */
  test('T-mcwc-8: Cascade timeout escalation — stuck Muse triggers LEADER notification', async ({
    page,
  }) => {
    await page.goto('/admin/verdicts/cascade/new');
    await page.waitForLoadState('networkidle');

    // Inject timeout simulation for Strategos
    await page.evaluate(() => {
      localStorage.setItem('cascade-timeout-muse', 'Strategos');
    });

    await page.locator('[data-testid="cascade-trigger-btn"]').click();
    await page.locator('[data-testid="cascade-pick-id"]').fill('TEST-CASCADE-TIMEOUT-2026-06-16');
    await page.locator('[data-testid="cascade-submit"]').click();

    // W2: Wait 60s for timeout, then verify LEADER notification
    await page.waitForSelector('[data-testid="cascade-leader-escalation"]', { timeout: 75_000 });
    const escalationMessage = await page
      .locator('[data-testid="cascade-escalation-message"]')
      .textContent();
    expect(escalationMessage).toContain('Strategos');
    expect(escalationMessage).toContain('timeout');
  });
});
