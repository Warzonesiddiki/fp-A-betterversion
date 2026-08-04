/**
 * GAP-1 (F-0006) known-answer tests for DebtScheduleEngine's residual
 * money drift.
 *
 * `consolidate` (monthly-payment and total-interest reductions,
 * annual debt service) and `refinance` (monthly/total savings) run raw
 * `+`, `-`, `*` over IEEE-754 doubles on currency. Interest rates and
 * ratios stay metrics. Each fixed input asserts the exact cent result with
 * `toBe`; the pre-migration float output is recorded inline.
 */

import { describe, expect, it } from 'vitest';
import { DebtScheduleEngine, type DebtInstrument } from './DebtScheduleEngine';

function instrument(id: string, principal: number, termMonths: number, rate = 0): DebtInstrument {
  return {
    id,
    name: id,
    principal,
    rate,
    termMonths,
    startDate: '2026-01-01',
    type: 'term_loan',
    paymentFrequency: 'monthly',
    amortizationType: 'fully_amortizing',
  };
}

describe('DebtScheduleEngine — money known answers (GAP-1 / F-0006)', () => {
  it('sums monthly payments exactly and drives DSCR off exact annual service (old float: 0.30000000000000004 / 3.6000000000000005)', () => {
    // Two 0%-rate 1-month instruments pay 0.1 and 0.2 per month. Annual debt
    // service is internal to consolidate (3.6 exact; old float
    // 3.6000000000000005) and feeds the coverage ratio.
    const result = DebtScheduleEngine.consolidate(
      [instrument('a', 0.1, 1), instrument('b', 0.2, 1)],
      3.6
    );

    expect(result.totalDebt).toBe(0.3);
    expect(result.totalMonthlyPayment).toBe(0.3);
    expect(result.debtServiceCoverageRatio).toBe(1);
  });

  it('computes refinance savings exactly (old float: 0.04000000000000001 / 0.01999999999999999)', () => {
    // Current: 0.66 principal, 0% rate, 6 months → 0.11/month (0.66 total).
    // Refinanced: same principal, 9 months → 0.07/month (0.63 total).
    const result = DebtScheduleEngine.refinance(instrument('cur', 0.66, 6), 0, 9, 0.01);

    expect(result.monthlySavings).toBe(0.04);
    expect(result.totalSavings).toBe(0.02);
    expect(result.breakEvenMonths).toBe(1);
  });
});
