import { describe, it, expect } from 'vitest';
import { PeriodLockEngine, type PeriodInfo } from './PeriodLockEngine';

// =============================================================================
// TEST HELPERS
// =============================================================================

function makePeriod(overrides: Partial<PeriodInfo> = {}): PeriodInfo {
  return {
    id: 'P-2026-06',
    fiscalYear: 2026,
    fiscalPeriod: 6,
    jurisdiction: 'US-GAAP',
    state: 'open',
    openedAt: '2026-06-01T00:00:00Z',
    closedAt: null,
    lockedAt: null,
    reopenedAt: null,
    approverChain: [],
    metadata: {},
    ...overrides,
  };
}

// =============================================================================
// TESTS (15 tests, ≥10 minimum)
// =============================================================================

describe('PeriodLockEngine', () => {
  it('1. validatePeriod returns valid for open period', () => {
    const r = PeriodLockEngine.validatePeriod(makePeriod());
    expect(r.valid).toBe(true);
  });

  it('2. validatePeriod flags missing lockedAt for locked state', () => {
    const r = PeriodLockEngine.validatePeriod(makePeriod({ state: 'locked' }));
    expect(r.valid).toBe(false);
  });

  it('3. validatePeriod flags missing CFO in approver chain for locked state', () => {
    const r = PeriodLockEngine.validatePeriod(
      makePeriod({ state: 'locked', lockedAt: '2026-06-30T23:59:59Z' })
    );
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('CFO'))).toBe(true);
  });

  it('4. validatePeriod flags invalid fiscal year', () => {
    const r = PeriodLockEngine.validatePeriod(makePeriod({ fiscalYear: 1800 }));
    expect(r.valid).toBe(false);
  });

  it('5. validatePeriod flags invalid fiscal period', () => {
    const r = PeriodLockEngine.validatePeriod(makePeriod({ fiscalPeriod: 13 }));
    expect(r.valid).toBe(false);
  });

  it('6. canTransition open → soft-closed returns true', () => {
    expect(PeriodLockEngine.canTransition('open', 'soft-closed')).toBe(true);
  });

  it('7. canTransition open → locked returns false', () => {
    expect(PeriodLockEngine.canTransition('open', 'locked')).toBe(false);
  });

  it('8. canTransition locked → reopened returns true (only by auditor)', () => {
    expect(PeriodLockEngine.canTransition('locked', 'reopened')).toBe(true);
  });

  it('9. softClose from open state succeeds', () => {
    const period = makePeriod();
    const r = PeriodLockEngine.softClose(period, 'u1', 'preparer', 'review complete');
    expect(r.success).toBe(true);
    expect(r.newState).toBe('soft-closed');
  });

  it('10. hardClose requires controller or cfo role', () => {
    const period = makePeriod({ state: 'soft-closed' });
    const r = PeriodLockEngine.hardClose(period, 'u1', 'preparer', 'try');
    expect(r.success).toBe(false);
  });

  it('11. lock requires CFO role (rejects controller)', () => {
    const period = makePeriod({ state: 'hard-closed' });
    const r = PeriodLockEngine.lock(period, 'u1', 'controller', 'try');
    expect(r.success).toBe(false);
    expect(r.errors.some((e) => e.includes('CFO'))).toBe(true);
  });

  it('12. lock by CFO succeeds and adds to approver chain', () => {
    const period = makePeriod({ state: 'hard-closed' });
    const r = PeriodLockEngine.lock(period, 'cfo1', 'cfo', 'final');
    expect(r.success).toBe(true);
    expect(r.transitions[0]!.approveChain).toContain('cfo');
  });

  it('13. reopen requires auditor role (rejects cfo)', () => {
    const period = makePeriod({
      state: 'locked',
      lockedAt: '2026-06-30T23:59:59Z',
      approverChain: ['cfo'],
    });
    const r = PeriodLockEngine.reopen(period, 'cfo1', 'cfo', 'try');
    expect(r.success).toBe(false);
  });

  it('14. validateApproverChain detects missing roles', () => {
    const r = PeriodLockEngine.validateApproverChain('locked', ['controller']);
    expect(r.valid).toBe(false);
    expect(r.missing).toContain('cfo');
  });

  it('15. summarize returns isImmutable=true for locked period', () => {
    const period = makePeriod({ state: 'locked', lockedAt: '2026-06-30T23:59:59Z' });
    const r = PeriodLockEngine.summarize(period);
    expect(r.isImmutable).toBe(true);
    expect(r.canEdit).toBe(false);
    expect(r.canReopen).toBe(true);
  });
});

// 16. P7-O3 sub-ms lock: multi-region ordering preserved (Chronos V3 e.ix.7)
it('16. P7-O3 multi-region lock preserves region field across all 4 regions', () => {
  const regions: Array<'US' | 'EU' | 'APAC' | 'default'> = ['US', 'EU', 'APAC', 'default'];
  for (const region of regions) {
    const period = makePeriod({ state: 'hard-closed' });
    const r = PeriodLockEngine.lock(period, 'cfo1', 'cfo', `region=${region}`, region);
    expect(r.success).toBe(true);
    expect(r.transitions[0]!.region).toBe(region);
    expect(r.transitions[0]!.timestampNs).toBeGreaterThan(0n);
    expect(r.transitions[0]!.transactionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  }
});

// 17. P7-O3 sub-ms lock: comparePeriods tiebreaker determinism (Chronos V3 e.ix.7)
it('17. comparePeriods returns deterministic ordering by (timestampNs, lamportClock, transactionId)', async () => {
  const { comparePeriods } = await import('./PeriodLockEngine');
  const period1 = makePeriod();
  const period2 = makePeriod();
  const a = PeriodLockEngine.softClose(period1, 'u1', 'preparer', 'a', 'US', 'tx-1', 1);
  const b = PeriodLockEngine.softClose(period2, 'u2', 'preparer', 'b', 'EU', 'tx-2', 2);
  expect(comparePeriods(a.transitions[0]!, b.transitions[0]!)).toBeLessThanOrEqual(0);
  expect(comparePeriods(b.transitions[0]!, a.transitions[0]!)).toBeGreaterThanOrEqual(0);
  expect(comparePeriods(a.transitions[0]!, a.transitions[0]!)).toBe(0);
});
