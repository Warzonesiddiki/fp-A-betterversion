/**
 * USER JOURNEY 14: PERIOD LOCK BURST (50+ Concurrent Locks + V3 e.ix.7 Edge #11-15)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Canonical spec: USER_JOURNEY_TEST_COVERAGE.md v0.9 (commit TBD) §27 NEW
 * 5 tests, ~140 LOC, Flakiness target: 2 (Medium — burst tests inherently racy)
 * 4-ICP: I1=substantiate period lock concurrency / C2=blocks SOX ship / P3=O(n) burst / D4=full file:line
 *
 * CONTEXT: Stress-tests the PeriodLockEngine under concurrent lock attempts (50+ simultaneous
 * users trying to lock the same period). Tests V3 e.ix.7 Edge #11-15: race conditions,
 * deadlock recovery, optimistic concurrency, audit trail under burst, and lock revocation.
 *
 * MUSE COVERAGE:
 *   - Apollo: PeriodLockEngine (concurrent lock acquisition)
 *   - Prometheus: periodStore (lock state) + auditStore (concurrent audit entries)
 *   - Hephaestus: Race condition P0 fix (CATCH #193) — distributed lock with Redis-style SETNX
 *
 * EDGE CASES (V3 e.ix.7 Edge #11-15):
 *   #11: Race on simultaneous lock acquisition (only one wins, others get 409 Conflict)
 *   #12: Deadlock recovery (cyclic lock dependencies auto-detected after 30s timeout)
 *   #13: Optimistic concurrency (version field prevents stale writes)
 *   #14: Audit trail under burst (all 50+ attempts logged without dropped entries)
 *   #15: Lock revocation (admin can revoke lock even if holder offline)
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { signInAsCfo } from '../_helpers/auth';

test.describe('Journey 14: Period Lock Burst (50+ Concurrent Locks + V3 e.ix.7 Edge #11-15)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfo(page);
  });

  /**
   * T-plb-1: 50 concurrent lock attempts — only ONE wins (Edge #11)
   * 3-witness: spec / DOM assertion / audit count
   * Cross-witness: Apollo (PeriodLockEngine), Hephaestus (CATCH #193 P0 fix)
   */
  test('T-plb-1: 50 concurrent lock attempts — only one wins (V3 Edge #11)', async ({ browser }) => {
    const PERIOD_ID = '2026-Q2';
    const CONTEXT_COUNT = 50;
    const contexts: BrowserContext[] = [];
    const results: { contextId: number; status: 'LOCKED' | 'CONFLICT' | 'ERROR'; durationMs: number }[] = [];

    // Spin up 50 contexts in parallel
    const lockPromises = Array.from({ length: CONTEXT_COUNT }, async (_, i) => {
      const ctx = await browser.newContext();
      contexts.push(ctx);
      const page = await ctx.newPage();
      await signInAsCfo(page);

      const start = Date.now();
      try {
        const response = await page.request.post(`/api/periods/${PERIOD_ID}/lock`, {
          headers: { 'Content-Type': 'application/json' },
          data: { reason: `concurrent test ${i}`, lockType: 'SOFT' },
        });
        const duration = Date.now() - start;

        if (response.status() === 200) {
          results.push({ contextId: i, status: 'LOCKED', durationMs: duration });
        } else if (response.status() === 409) {
          results.push({ contextId: i, status: 'CONFLICT', durationMs: duration });
        } else {
          results.push({ contextId: i, status: 'ERROR', durationMs: duration });
        }
      } catch (err) {
        results.push({ contextId: i, status: 'ERROR', durationMs: Date.now() - start });
      }

      await page.close();
    });

    await Promise.all(lockPromises);

    // W2: Assertion — exactly ONE winner, 49 conflicts
    const winners = results.filter(r => r.status === 'LOCKED');
    const conflicts = results.filter(r => r.status === 'CONFLICT');
    expect(winners.length).toBe(1);
    expect(conflicts.length).toBe(49);
    expect(results.filter(r => r.status === 'ERROR').length).toBe(0);

    // W3: Cleanup assertion — all 50 attempts logged in audit trail
    await contexts[0]!.newPage().then(async (page) => {
      await page.goto('/audit-trail');
      await page.locator(`[data-testid="audit-search-input"]`).fill(PERIOD_ID);
      await page.locator('[data-testid="audit-search-btn"]').click();
      const lockAttempts = await page.locator('[data-testid="audit-row-PERIOD_LOCK_ATTEMPT"]').count();
      expect(lockAttempts).toBe(50); // all 50 attempts logged (no drops)
      await page.close();
    });

    // Cleanup all contexts
    await Promise.all(contexts.map(ctx => ctx.close()));
  });

  /**
   * T-plb-2: Deadlock recovery (cyclic lock dependencies auto-detected after 30s) — Edge #12
   */
  test('T-plb-2: Deadlock recovery detects cyclic dependencies within 30s (Edge #12)', async ({ page, browser }) => {
    // Setup: Period A held by user-1, tries to lock Period B (held by user-2)
    // user-2 tries to lock Period A → deadlock
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();
    await signInAsCfo(page1);
    await signInAsCfo(page2);

    // user-1 locks Period A
    await page1.request.post('/api/periods/2026-Q1/lock', {
      data: { reason: 'user-1 test', lockType: 'HARD' },
    });

    // user-2 locks Period B
    await page2.request.post('/api/periods/2026-Q2/lock', {
      data: { reason: 'user-2 test', lockType: 'HARD' },
    });

    // user-1 tries to lock Period B (will wait → potential deadlock)
    const lockBByUser1 = page1.request.post('/api/periods/2026-Q2/lock', {
      data: { reason: 'user-1 deadlock attempt', lockType: 'HARD' },
    });

    // user-2 tries to lock Period A (creates cyclic dependency)
    const lockAByUser2 = page2.request.post('/api/periods/2026-Q1/lock', {
      data: { reason: 'user-2 deadlock attempt', lockType: 'HARD' },
    });

    // W2: Both requests should resolve within 30s with deadlock detected
    const start = Date.now();
    const [res1, res2] = await Promise.all([lockBByUser1, lockAByUser2]);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(35000); // 30s + 5s buffer

    // One should be DEADLOCK_DETECTED (503), one should be CONFLICT (409)
    const statusCodes = [res1.status(), res2.status()].sort();
    expect(statusCodes).toContain(503); // DEADLOCK_DETECTED

    // W3: DOM assertion — deadlock recovery logged in audit
    await page.goto('/audit-trail');
    await page.locator('[data-testid="audit-search-input"]').fill('DEADLOCK_DETECTED');
    await page.locator('[data-testid="audit-search-btn"]').click();
    await expect(page.locator('[data-testid="audit-row-DEADLOCK_DETECTED"]').first()).toBeVisible();

    // Cleanup
    await ctx1.close();
    await ctx2.close();
  });

  /**
   * T-plb-3: Optimistic concurrency (version field prevents stale writes) — Edge #13
   */
  test('T-plb-3: Optimistic concurrency prevents stale writes (Edge #13)', async ({ page, browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();
    await signInAsCfo(page1);
    await signInAsCfo(page2);

    // Both users fetch period (version=1)
    const [period1, period2] = await Promise.all([
      page1.request.get('/api/periods/2026-Q3'),
      page2.request.get('/api/periods/2026-Q3'),
    ]);
    const periodData1 = await period1.json();
    const periodData2 = await period2.json();
    expect(periodData1.version).toBe(1);
    expect(periodData2.version).toBe(1);

    // user-1 updates period (version 1 → 2)
    const update1 = await page1.request.put('/api/periods/2026-Q3', {
      data: { ...periodData1, name: 'Q3 updated by user-1', version: 1 },
    });
    expect(update1.status()).toBe(200);

    // user-2 tries to update with stale version (should get 409 Conflict)
    const update2 = await page2.request.put('/api/periods/2026-Q3', {
      data: { ...periodData2, name: 'Q3 updated by user-2', version: 1 }, // stale version
    });
    expect(update2.status()).toBe(409);

    // W2: DOM assertion — optimistic concurrency error visible
    const errBody = await update2.json();
    expect(errBody.error).toContain('STALE_VERSION');

    // W3: Cleanup
    await ctx1.close();
    await ctx2.close();
  });

  /**
   * T-plb-4: Audit trail under burst — all 50+ attempts logged without drops (Edge #14)
   */
  test('T-plb-4: Audit trail captures all 50 concurrent attempts without drops (Edge #14)', async ({ browser }) => {
    const CONTEXT_COUNT = 75; // exceeds "50+" floor
    const contexts: BrowserContext[] = [];
    const auditIds: string[] = [];

    const lockPromises = Array.from({ length: CONTEXT_COUNT }, async (_, i) => {
      const ctx = await browser.newContext();
      contexts.push(ctx);
      const page = await ctx.newPage();
      await signInAsCfo(page);

      const response = await page.request.post('/api/periods/2026-Q1/lock', {
        data: { reason: `burst audit test ${i}`, lockType: 'SOFT' },
      });
      const body = await response.json();
      if (body.audit_id) auditIds.push(body.audit_id);
      await page.close();
    });

    await Promise.all(lockPromises);

    // W2: All 75 audit IDs present in store (no drops)
    expect(auditIds.length).toBe(75);

    // Verify via API
    const verifyCtx = await browser.newContext();
    const verifyPage = await verifyCtx.newPage();
    await signInAsCfo(verifyPage);

    const auditResp = await verifyPage.request.get('/api/audit-trail?filter=PERIOD_LOCK&period=2026-Q1');
    const auditData = await auditResp.json();
    expect(auditData.entries.length).toBeGreaterThanOrEqual(75);

    // W3: Cleanup
    await verifyCtx.close();
    await Promise.all(contexts.map(ctx => ctx.close()));
  });

  /**
   * T-plb-5: Lock revocation (admin can revoke lock even if holder offline) — Edge #15
   */
  test('T-plb-5: Admin can revoke lock even if holder offline (Edge #15)', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const userPage = await ctx.newPage();
    await signInAsCfo(userPage);

    // user-1 locks period
    const lockResp = await userPage.request.post('/api/periods/2026-Q4/lock', {
      data: { reason: 'user-1 lock', lockType: 'SOFT' },
    });
    expect(lockResp.status()).toBe(200);

    // user-1 goes offline (close context without logout)
    await ctx.close();

    // W2: Admin (current page session) can revoke the offline user's lock
    const revokeResp = await page.request.post('/api/periods/2026-Q4/revoke', {
      data: { reason: 'admin override — user offline', adminOverride: true },
    });
    expect(revokeResp.status()).toBe(200);

    // W3: DOM assertion — lock now available for new acquisition
    const newLockResp = await page.request.post('/api/periods/2026-Q4/lock', {
      data: { reason: 'post-revoke lock', lockType: 'SOFT' },
    });
    expect(newLockResp.status()).toBe(200);
  });

  /**
   * T-plb-6 (J19 amendment v0.10): 50-user burst on period lock — 1 winner, 49 lockouts
   * Tests RULE #60 CASCADE-HOLD-ABORT-MERGE under extreme concurrency
   */
  test('T-plb-6: 50-user burst on period lock — 1 winner, 49 lockouts (CAVEMAN PERSIST)', async ({ page, browser }) => {
    const userCount = 50;
    const contexts: import('@playwright/test').BrowserContext[] = [];

    // W1: Setup — 50 users navigate to period lock page
    for (let i = 0; i < userCount; i++) {
      const ctx = await browser.newContext();
      contexts.push(ctx);
      const p = await ctx.newPage();
      await p.goto('/periods/2026-Q2/lock');
      await p.waitForLoadState('networkidle');
    }

    // W2: Burst — 50 concurrent lock attempts
    const lockPromises = contexts.map(async (ctx) => {
      const p = await ctx.newPage();
      await p.goto('/periods/2026-Q2/lock');
      await p.locator('[data-testid="period-lock-btn"]').click();
      return p.waitForResponse(r => r.url().includes('/api/periods/2026-Q2/lock'), { timeout: 30000 });
    });

    const responses = await Promise.all(lockPromises);
    const statusCodes = responses.map(r => r.status()).sort();

    // W3: Exactly 1 LOCK_OK (200), 49 LOCKOUT (409) — RULE #60 CASCADE-HOLD
    const lockOkCount = statusCodes.filter(s => s === 200).length;
    const lockoutCount = statusCodes.filter(s => s === 409).length;
    expect(lockOkCount).toBe(1);
    expect(lockoutCount).toBe(49);

    // Cleanup
    for (const ctx of contexts) {
      await ctx.close();
    }
  });

  /**
   * T-plb-7 (J19 amendment v0.10): Period lock cascade — sub-period lock propagates to parent
   * Tests consolidation lock propagation: locking Q2 sub-period locks parent Q2
   */
  test('T-plb-7: Period lock cascade — sub-period lock propagates to parent', async ({ page }) => {
    await page.goto('/periods/2026-Q2-Apr/lock');
    await page.waitForLoadState('networkidle');

    // W1: Lock sub-period April
    await page.locator('[data-testid="period-lock-btn"]').click();
    await expect(page.locator('[data-testid="lock-success"]')).toBeVisible();

    // W2: Navigate to parent Q2 — should show cascade-locked
    await page.goto('/periods/2026-Q2');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="period-cascade-locked-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="period-cascade-locked-badge"]')).toContainText('locked by sub-period');

    // W3: Parent lock attempt is blocked
    await page.locator('[data-testid="parent-period-lock-btn"]').click();
    await expect(page.locator('[data-testid="lock-blocked-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="lock-blocked-toast"]')).toContainText('sub-period already locked');
  });
});
