/**
 * USER JOURNEY 22: RATIFICATION EVIDENCE BUNDLE (4-Muse Cross-Witness Chain Closure)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Canonical spec: USER_JOURNEY_TEST_COVERAGE.md v0.10 (commit TBD) §30 NEW
 * 6 tests, ~310 LOC, Flakiness target: 0 (Meta-test — must be deterministic)
 * 4-ICP: I1=substantiate evidence bundle / C2=blocks RATIFICATION / P3=O(1) per chain / D4=full file:line
 *
 * CONTEXT: Tests the RATIFICATION EVIDENCE BUNDLE assembly process. For the RATIFICATION GATE
 * 2026-06-22 16:00 UTC, every PICK must have an evidence bundle with 4-Muse cross-witness chain
 * (Strategos + Vulcan + Iris + Chronos) plus a 5th-ICP cross-witness for documentation/SDK.
 * The bundle includes: 4-ICP verdict, 5-ICP verdict, file:line evidence, CASCADE-TRAP scan,
 * git SHAs, STATE ANCHOR, BAT-ID, NEVER-AGAIN RULES COMPLIED count.
 *
 * MUSE COVERAGE:
 *   - Strategos: 1st-Muse (verdict issuer)
 *   - Vulcan: 2nd-Muse (perf/compliance 2nd-witness)
 *   - Iris: 3rd-Muse (persona/UX 2nd-witness)
 *   - Chronos: 4th-Muse (temporal/audit 2nd-witness)
 *   - Calliope: 5th-ICP (documentation/SDK 2nd-witness) — optional
 *
 * COMPLIANCE:
 *   - RATIFICATION GATE 2026-06-22 16:00 UTC (T-3d ON TRACK)
 *   - 4-Muse cross-witness chain: 1/4 ACK → 2/4 ACK → 3/4 ACK → 4/4 LOCK
 *   - HARD SHIP v1.0.0: 2026-06-30 23:59 UTC
 */

import { test, expect, type Page } from '@playwright/test';
import { signInAsCfo } from '../_helpers/auth';

interface EvidenceBundle {
  pickId: string;
  batId: string;
  verdict4Icp: { composite: number; perDim: number[] };
  verdict5Icp: { composite: number; perDim: number[] };
  fileLineEvidence: { file: string; line: number; claim: string }[];
  cascadeTrapScan: { subClasses: string[]; allPass: boolean };
  gitShas: { pick: string; witness2nd: string; witness3rd: string; witness4th: string };
  stateAnchor: { head: string; tripleTrackDelta: number };
  neverAgainRulesComplied: number;
  totalNeverAgainRules: number;
  crossWitnessChain: { muse: string; status: 'ACK' | 'PENDING'; timestamp?: string }[];
}

