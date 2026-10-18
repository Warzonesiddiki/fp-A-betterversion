import { describe, it, expect } from 'vitest';
import { scenarioImpact, applyScenarioAdjustments } from './scenarioImpact';
import type { ThreeStatementGLEntry } from '@/pages/reports/threeStatementData';

/**
 * Phase 7 gate: scenario → 3-statement impact. A scenario scales GL
 * entries (by exact account or prefix), both statements are re-derived
 * from the entries, and every delta below is hand-computed. A scenario
 * that breaks double-entry is flagged with its exact imbalance — the
 * tool never plugs the difference to make the balance sheet balance.
 */

const ENTRIES: ThreeStatementGLEntry[] = [
  { accountCode: '1000', date: '2026-01-15', debit: 5000, credit: 0 },
  { accountCode: '1100', date: '2026-01-15', debit: 2000, credit: 0 },
  { accountCode: '2100', date: '2026-01-15', debit: 0, credit: 1500 },
  { accountCode: '3000', date: '2026-01-15', debit: 0, credit: 2500 },
  { accountCode: '4010', date: '2026-01-15', debit: 0, credit: 4000 },
  { accountCode: '5010', date: '2026-01-15', debit: 1000, credit: 0 },
];

describe('scenarioImpact — base derivation is hand-computed', () => {
  it('no adjustments: zero deltas, balanced', () => {
    const r = scenarioImpact(ENTRIES, '2026-01', []);
    expect(r.base.totals.revenue.toNumber()).toBe(4000);
    expect(r.base.totals.netIncome.toNumber()).toBe(3000);
    expect(r.base.balanceSheet.totalAssets).toBe(7000);
    expect(r.base.balanceSheet.totalLiabilitiesAndEquity).toBe(7000);
    expect(r.delta.netIncome).toBe(0);
    expect(r.delta.revenue).toBe(0);
    expect(r.adjustedImbalance).toBe(0);
    expect(r.balanced).toBe(true);
  });
});

describe('scenarioImpact — adjusted statements', () => {
  it('balanced what-if: revenue +25% collected in cash +20% flows through all three statements', () => {
    const r = scenarioImpact(ENTRIES, '2026-01', [
      { accountPrefix: '4', pctChange: 25 },
      { accountCode: '1000', pctChange: 20 },
    ]);
    expect(r.adjusted.totals.revenue.toNumber()).toBe(5000);
    expect(r.delta.revenue).toBe(1000);
    expect(r.delta.netIncome).toBe(1000);
    expect(r.delta.totalAssets).toBe(1000); // cash 5000 -> 6000
    expect(r.delta.netChangeInCash).toBe(1000);
    expect(r.adjusted.balanceSheet.totalAssets).toBe(8000);
    expect(r.adjusted.balanceSheet.totalLiabilitiesAndEquity).toBe(8000);
    expect(r.adjustedImbalance).toBe(0);
    expect(r.balanced).toBe(true);
  });

  it('unbalanced what-if is flagged with the exact imbalance, never plugged', () => {
    const r = scenarioImpact(ENTRIES, '2026-01', [{ accountPrefix: '4', pctChange: 25 }]);
    expect(r.delta.netIncome).toBe(1000);
    expect(r.adjustedImbalance).toBe(-1000); // debits - credits
    expect(r.balanced).toBe(false);
    // The imbalance is visible in the statements themselves:
    expect(r.adjusted.balanceSheet.totalAssets).toBe(7000);
    expect(r.adjusted.balanceSheet.totalLiabilitiesAndEquity).toBe(8000);
  });

  it('an exact-code adjustment does not touch a sibling account sharing the prefix', () => {
    const entries: ThreeStatementGLEntry[] = [
      ...ENTRIES,
      { accountCode: '1000', date: '2026-01-16', debit: 500, credit: 0 },
      { accountCode: '40100', date: '2026-01-16', debit: 0, credit: 500 },
    ];
    const r = scenarioImpact(entries, '2026-01', [{ accountCode: '4010', pctChange: 10 }]);
    // 4010: 4000 -> 4400; 40100 stays 500. Revenue 4500 -> 4900.
    expect(r.base.totals.revenue.toNumber()).toBe(4500);
    expect(r.adjusted.totals.revenue.toNumber()).toBe(4900);
    expect(r.delta.revenue).toBe(400);
  });

  it('applyScenarioAdjustments scales both sides with cent rounding', () => {
    const adjusted = applyScenarioAdjustments(
      [{ accountCode: '6010', date: '2026-01-15', debit: 33.33, credit: 0 }],
      [{ accountPrefix: '6', pctChange: 10 }]
    );
    expect(adjusted[0]!.debit).toBe(36.66);
    expect(adjusted[0]!.credit).toBe(0);
  });
});
