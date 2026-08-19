import { describe, it, expect } from 'vitest';
import { deriveCashPosition, isCashAccount, type CashGLEntry } from './cashForecastModel';

/**
 * Known-answer tests for the cash position derivation.
 *
 * This file replaces `CashForecastPage.money.test.ts`, which asserted
 * `buildCashCategorySplit(...)[0].inflows === 210.14` because
 * `300.20 * 0.7 = 210.14`. That test was green, named "money known answers",
 * and locked a fabricated 70% revenue weight into the product. An oracle that
 * encodes an invention is worse than no oracle.
 *
 * Seeded ledger, hand-computed:
 *   J1  1000 dr 100,000 / 4000 cr 100,000   customer receipt      (2026-01)
 *   J2  6000 dr  60,000 / 1000 cr  60,000   payroll payment       (2026-02)
 *   J3  5000 dr  30,000 + 6000 dr 10,000 / 1000 cr 40,000  split  (2026-02)
 *   --  1100 dr   5,000, no journal reference                     (2026-02)
 *
 *   receipts      100,000 + 5,000 = 105,000
 *   disbursements  60,000 + 40,000 = 100,000
 *   net movement                       5,000
 *   classified  200,000 of 205,000 = 97.56%
 */
function line(
  accountCode: string,
  debit: number,
  credit: number,
  period: string,
  journalId?: string
): CashGLEntry {
  return { accountCode, debit, credit, period, journalId };
}

const LEDGER: CashGLEntry[] = [
  line('1000', 100000, 0, '2026-01', 'J1'),
  line('4000', 0, 100000, '2026-01', 'J1'),
  line('6000', 60000, 0, '2026-02', 'J2'),
  line('1000', 0, 60000, '2026-02', 'J2'),
  line('5000', 30000, 0, '2026-02', 'J3'),
  line('6000', 10000, 0, '2026-02', 'J3'),
  line('1000', 0, 40000, '2026-02', 'J3'),
  line('1100', 5000, 0, '2026-02'),
];

describe('isCashAccount', () => {
  it('accepts cash and equivalents, rejects receivables and everything else', () => {
    expect(isCashAccount('1000')).toBe(true);
    expect(isCashAccount('1100')).toBe(true);
    expect(isCashAccount('1200')).toBe(false); // A/R is not cash
    expect(isCashAccount('4000')).toBe(false);
    expect(isCashAccount('6000')).toBe(false);
  });
});

describe('deriveCashPosition — totals', () => {
  it('reads cash movement from cash accounts only', () => {
    const p = deriveCashPosition(LEDGER)!;
    // The old page summed debit − credit over EVERY entry, so the 60,000
    // payroll debit and the 30,000 COGS debit counted as cash inflows.
    expect(p.receipts).toBe(105000);
    expect(p.disbursements).toBe(100000);
    expect(p.netMovement).toBe(5000);
    expect(p.postedBalance).toBe(5000);
  });

  it('returns null when the ledger posts no cash activity at all', () => {
    const noCash: CashGLEntry[] = [
      line('4000', 0, 900, '2026-01', 'X'),
      line('6000', 900, 0, '2026-01', 'X'),
    ];
    expect(deriveCashPosition(noCash)).toBeNull();
    expect(deriveCashPosition([])).toBeNull();
  });

  it('lists the cash accounts it actually used', () => {
    expect(deriveCashPosition(LEDGER)!.cashAccountCodes).toEqual(['1000', '1100']);
  });

  it('averages over posted periods, not a hardcoded divisor', () => {
    const p = deriveCashPosition(LEDGER)!;
    // The old page computed a "burn rate" as outflows / 4.
    expect(p.periodCount).toBe(2);
    expect(p.averageNetPerPeriod).toBe(2500);
  });
});

