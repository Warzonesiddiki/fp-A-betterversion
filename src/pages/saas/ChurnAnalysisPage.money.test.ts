/**
 * GAP-1 (F-0006) known-answer tests for ChurnAnalysisPage money patterns.
 *
 * Verifies computeSubscriptionMRR and computeMRRDelta calculate
 * recurring subscription revenue and period deltas exactly.
 */

import { describe, expect, it } from 'vitest';
import { computeSubscriptionMRR, computeMRRDelta } from '@/pages/saas/ChurnAnalysisPage';

describe('ChurnAnalysisPage money patterns — known answers (GAP-1)', () => {
  it('computeSubscriptionMRR returns 0 for empty entries', () => {
    expect(computeSubscriptionMRR([])).toBe(0);
  });

  it('computeSubscriptionMRR calculates net MRR as credit minus debit', () => {
    const entries = [
      { credit: 10000, debit: 0 },
      { credit: 5000, debit: 0 },
    ];
    expect(computeSubscriptionMRR(entries)).toBe(15000);
  });

  it('computeSubscriptionMRR handles debit adjustments correctly', () => {
    const entries = [
      { credit: 10000, debit: 0 },
      { credit: 0, debit: 500 },
    ];
    expect(computeSubscriptionMRR(entries)).toBe(9500);
  });

  it('computeMRRDelta returns positive delta when currentMRR exceeds prevMRR', () => {
    expect(computeMRRDelta(25000, 20000)).toBe(5000);
  });

  it('computeMRRDelta returns negative delta when churn exceeds expansion', () => {
    expect(computeMRRDelta(18000, 20000)).toBe(-2000);
  });

  it('computeMRRDelta handles zero previous MRR correctly', () => {
    expect(computeMRRDelta(10000, 0)).toBe(10000);
  });

  it('computeSubscriptionMRR avoids IEEE-754 precision drift on fractional MRR amounts', () => {
    const entries = [
      { credit: 0.1, debit: 0 },
      { credit: 0.2, debit: 0 },
      { credit: 0, debit: 0.05 },
    ];
    expect(computeSubscriptionMRR(entries)).toBe(0.25);
  });

  it('computeMRRDelta avoids IEEE-754 precision drift on subtraction', () => {
    expect(computeMRRDelta(0.3, 0.1)).toBe(0.2);
    expect(computeMRRDelta(1000.05, 999.99)).toBe(0.06);
  });
});
