/**
 * GAP-1 (F-0006) known-answer tests for ReconciliationPage money arithmetic.
 *
 * The ReconciliationPage does not export a standalone compute function (it's
 * tightly coupled to React state). Instead, we verify the money primitive
 * helpers produce exact results for the reconciliation patterns used:
 * toDecimal accumulation for GL balances, subtractMoney for diffs,
 * and formatMoney for CSV export.
 */

import { describe, expect, it } from 'vitest';
import { toDecimal, subtractMoney, roundTo, formatMoney } from '@/utils/money';

describe('ReconciliationPage money patterns — known answers (GAP-1)', () => {
  it('GL balance accumulation: 0.1+0.2 debit, 0 credit → 0.3 (no float drift)', () => {
    // Simulate glBalances accumulation
    let acc = toDecimal(0);
    acc = acc.plus(toDecimal(0.1)).minus(toDecimal(0));
    acc = acc.plus(toDecimal(0.2)).minus(toDecimal(0));
    expect(roundTo(acc, 2)).toBe(0.3);
  });

  it('diff = expected - actual with 0.1+0.2=0.3 vs 0.3 → 0 exactly', () => {
    const expected = 0.3;
    const actual = 0.3;
    const diff = roundTo(subtractMoney(expected, actual), 2);
    expect(diff).toBe(0);
  });

  it('diff with float trap: (0.1+0.2) computed vs 0.3 literal → 0 exactly', () => {
    // In old float code: (0.1 + 0.2) - 0.3 = 5.551115123125783e-17
    // With money: subtractMoney(0.3, 0.3) = 0
    let glBalance = toDecimal(0);
    glBalance = glBalance.plus(toDecimal(0.1));
    glBalance = glBalance.plus(toDecimal(0.2));
    const expected = roundTo(glBalance, 2);
    const diff = roundTo(subtractMoney(expected, 0.3), 2);
    expect(diff).toBe(0);
  });

  it('formatMoney produces 2-decimal CSV-safe output (replaces toFixed(2))', () => {
    expect(formatMoney(0.1, { places: 2 })).toBe('0.10');
    expect(formatMoney(1, { places: 2 })).toBe('1.00');
    expect(formatMoney(-5.5, { places: 2 })).toBe('-5.50');
  });

  it('three 0.335 entries → GL balance 1.01 after roundTo', () => {
    let acc = toDecimal(0);
    acc = acc.plus(toDecimal(0.335));
    acc = acc.plus(toDecimal(0.335));
    acc = acc.plus(toDecimal(0.335));
    expect(roundTo(acc, 2)).toBe(1.01);
  });
});