describe('deriveCashPosition — posted history', () => {
  it('buckets by period with a cumulative running balance', () => {
    const p = deriveCashPosition(LEDGER)!;
    expect(p.periods).toEqual([
      {
        period: '2026-01',
        receipts: 100000,
        disbursements: 0,
        net: 100000,
        runningBalance: 100000,
      },
      {
        period: '2026-02',
        receipts: 5000,
        disbursements: 100000,
        net: -95000,
        runningBalance: 5000,
      },
    ]);
  });

  it('ends the running balance on the posted balance', () => {
    const p = deriveCashPosition(LEDGER)!;
    expect(p.periods[p.periods.length - 1]!.runningBalance).toBe(p.postedBalance);
  });

  it('projects no future period', () => {
    const p = deriveCashPosition(LEDGER)!;
    expect(p.periods.map((x) => x.period)).toEqual(['2026-01', '2026-02']);
    expect(p.unavailable.map((u) => u.label)).toContain('Forward 13-week cash forecast');
  });
});

describe('deriveCashPosition — categories come from double entry', () => {
  it('attributes each cash line to its own journal counter-lines', () => {
    const byName = Object.fromEntries(
      deriveCashPosition(LEDGER)!.categories.map((c) => [c.category, c])
    );
    expect(byName['Revenue']).toMatchObject({ receipts: 100000, disbursements: 0 });
    // 60,000 payroll + 10,000 from the split journal
    expect(byName['Operating Expenses']).toMatchObject({ receipts: 0, disbursements: 70000 });
    expect(byName['Cost of Sales']).toMatchObject({ receipts: 0, disbursements: 30000 });
  });

  it('reports unattributable movement as Unclassified rather than a named category', () => {
    const byName = Object.fromEntries(
      deriveCashPosition(LEDGER)!.categories.map((c) => [c.category, c])
    );
    expect(byName['Unclassified']).toMatchObject({ receipts: 5000, disbursements: 0 });
    expect(byName['Other Income']).toBeUndefined();
    expect(byName['Payroll']).toBeUndefined();
    expect(byName['Capital Expenditures']).toBeUndefined();
    expect(byName['Debt Service']).toBeUndefined();
  });

  it('sums categories back to the receipt and disbursement totals exactly', () => {
    const p = deriveCashPosition(LEDGER)!;
    const receipts = p.categories.reduce((a, c) => a + c.receipts, 0);
    const disbursements = p.categories.reduce((a, c) => a + c.disbursements, 0);
    expect(receipts).toBe(p.receipts);
    expect(disbursements).toBe(p.disbursements);
  });

  it('states how much of the movement it could attribute', () => {
    // 200,000 of 205,000
    expect(deriveCashPosition(LEDGER)!.classifiedPercent).toBe(97.56);
  });

  it('allocates an indivisible split to the cent with no drift', () => {
    const pennies: CashGLEntry[] = [
      line('6000', 33.34, 0, '2026-03', 'P1'),
      line('6000', 33.34, 0, '2026-03', 'P1'),
      line('6000', 33.33, 0, '2026-03', 'P1'),
      line('1000', 0, 100.01, '2026-03', 'P1'),
    ];
    const p = deriveCashPosition(pennies)!;
    const opex = p.categories.find((c) => c.category === 'Operating Expenses')!;
    expect(opex.disbursements).toBe(100.01);
    expect(p.disbursements).toBe(100.01);
  });

  it('treats a cash-to-cash transfer as a transfer, not revenue or expense', () => {
    const transfer: CashGLEntry[] = [
      line('1000', 0, 2500, '2026-04', 'T1'),
      line('1100', 2500, 0, '2026-04', 'T1'),
    ];
    const p = deriveCashPosition(transfer)!;
    // Both legs are cash, so neither has a non-cash counter-line.
    expect(p.categories.map((c) => c.category)).toEqual(['Unclassified']);
    expect(p.receipts).toBe(2500);
    expect(p.disbursements).toBe(2500);
    expect(p.netMovement).toBe(0);
  });

  it('flags incomplete attribution in the unavailable list', () => {
    const labels = deriveCashPosition(LEDGER)!.unavailable.map((u) => u.label);
    expect(labels).toContain('Complete category attribution');
  });

  it('does not flag incomplete attribution when every line is attributed', () => {
    const clean = LEDGER.filter((l) => l.journalId !== undefined);
    const p = deriveCashPosition(clean)!;
    expect(p.classifiedPercent).toBe(100);
    expect(p.unavailable.map((u) => u.label)).not.toContain('Complete category attribution');
  });
});
