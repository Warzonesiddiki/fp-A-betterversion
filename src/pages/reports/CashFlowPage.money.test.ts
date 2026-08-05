/**
 * GAP-1 (F-0006) known-answer tests for CashFlowPage money arithmetic.
 *
 * The cash flow statement has many reduces (per-account balances, net income,
 * depreciation, working capital deltas, capex, debt change, dividends).
 * Float arithmetic drifts on the 0.1/0.2 family; routing through
 * sumMoney/subtractMoney+roundTo keeps every line cent-exact and the
 * beginning + net change = ending check exact.
 *
 * These tests don't directly call a helper (the page computes inline within
 * useMemo, coupled to useState/useGLStore). Instead they verify the money
 * arithmetic patterns used in the page produce the correct results when
 * applied to realistic GL fixtures.
 */

import { describe, expect, it } from 'vitest';
import { sumMoney, subtractMoney, roundTo } from '@/utils/money';

type Entry = {
  accountCode?: string;
  description?: string;
  debit: number;
  credit: number;
  date: string;
  period?: string;
};

/** Replica of CashFlowPage's `balance()` helper, exact-decimal backed. */
function balance(arr: readonly Entry[], prefix: string, isLiability = false): number {
  const filtered = arr.filter((e) => (e.accountCode || '').startsWith(prefix));
  if (isLiability) {
    return roundTo(sumMoney(filtered.map((e) => e.credit - e.debit)), 2);
  }
  return roundTo(sumMoney(filtered.map((e) => e.debit - e.credit)), 2);
}

function e(
  code: string,
  debit: number,
  credit: number,
  period = '2026-01',
  description = ''
): Entry {
  return { accountCode: code, debit, credit, date: `${period}-15`, period, description };
}

describe('CashFlowPage money patterns — known answers (GAP-1)', () => {
  it('balance(assets) three 0.1-debit entries → 0.30 exact', () => {
    const entries = [e('1100', 0.1, 0), e('1100', 0.1, 0), e('1100', 0.1, 0)];
    expect(balance(entries, '11')).toBe(0.3);
  });

  it('balance(assets) three 0.335-debit entries → 1.01 half-up', () => {
    const entries = [e('1100', 0.335, 0), e('1100', 0.335, 0), e('1100', 0.335, 0)];
    expect(balance(entries, '11')).toBe(1.01);
  });

  it('balance(liabilities) credit-only → positive (was negative with naive reduce)', () => {
    const entries = [e('2100', 0, 500)];
    expect(balance(entries, '21', true)).toBe(500);
  });

  it('deltaAR = priorBalance - currentBalance exact (decreased by 50)', () => {
    const prior = [e('1200', 200, 0)];
    const current = [e('1200', 150, 0)];
    const deltaAR = roundTo(subtractMoney(balance(prior, '12'), balance(current, '12')), 2);
    expect(deltaAR).toBe(50);
  });

  it('deltaAR cent-balanced: 0.1 + 0.2 - 0.3 = 0 exact', () => {
    const prior = [e('1200', 0.1, 0), e('1200', 0.2, 0)];
    const current = [e('1200', 0.3, 0)];
    const deltaAR = roundTo(subtractMoney(balance(prior, '12'), balance(current, '12')), 2);
    expect(deltaAR).toBe(0);
  });

  it('netIncome = revenue - expenses exact', () => {
    const rev = roundTo(
      sumMoney([e('4000', 0, 0.1), e('4000', 0, 0.2)].map((x) => x.credit - x.debit)),
      2
    );
    const exp = roundTo(
      sumMoney(
        [e('5000', 0.3, 0)].map((x) => x.debit - x.credit)
      ),
      2
    );
    const netIncome = roundTo(subtractMoney(rev, exp), 2);
    expect(rev).toBe(0.3);
    expect(exp).toBe(0.3);
    expect(netIncome).toBe(0);
  });

  it('operating cash flow sums cleanly: NI + Dep + ΔAR + ΔInv + ΔAP + ΔPrepaids', () => {
    const ni = 100;
    const dep = 50;
    const dAR = 20;
    const dInv = 10;
    const dAP = -5;
    const dPre = 5;
    const operating = roundTo(
      sumMoney([ni, dep, dAR, dInv, dAP, dPre]),
      2
    );
    expect(operating).toBe(180);
  });

  it('depreciation filter matches description.toLowerCase().includes("deprec")', () => {
    const entries = [
      e('6000', 50, 0, '2026-01', 'Monthly Depreciation Expense'),
      e('6000', 30, 0, '2026-01', 'Office Supplies'),
    ];
    const dep = roundTo(
      sumMoney(
        entries
          .filter(
            (x) =>
              (x.accountCode || '').startsWith('6') &&
              (x.description || '').toLowerCase().includes('deprec')
          )
          .map((x) => x.debit - x.credit)
      ),
      2
    );
    expect(dep).toBe(50);
  });

  it('dividends reduce financing: debt - dividends exact', () => {
    const debt = 100;
    const divs = 30;
    const financing = roundTo(subtractMoney(debt, divs), 2);
    expect(financing).toBe(70);
  });

  it('net change: operating + investing + financing (all positive)', () => {
    const operating = 180;
    const investing = -50; // capex
    const financing = 70; // debt draw - dividends
    const netChange = roundTo(sumMoney([operating, investing, financing]), 2);
    expect(netChange).toBe(200);
  });
});
