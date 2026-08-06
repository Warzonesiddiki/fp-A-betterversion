/**
 * GAP-1 / F-0006 known-answer tests for SOX Compliance exact-money model
 * (Wave 9 Phase 4 — Enterprise Governance).
 */
import { describe, expect, it } from 'vitest';
import { computeSOXMetrics, sumAuditAmounts } from './auditMetrics';

describe('SOXCompliancePage — known answers (GAP-1)', () => {
  it('sums fractional control value at risk exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumAuditAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumAuditAmounts([100.1, 200.2, 300.05])).toBe(600.35);
  });

  it('computes SOX metrics deterministically', () => {
    const m = computeSOXMetrics({
      controlValueAtRisk: 250_000,
      totalRevenue: 10_000_000,
      passedControls: 45,
      totalControls: 50,
      remediationCost: 15_000,
    });
    expect(m.impactPct).toBe(2.5);
    expect(m.complianceScorePct).toBe(90);
    expect(m.remediationCost).toBe(15_000);
  });

  it('returns 0 impact and score for zero denominator', () => {
    const m = computeSOXMetrics({
      controlValueAtRisk: 100_000,
      totalRevenue: 0,
      passedControls: 10,
      totalControls: 0,
      remediationCost: 0,
    });
    expect(m.impactPct).toBe(0);
    expect(m.complianceScorePct).toBe(0);
  });
});
