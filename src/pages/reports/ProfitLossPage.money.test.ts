/**
 * GAP-1 (F-0006) known-answer tests for ProfitLossPage computeProfitLoss.
 *
 * The P&L is the canonical financial statement: Revenue − COGS − Expenses = NI.
 * Float arithmetic drifts on cent-equal books (e.g. 0.1 + 0.2 ≠ 0.3) which
 * produces a "your books don't balance" error on a perfectly balanced ledger.
 * Routing through sumMoney/subtractMoney/divideMoney+roundTo keeps the
 * statement cent-exact and the gross/net margin percent exact to 2 places.
 *
 * Falsification: under raw `reduce +` and raw `a - b`, the 0.1/0.2 family
 * and 1/3 * 100 produce 0.30000000000000004 and 33.33333… respectively.
 * Restored, results are exact.
 */

import { describe, expect, it } from 'vitest';
import { computeProfitLoss } from './ProfitLossPage';

type Entry = {
  accountCode?: string;
  debit: number;
  credit: number;
  date: string;
  period?: string;
};

function e(code: string, debit: number, credit: number, period = '2026-01'): Entry {
  return { accountCode: code, debit, credit, date: `${period}-01`, period };
}

describe('computeProfitLoss — money known answers (GAP-1)', () => {
  it('empty entries → all zeros (control)', () => {
    const r = computeProfitLoss([]);
    expect(r.totalRevenue).toBe(0);
    expect(r.totalCOGS).toBe(0);
    expect(r.totalExpenses).toBe(0);
    expect(r.grossProfit).toBe(0);
    expect(r.netIncome).toBe(0);
    expect(r.grossMargin).toBe(0);
    expect(r.netMargin).toBe(0);
    expect(r.entryCount).toBe(0);
  });

  it('three 0.1 revenue entries → 0.30 exact (old: 0.30000000000000004)', () => {
    const r = computeProfitLoss([
      e('4000', 0, 0.1),
      e('4000', 0, 0.1),
      e('4000', 0, 0.1),
    ]);
    expect(r.totalRevenue).toBe(0.3);
  });

  it('three 0.335 revenue entries → 1.01 half-up (old: 1.00)', () => {
    const r = computeProfitLoss([
      e('4000', 0, 0.335),
      e('4000', 0, 0.335),
      e('4000', 0, 0.335),
    ]);
    expect(r.totalRevenue).toBe(1.01);
  });

  it('Revenue − COGS = GrossProfit exact (1000 − 333.33 = 666.67)', () => {
    const r = computeProfitLoss([
      e('4000', 0, 1000),
      e('5000', 333.33, 0),
    ]);
    expect(r.totalRevenue).toBe(1000);
    expect(r.totalCOGS).toBe(333.33);
    expect(r.grossProfit).toBe(666.67);
  });

  it('GrossProfit − Expenses = NetIncome exact', () => {
    const r = computeProfitLoss([
      e('4000', 0, 1000),
      e('5000', 400, 0),
      e('6000', 200, 0),
    ]);
    expect(r.grossProfit).toBe(600);
    expect(r.totalExpenses).toBe(200);
    expect(r.netIncome).toBe(400);
  });

  it('grossMargin = 1/3 * 100 = 33.33 exact (old: 33.33333...)', () => {
    const r = computeProfitLoss([
      e('4000', 0, 100),
      e('5000', 66.67, 0),
    ]);
    expect(r.totalRevenue).toBe(100);
    expect(r.grossProfit).toBe(33.33);
    expect(r.grossMargin).toBe(33.33);
  });

  it('netMargin = 1/3 * 100 = 33.33 exact', () => {
    const r = computeProfitLoss([
      e('4000', 0, 100),
      e('5000', 50, 0),
      e('6000', 16.67, 0),
    ]);
    expect(r.netIncome).toBe(33.33);
    expect(r.netMargin).toBe(33.33);
  });

  it('cent-balanced books: 0.1 + 0.2 - 0.3 = 0 exact', () => {
    const r = computeProfitLoss([
      e('4000', 0, 0.1),
      e('4000', 0, 0.2),
      e('5000', 0.3, 0),
    ]);
    expect(r.totalRevenue).toBe(0.3);
    expect(r.totalCOGS).toBe(0.3);
    expect(r.grossProfit).toBe(0);
    expect(r.netIncome).toBe(0);
  });

  it('period filter excludes entries after the cutoff', () => {
    const r = computeProfitLoss(
      [
        e('4000', 0, 100, '2026-01'),
        e('4000', 0, 200, '2026-02'),
        e('4000', 0, 400, '2026-03'),
      ],
      '2026-02'
    );
    expect(r.totalRevenue).toBe(300);
    expect(r.entryCount).toBe(2);
  });

  it('Math.abs(credit - debit) on COGS makes credit-also-positive', () => {
    // COGS accounts are usually debited. But if a credit shows up (e.g. reversal),
    // abs() ensures the COGS line is still summed as a positive expense.
    const r = computeProfitLoss([
      e('4000', 0, 1000),
      e('5000', 100, 50), // net amount = |100 - 50| = 50
    ]);
    expect(r.totalCOGS).toBe(50);
  });
});

