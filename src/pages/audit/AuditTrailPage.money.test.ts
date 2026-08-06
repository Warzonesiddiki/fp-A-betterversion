/**
 * GAP-1 / F-0006 known-answer tests for Audit Trail exact-money model
 * (Wave 9 Phase 4 — Enterprise Governance).
 */
import { describe, expect, it } from 'vitest';
import { computeAuditDelta, computeAuditRatioPct, sumAuditAmounts } from './auditMetrics';

describe('AuditTrailPage — known answers (GAP-1)', () => {
  it('sums fractional audit transaction amounts exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumAuditAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumAuditAmounts([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('computes exact delta and percentage change without float drift', () => {
    const res = computeAuditDelta(1000, 1500);
    expect(res.delta).toBe(500);
    expect(res.pct).toBe(50.0);

    const res2 = computeAuditDelta(1.01, 1.03);
    expect(res2.delta).toBe(0.02);
  });

  it('returns 0 percentage change when original value is 0 (zero-denominator guard)', () => {
    const res = computeAuditDelta(0, 500);
    expect(res.delta).toBe(500);
    expect(res.pct).toBe(0);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeAuditRatioPct(50, 0)).toBe(0);
  });
});
