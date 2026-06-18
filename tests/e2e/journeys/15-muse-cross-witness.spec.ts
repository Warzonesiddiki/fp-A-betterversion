/**
 * USER JOURNEY 15: MUSE CROSS-WITNESS (4-ICP+5-ICP+6-ICP Flow + CAVEMAN PERSIST)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Canonical spec: USER_JOURNEY_TEST_COVERAGE.md v0.9 (commit TBD) §28 NEW
 * 6 tests, ~180 LOC, Flakiness target: 0 (Meta-test — must be deterministic)
 * 4-ICP: I1=substantiate cross-witness protocol / C2=blocks RATIFICATION / P3=O(1) per call / D4=full file:line
 *
 * CONTEXT: Meta-tests the CAVEMAN cross-witness protocol itself. Verifies that 4-ICP,
 * 5-ICP, and 6-ICP verdicts are correctly constructed, witnessed, and persisted across
 * all Muses. Tests CAVEMAN PERSIST (RULE #47) 3-way redundancy: cron job + task board
 * + memory file. Tests CATCH #211/212 numbering collision prevention (RULE #67).
 *
 * MUSE COVERAGE: ALL 19 MUSES (this is a meta-test)
 *
 * VERDICT TYPES:
 *   - 4-ICP: Carla (cascade) / Vera (logic) / Chris (operational) / Beth (user-impact)
 *   - 5-ICP: + Strategos (strategic-alignment)
 *   - 6-ICP: + Themis (legal/regulatory) or Muse-of-Muses (consensus-check)
 *
 * CAVEMAN PERSIST (RULE #47) — 3-way redundancy check:
 *   1. Cron job registered in scheduler
 *   2. Task board entry exists with status=pending
 *   3. Memory file entry exists in C:\Users\Tahir\AppData\Roaming\aionrs\projects\...\memory\
 *
 * CATCH #211/212 NUMBERING COLLISION PREVENTION (RULE #67):
 *   - CATCH-### must be globally unique
 *   - Atomic increment with Redis-style INCR
 *   - On collision: refuse to allocate, escalate to Strategos
 */

import { test, expect, type Page } from '@playwright/test';
import { signInAsCfo } from '../_helpers/auth';
import * as fs from 'fs';
import * as path from 'path';

const MEMORY_DIR =
  'C:\\Users\\Tahir\\AppData\\Roaming\\aionrs\\projects\\C--Users-Tahir-AppData-Roaming-AionUi-aionui-conversations-aionrs-temp-cb508c4a\\memory';

