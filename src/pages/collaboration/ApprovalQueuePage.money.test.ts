/**
 * GAP-1 / F-0006 known-answer tests for Approval Queue exact-money model
 * (Wave 9 Phase 4 — Enterprise Governance).
 */
import { describe, expect, it } from 'vitest';
import {
  computeApprovalMetrics,
  computeApprovalRatePct,
  computeApprovalThreshold,
  sumApprovalAmounts,
} from './collaborationMetrics';

describe('ApprovalQueuePage — known answers (GAP-1)', () => {
  it('sums fractional approval amounts exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumApprovalAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumApprovalAmounts([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('0.335 × 3 rounds half-up to 1.01 (threshold scaling)', () => {
    expect(computeApprovalThreshold(0.335, 3)).toBe(1.01);
  });

  it('returns 0 approval rate for zero denominator', () => {
    expect(computeApprovalRatePct(5, 0)).toBe(0);
  });

  it('computes exact approval metrics summary without float drift', () => {
    const m = computeApprovalMetrics([
      { amount: 100_000.1, status: 'Approved' },
      { amount: 200_000.2, status: 'Pending' },
      { amount: 50_000.05, status: 'Rejected' },
    ]);
    expect(m.totalAmount).toBe(350_000.35);
    expect(m.approvedAmount).toBe(100_000.1);
    expect(m.pendingAmount).toBe(200_000.2);
    expect(m.approvalRatePct).toBe(33.33);
  });
});
