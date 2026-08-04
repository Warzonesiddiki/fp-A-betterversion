/**
 * GAP-1 (F-0006) known-answer tests for LoanAmortizationEngine's residual
 * money drift.
 *
 * The main `schedule()` path was already migrated; `withPrepayment`,
 * `balloonPayment`, and `totalInterest` still ran raw `+`, `-`, `*`, `+=`
 * over IEEE-754 doubles on currency (principal/interest/payment/balance).
 * Each fixed input asserts the exact cent result with `toBe`; the
 * pre-migration float output is recorded inline.
 */

import { describe, expect, it } from 'vitest';
import { LoanAmortizationEngine, type AmortizationRow } from './LoanAmortizationEngine';

describe('LoanAmortizationEngine — money known answers (GAP-1 / F-0006)', () => {
  it('computes balloon payments with cent-exact rows (old float: 4.594650000000001 / 13.781923250000001)', () => {
    const result = LoanAmortizationEngine.balloonPayment(1000, 0.06, 12, 3);

    expect(result.schedule[0]?.interest).toBe(5);
    expect(result.schedule[0]?.balance).toBe(918.93);
    // Old float: 918.93 × 0.005 = 4.594650000000001 and balance
    // 837.4546500000001; exact decimal cents: 4.59 / 837.45.
    expect(result.schedule[1]?.interest).toBe(4.59);
    expect(result.schedule[1]?.balance).toBe(837.45);
    // Balloon month: payment = balance + interest.
    expect(result.schedule[2]?.payment).toBe(759.76);
    expect(result.schedule[2]?.principal).toBe(755.57);
    expect(result.schedule[2]?.balance).toBe(0);
    // Old float totalInterest: 13.781923250000001; totalPayment:
    // 931.8991965000002.
    expect(result.totalInterest).toBe(13.78);
    expect(result.totalPayment).toBe(931.9);
  });

  it('recomputes a prepaid schedule with exact decimals (old float: 2.799374513190423)', () => {
    const schedule = LoanAmortizationEngine.schedule(1000, 0.06, 12).schedule;
    const result = LoanAmortizationEngine.withPrepayment(schedule, 100, 5);

    // Prepaid balance at month 5: 590.58 − 100 = 490.58; interest =
    // 490.58 × (3.37 / 590.58) = 2.799374513190423 in float; exact cent: 2.8.
    const m5 = result.find((r) => r.month === 5);
    expect(m5?.interest).toBe(2.8);
    expect(m5?.principal).toBe(83.27);
    expect(m5?.balance).toBe(407.31);

    const m6 = result.find((r) => r.month === 6);
    expect(m6?.interest).toBe(2.37);
    expect(m6?.balance).toBe(323.61);
  });

  it('keeps pre-month rows untouched', () => {
    const schedule = LoanAmortizationEngine.schedule(1000, 0.06, 12).schedule;
    const result = LoanAmortizationEngine.withPrepayment(schedule, 100, 5);

    const m1 = result.find((r) => r.month === 1);
    expect(m1?.payment).toBe(86.07);
    expect(m1?.interest).toBe(5);
    expect(m1?.balance).toBe(918.93);
  });

  it('sums total interest exactly (old float: 0.6000000000000001)', () => {
    const schedule: AmortizationRow[] = [
      { month: 1, payment: 0.5, principal: 0.4, interest: 0.1, balance: 0.6 },
      { month: 2, payment: 0.5, principal: 0.3, interest: 0.2, balance: 0.3 },
      { month: 3, payment: 0.3, principal: 0, interest: 0.3, balance: 0 },
    ];

    expect(LoanAmortizationEngine.totalInterest(schedule)).toBe(0.6);
  });
});