describe('computeProfitLoss — Phase 2 classification & sign contract (F-P2-01/F-P2-02)', () => {
  type TypedEntry = Entry & { accountType?: string };

  it('account type beats code prefix: Revenue typed 1010 counts as revenue', () => {
    const r = computeProfitLoss([
      { accountCode: '1010', accountType: 'Revenue', debit: 0, credit: 500, date: '2026-01-01', period: '2026-01' },
    ] as TypedEntry[]);
    expect(r.totalRevenue).toBe(500);
  });

  it('account type beats code prefix: OpEx typed 4010 counts as expense, not revenue', () => {
    const r = computeProfitLoss([
      { accountCode: '4010', accountType: 'OpEx', debit: 200, credit: 0, date: '2026-01-01', period: '2026-01' },
    ] as TypedEntry[]);
    expect(r.totalExpenses).toBe(200);
    expect(r.totalRevenue).toBe(0);
  });

  it('a credit-heavy expense is negative — Math.abs sign destruction removed', () => {
    const r = computeProfitLoss([e('4000', 0, 1000), e('6010', 50, 100)]);
    expect(r.totalExpenses).toBe(-50);
    expect(r.netIncome).toBe(1050);
  });

  it('interest and tax classes are inside total expenses so P&L articulates with the BS', () => {
    const r = computeProfitLoss([e('4000', 0, 1000), e('7010', 120, 0), e('8010', 80, 0)]);
    expect(r.totalExpenses).toBe(200);
    expect(r.netIncome).toBe(800);
  });

  it('unclassified entries are counted and reported, never dropped silently', () => {
    const r = computeProfitLoss([e('4000', 0, 1000), e('9010', 70, 0)]);
    expect(r.totalRevenue).toBe(1000);
    expect(r.unclassifiedCount).toBe(1);
    expect(r.unclassifiedMovement).toBe(70);
  });
});

describe('computeProfitLoss — figure → entries trace (Phase 2 exit)', () => {
  it('every headline figure re-derives from its class entries to the cent', async () => {
    const { entriesForClass, signedClassAmount } = await import('@/utils/accountClassification');
    const { sumMoney, roundTo } = await import('@/utils/money');
    const fixture = [
      e('4000', 0, 1000.1),
      e('4010', 0, 0.2),
      e('5000', 300.05, 0),
      e('6010', 50, 100), // credit-heavy expense: −50
      e('7010', 25, 0),
      e('9010', 999, 0), // unclassified: in no figure
    ];
    const r = computeProfitLoss(fixture);
    const trace = (cls: Parameters<typeof entriesForClass>[1]) =>
      roundTo(sumMoney(entriesForClass(fixture, cls).map((x) => signedClassAmount(x, cls))), 2);
    expect(trace('revenue')).toBe(r.totalRevenue);
    expect(trace('cogs')).toBe(r.totalCOGS);
    expect(roundTo(sumMoney([trace('opex'), trace('interest'), trace('tax')]), 2)).toBe(
      r.totalExpenses
    );
    expect(r.netIncome).toBe(roundTo(r.totalRevenue - r.totalCOGS - r.totalExpenses, 2));
  });
});