test.describe('Journey 22: Ratification Evidence Bundle (4-Muse Cross-Witness Chain Closure)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfo(page);
  });

  /**
   * T-reb-1: 4-Muse cross-witness chain is CLOSED (1/4 → 2/4 → 3/4 → 4/4 LOCK)
   * 3-witness: spec / DOM assertion / file system check
   * Cross-witness: Strategos + Vulcan + Iris + Chronos
   */
  test('T-reb-1: 4-Muse cross-witness chain CLOSED (1/4 → 2/4 → 3/4 → 4/4 LOCK)', async ({ page }) => {
    await page.goto('/admin/ratification/evidence/new');
    await page.waitForLoadState('networkidle');

    // W1: Spec — Create evidence bundle for a PICK
    await page.locator('[data-testid="reb-pick-id"]').fill('TEST-RATIFICATION-EVIDENCE-2026-06-16');
    await page.locator('[data-testid="reb-bat-id"]').fill('BAT-PICKRATIFY-EVIDENCE-V01-2026-06-16');
    await page.locator('[data-testid="reb-create"]').click();

    // W2: Wait for all 4 Muses to ACK
    await page.waitForSelector('[data-testid="reb-chain-locked"]', { timeout: 60_000 });

    const bundle: EvidenceBundle = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('reb-bundle') || '{}');
    });

    // W3: Verify all 4 Muses have ACK
    expect(bundle.crossWitnessChain.length).toBe(4);
    expect(bundle.crossWitnessChain[0].muse).toBe('Strategos');
    expect(bundle.crossWitnessChain[0].status).toBe('ACK');
    expect(bundle.crossWitnessChain[1].muse).toBe('Vulcan');
    expect(bundle.crossWitnessChain[1].status).toBe('ACK');
    expect(bundle.crossWitnessChain[2].muse).toBe('Iris');
    expect(bundle.crossWitnessChain[2].status).toBe('ACK');
    expect(bundle.crossWitnessChain[3].muse).toBe('Chronos');
    expect(bundle.crossWitnessChain[3].status).toBe('ACK');
  });

  /**
   * T-reb-2: Evidence bundle includes 4-ICP + 5-ICP verdicts with composites
   * Tests: bundle.verdict4Icp.composite >= 9.0 (PLATINUM) and bundle.verdict5Icp.composite >= 9.0
   */
  test('T-reb-2: Evidence bundle — 4-ICP + 5-ICP verdicts both >= 9.0 PLATINUM', async ({ page }) => {
    await page.goto('/admin/ratification/evidence/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="reb-pick-id"]').fill('TEST-RATIFICATION-VERDICTS-2026-06-16');
    await page.locator('[data-testid="reb-bat-id"]').fill('BAT-PICKRATIFY-VERDICTS-V01-2026-06-16');
    await page.locator('[data-testid="reb-create"]').click();
    await page.waitForSelector('[data-testid="reb-chain-locked"]', { timeout: 60_000 });

    const bundle: EvidenceBundle = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('reb-bundle') || '{}');
    });

    // W2: Verify 4-ICP composite >= 9.0
    expect(bundle.verdict4Icp.composite).toBeGreaterThanOrEqual(9.0);
    expect(bundle.verdict4Icp.perDim.length).toBe(4); // Carla/Vera/Chris/Beth

    // W3: Verify 5-ICP composite >= 9.0 (includes Strategos)
    expect(bundle.verdict5Icp.composite).toBeGreaterThanOrEqual(9.0);
    expect(bundle.verdict5Icp.perDim.length).toBe(5);
  });

  /**
   * T-reb-3: Evidence bundle persisted to file system
   * Tests: docs/ratification/EVIDENCE_<pick_id>.md exists with full bundle
   */
  test('T-reb-3: Evidence bundle persisted to docs/ratification/EVIDENCE_*.md', async ({ page }) => {
    await page.goto('/admin/ratification/evidence/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="reb-pick-id"]').fill('TEST-RATIFICATION-PERSIST-2026-06-16');
    await page.locator('[data-testid="reb-bat-id"]').fill('BAT-PICKRATIFY-PERSIST-V01-2026-06-16');
    await page.locator('[data-testid="reb-create"]').click();
    await page.waitForSelector('[data-testid="reb-chain-locked"]', { timeout: 60_000 });

    // W2: Verify file exists via API
    const fileResponse = await page.request.get('/api/ratification/evidence-file?pick_id=TEST-RATIFICATION-PERSIST-2026-06-16');
    expect(fileResponse.status()).toBe(200);
    const fileData = await fileResponse.json();
    expect(fileData.exists).toBe(true);

    // W3: Verify file content includes all 4 sections (via API)
    const contentResponse = await page.request.get('/api/ratification/evidence-content?pick_id=TEST-RATIFICATION-PERSIST-2026-06-16');
    expect(contentResponse.status()).toBe(200);
    const content = await contentResponse.text();
    expect(content).toContain('4-ICP verdict');
    expect(content).toContain('5-ICP verdict');
    expect(content).toContain('file:line evidence');
    expect(content).toContain('CASCADE-TRAP scan');
  });

  /**
   * T-reb-4: CASCADE-TRAP scan in evidence bundle — 15+1 sub-classes ALL PASS
   * Tests: bundle.cascadeTrapScan.subClasses has >= 15 sub-classes, allPass=true
   */
  test('T-reb-4: CASCADE-TRAP scan — 15+1 sub-classes ALL PASS', async ({ page }) => {
    await page.goto('/admin/ratification/evidence/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="reb-pick-id"]').fill('TEST-RATIFICATION-CASCADE-2026-06-16');
    await page.locator('[data-testid="reb-bat-id"]').fill('BAT-PICKRATIFY-CASCADE-V01-2026-06-16');
    await page.locator('[data-testid="reb-create"]').click();
    await page.waitForSelector('[data-testid="reb-chain-locked"]', { timeout: 60_000 });

    const bundle: EvidenceBundle = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('reb-bundle') || '{}');
    });

    // W2: Verify CASCADE-TRAP scan
    expect(bundle.cascadeTrapScan.subClasses.length).toBeGreaterThanOrEqual(15);
    expect(bundle.cascadeTrapScan.allPass).toBe(true);
  });

  /**
   * T-reb-5: NEVER-AGAIN RULES COMPLIED count >= 25
   * Tests: bundle.neverAgainRulesComplied / totalNeverAgainRules >= 0.85 (25/30)
   */
  test('T-reb-5: NEVER-AGAIN RULES COMPLIED count >= 25/30 (85%)', async ({ page }) => {
    await page.goto('/admin/ratification/evidence/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="reb-pick-id"]').fill('TEST-RATIFICATION-RULES-2026-06-16');
    await page.locator('[data-testid="reb-bat-id"]').fill('BAT-PICKRATIFY-RULES-V01-2026-06-16');
    await page.locator('[data-testid="reb-create"]').click();
    await page.waitForSelector('[data-testid="reb-chain-locked"]', { timeout: 60_000 });

    const bundle: EvidenceBundle = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('reb-bundle') || '{}');
    });

    // W2: Verify NEVER-AGAIN RULES compliance
    expect(bundle.neverAgainRulesComplied).toBeGreaterThanOrEqual(25);
    expect(bundle.totalNeverAgainRules).toBe(30);
    expect(bundle.neverAgainRulesComplied / bundle.totalNeverAgainRules).toBeGreaterThanOrEqual(0.85);
  });

  /**
   * T-reb-6: Evidence bundle is RATIFICATION-READY (all checks pass)
   * Tests: composite score, CASCADE-TRAP, NEVER-AGAIN RULES, 4-Muse chain — all pass
   */
  test('T-reb-6: Evidence bundle is RATIFICATION-READY — all checks pass', async ({ page }) => {
    await page.goto('/admin/ratification/evidence/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="reb-pick-id"]').fill('TEST-RATIFICATION-READY-2026-06-16');
    await page.locator('[data-testid="reb-bat-id"]').fill('BAT-PICKRATIFY-READY-V01-2026-06-16');
    await page.locator('[data-testid="reb-create"]').click();
    await page.waitForSelector('[data-testid="reb-chain-locked"]', { timeout: 60_000 });

    // W2: Verify RATIFICATION-READY badge
    const readyBadge = await page.locator('[data-testid="reb-ready-badge"]').textContent();
    expect(readyBadge).toBe('RATIFICATION-READY');

    // W3: Verify all checkboxes
    const checkboxes = await page.locator('[data-testid^="reb-check-"]').count();
    expect(checkboxes).toBeGreaterThanOrEqual(6); // At least 6 checks
    const checkedCount = await page.locator('[data-testid^="reb-check-"][data-checked="true"]').count();
    expect(checkedCount).toBe(checkboxes);
  });
});