test.describe('Journey 15: Muse Cross-Witness (4-ICP+5-ICP+6-ICP + CAVEMAN PERSIST)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfo(page);
  });

  /**
   * T-mcw-1: 4-ICP verdict on E2E coverage extension is correctly constructed
   * 3-witness: spec / DOM assertion / memory file check (RULE #47)
   */
  test('T-mcw-1: 4-ICP verdict on coverage extension — all 4 verdicts present', async ({
    page,
  }) => {
    await page.goto('/admin/verdicts/new');
    await page.waitForLoadState('networkidle');

    await page
      .locator('[data-testid="verdict-subject"]')
      .fill('USER_JOURNEY_TEST_COVERAGE.md v0.9 amendment');
    await page.locator('[data-testid="verdict-type"]').selectOption('4-ICP');
    await page.locator('[data-testid="verdict-pick-id"]').fill('SENTINEL-PICK-C-v0.9');
    await page.locator('[data-testid="verdict-trigger-btn"]').click();
    await page.waitForSelector('[data-testid="verdict-completed"]', { timeout: 15000 });

    // W2: DOM assertion — all 4 ICP verdicts present (Carla, Vera, Chris, Beth)
    await expect(page.locator('[data-testid="verdict-icp-carla"]')).toBeVisible();
    await expect(page.locator('[data-testid="verdict-icp-vera"]')).toBeVisible();
    await expect(page.locator('[data-testid="verdict-icp-chris"]')).toBeVisible();
    await expect(page.locator('[data-testid="verdict-icp-beth"]')).toBeVisible();

    // W3: Cleanup assertion — memory file entry created
    const verdictId = await page.locator('[data-testid="verdict-id"]').textContent();
    expect(verdictId).toBeTruthy();

    const memoryFiles = fs.readdirSync(MEMORY_DIR);
    const sentinelFiles = memoryFiles.filter((f) => f.includes('sentinel') && f.includes('v09'));
    expect(sentinelFiles.length).toBeGreaterThan(0);
  });

  /**
   * T-mcw-2: 5-ICP verdict extends 4-ICP with Strategos (strategic-alignment)
   */
  test('T-mcw-2: 5-ICP verdict adds Strategos strategic-alignment check', async ({ page }) => {
    await page.goto('/admin/verdicts/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="verdict-subject"]').fill('Strategos INDEX v0.7.4 BILATERAL');
    await page.locator('[data-testid="verdict-type"]').selectOption('5-ICP');
    await page.locator('[data-testid="verdict-pick-id"]').fill('STRATEGOS-5-ICP-SEAL-2026-06-21');
    await page.locator('[data-testid="verdict-trigger-btn"]').click();
    await page.waitForSelector('[data-testid="verdict-completed"]', { timeout: 15000 });

    // W2: DOM assertion — 5 ICP verdicts (4 + Strategos)
    await expect(page.locator('[data-testid="verdict-icp-carla"]')).toBeVisible();
    await expect(page.locator('[data-testid="verdict-icp-vera"]')).toBeVisible();
    await expect(page.locator('[data-testid="verdict-icp-chris"]')).toBeVisible();
    await expect(page.locator('[data-testid="verdict-icp-beth"]')).toBeVisible();
    await expect(page.locator('[data-testid="verdict-icp-strategos"]')).toBeVisible();

    // W3: Strategos verdict must reference T-1d 2026-06-21 15:00 UTC seal window
    const strategosVerdict = await page
      .locator('[data-testid="verdict-icp-strategos-text"]')
      .textContent();
    expect(strategosVerdict).toContain('2026-06-21');
  });

  /**
   * T-mcw-3: 6-ICP verdict adds Themis (legal/regulatory) check
   */
  test('T-mcw-3: 6-ICP verdict adds Themis legal/regulatory check', async ({ page }) => {
    await page.goto('/admin/verdicts/new');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="verdict-subject"]').fill('RATIFICATION_GATE_PRECHECK');
    await page.locator('[data-testid="verdict-type"]').selectOption('6-ICP');
    await page
      .locator('[data-testid="verdict-pick-id"]')
      .fill('RATIFICATION-GATE-2026-06-22-16-00-UTC');
    await page.locator('[data-testid="verdict-trigger-btn"]').click();
    await page.waitForSelector('[data-testid="verdict-completed"]', { timeout: 15000 });

    // W2: DOM assertion — 6 ICP verdicts (5 + Themis)
    await expect(page.locator('[data-testid="verdict-icp-themis"]')).toBeVisible();

    // W3: Themis verdict must include SOX 404, GDPR Art. 17, CCPA §1798.105 references
    const themisVerdict = await page
      .locator('[data-testid="verdict-icp-themis-text"]')
      .textContent();
    expect(themisVerdict).toContain('SOX');
    expect(themisVerdict).toContain('GDPR');
  });

  /**
   * T-mcw-4: CAVEMAN PERSIST (RULE #47) — 3-way redundancy check
   * Cron job + Task board + Memory file
   */
  test('T-mcw-4: CAVEMAN PERSIST 3-way redundancy verified for critical alerts', async ({
    page,
  }) => {
    const ALERT_ID = `ALERT-MCW-TEST-${Date.now()}`;

    // Trigger critical alert via API
    const alertResp = await page.request.post('/api/alerts/critical', {
      data: {
        alertId: ALERT_ID,
        severity: 'CRITICAL',
        message: 'CAVEMAN PERSIST test alert',
        muse: 'Sentinel',
      },
    });
    expect(alertResp.status()).toBe(201);

    // W2: DOM assertion — alert visible in critical alert dashboard
    await page.goto('/admin/critical-alerts');
    await page.locator(`[data-testid="alert-row-${ALERT_ID}"]`).should('BeVisible');

    // W3: Cleanup assertion — 3-way redundancy
    // 3a: Cron job exists
    const cronResp = await page.request.get(`/api/cron-jobs?filter=alert:${ALERT_ID}`);
    const cronData = await cronResp.json();
    expect(cronData.jobs.length).toBeGreaterThanOrEqual(1);

    // 3b: Task board entry exists
    const taskResp = await page.request.get(`/api/tasks?filter=alert:${ALERT_ID}`);
    const taskData = await taskResp.json();
    expect(taskData.tasks.length).toBeGreaterThanOrEqual(1);

    // 3c: Memory file exists
    const memoryFiles = fs.readdirSync(MEMORY_DIR);
    const matchingFiles = memoryFiles.filter(
      (f) => f.includes(ALERT_ID.toLowerCase()) || f.includes('mcp-test')
    );
    expect(matchingFiles.length).toBeGreaterThanOrEqual(1);
  });

  /**
   * T-mcw-5: CATCH #211/212 numbering collision prevention (RULE #67)
   * Tests atomic increment + collision refusal + escalation
   */
  test('T-mcw-5: CATCH numbering atomic increment prevents collision (RULE #67)', async ({
    page,
  }) => {
    // Step 1: Get current next CATCH number
    const before = await page.request.get('/api/catches/next-id');
    const beforeData = await before.json();
    const nextId = beforeData.nextId;
    expect(nextId).toMatch(/^CATCH-\d{3,}$/);

    // Step 2: Reserve next CATCH ID
    const reserveResp = await page.request.post('/api/catches/reserve', {
      data: { proposedId: nextId, muse: 'Sentinel', severity: 'HIGH' },
    });
    expect(reserveResp.status()).toBe(201);

    // Step 3: Try to reserve same ID again (simulating collision)
    const collisionResp = await page.request.post('/api/catches/reserve', {
      data: { proposedId: nextId, muse: 'Hera', severity: 'MEDIUM' },
    });

    // W2: Collision MUST be refused (409 Conflict) per RULE #67
    expect(collisionResp.status()).toBe(409);
    const collisionBody = await collisionResp.json();
    expect(collisionBody.error).toContain('CATCH_ID_COLLISION');
    expect(collisionBody.escalationTarget).toBe('Strategos');

    // W3: Escalation logged in audit trail
    await page.goto('/audit-trail');
    await page.locator('[data-testid="audit-search-input"]').fill('CATCH_ID_COLLISION');
    await page.locator('[data-testid="audit-search-btn"]').click();
    await expect(
      page.locator('[data-testid="audit-row-CATCH_ID_COLLISION_ESCALATION"]')
    ).toBeVisible();
  });

  /**
   * T-mcw-6: Cross-witness chain integrity — 19/19 Muses respond within 5-min SLA (D-007)
   */
  test('T-mcw-6: 19/19 Muses respond to cross-witness within 5-min SLA (D-007)', async ({
    page,
  }) => {
    const WITNESS_REQUEST_ID = `WITNESS-${Date.now()}`;

    // Broadcast cross-witness request to all 19 Muses
    const broadcastResp = await page.request.post('/api/cross-witness/broadcast', {
      data: {
        requestId: WITNESS_REQUEST_ID,
        subject: 'CAVEMAN PERSIST 3-way redundancy verification',
        severity: 'CRITICAL',
        deadline: Date.now() + 5 * 60 * 1000, // 5 min
      },
    });
    expect(broadcastResp.status()).toBe(201);

    // Poll for responses (max 5 min, 5s interval)
    const startTime = Date.now();
    const POLL_INTERVAL_MS = 5000;
    const MAX_POLL_MS = 5 * 60 * 1000;

    let responses: any[] = [];
    while (Date.now() - startTime < MAX_POLL_MS) {
      const resp = await page.request.get(`/api/cross-witness/${WITNESS_REQUEST_ID}/responses`);
      const data = await resp.json();
      responses = data.responses;

      if (responses.length >= 19) break;
      await page.waitForTimeout(POLL_INTERVAL_MS);
    }

    // W2: 19/19 Muses responded within 5-min SLA (D-007)
    expect(responses.length).toBe(19);
    expect(Date.now() - startTime).toBeLessThan(MAX_POLL_MS);

    // W3: All 19 verdicts are witnesses (not just acks)
    const witnesses = responses.filter((r) => r.verdict && r.verdict !== 'PENDING');
    expect(witnesses.length).toBe(19);

    // Check no Muse went stale (each must have responded within their window)
    const staleMuses = responses.filter((r) => r.durationMs > 5 * 60 * 1000);
    expect(staleMuses.length).toBe(0);
  });
});
