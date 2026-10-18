import { describe, it, expect } from 'vitest';
import { deriveChangesInEquity } from './changesInEquity';
import {
  deriveThreeStatement,
  type ThreeStatementGLEntry,
} from '@/pages/reports/threeStatementData';

/**
 * Phase 9 (row 11): statement of changes in equity. Opening equity
 * (posted equity + prior earnings) plus the period's net income and
 * per-account equity movements (contributions, dividends) must land
 * exactly on the balance sheet's total equity for the same cutoff —
 * the same identity deriveThreeStatement publishes.
 */

const ENTRIES: ThreeStatementGLEntry[] = [
  // 2025-12: initial capital 2,500; prior-period profit 600.
  { accountCode: '1000', date: '2025-12-10', debit: 3100, credit: 0 },
  { accountCode: '3000', date: '2025-12-10', debit: 0, credit: 2500 },
  { accountCode: '4010', date: '2025-12-10', debit: 0, credit: 1000 },
  { accountCode: '5010', date: '2025-12-10', debit: 400, credit: 0 },
  // 2026-01: new contribution 500, dividend 300, profit 800.
  { accountCode: '1000', date: '2026-01-15', debit: 1000, credit: 0 },
  { accountCode: '3000', date: '2026-01-15', debit: 0, credit: 500 },
  { accountCode: '3100', date: '2026-01-15', debit: 300, credit: 0 },
  { accountCode: '4010', date: '2026-01-15', debit: 0, credit: 2000 },
  { accountCode: '6010', date: '2026-01-15', debit: 1200, credit: 0 },
];

describe('deriveChangesInEquity', () => {
  it('hand-computed: opening + income + movements = closing', () => {
    const r = deriveChangesInEquity(ENTRIES, '2026-01');
    expect(r.openingEquity).toBe(3100); // 2,500 capital + 600 prior profit
    expect(r.netIncome).toBe(800); // 2,000 - 1,200
    expect(r.equityMovements).toEqual([
      { accountCode: '3000', amount: 500 },
      { accountCode: '3100', amount: -300 },
    ]);
    expect(r.totalEquityMovements).toBe(200);
    expect(r.closingEquity).toBe(4100);
  });

  it('closing ties to the balance sheet total equity at the same cutoff', () => {
    const r = deriveChangesInEquity(ENTRIES, '2026-01');
    const bs = deriveThreeStatement(ENTRIES, '2026-01').balanceSheet;
    expect(r.closingEquity).toBe(bs.totalEquity);
  });

  it('a period with no activity carries the opening forward unchanged', () => {
    const r = deriveChangesInEquity(ENTRIES, '2026-03');
    expect(r.openingEquity).toBe(4100);
    expect(r.netIncome).toBe(0);
    expect(r.equityMovements).toEqual([]);
    expect(r.closingEquity).toBe(4100);
  });
});
