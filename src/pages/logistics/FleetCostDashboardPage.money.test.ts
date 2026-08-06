/**
 * GAP-1 / F-0006 known-answer tests for the Fleet Cost Dashboard GL-derivation
 * helpers (Wave 9 Phase 3 Sector Depth).
 *
 * Verifies computeFleetCostFromEntries derives revenue/cogs/opex exactly and
 * that the downstream engine produces deterministic cost-per-mile.
 */
import { describe, expect, it } from 'vitest';
import type { GLEntry } from '@/types';
import { computeFleetCostFromEntries } from './FleetCostDashboardPage';
import { computeLogisticsMetrics } from './logisticsMetrics';

function e(accountName: string, debit = 0, credit = 0): GLEntry {
  return {
    id: accountName,
    accountId: accountName,
    accountCode: 'x',
    accountName,
    period: 'P1',
    periodName: 'P1',
    debit,
    credit,
    netChange: debit - credit,
    date: '2026-01-01',
    amount: Math.abs(debit - credit),
    description: accountName,
    reference: 'r',
  };
}

describe('computeFleetCostFromEntries — known answers (GAP-1)', () => {
  it('sums fractional freight revenue exactly (0.1 + 0.2 = 0.3)', () => {
    const input = computeFleetCostFromEntries([
      e('freight revenue', 0, 0.1),
      e('freight revenue', 0, 0.2),
    ]);
    expect(input.revenue).toBe(0.3);
  });

  it('derives revenue, cogs and opex exactly from GL', () => {
    const input = computeFleetCostFromEntries([
      e('freight revenue', 0, 1_200_000),
      e('fuel cogs', 600_000, 0),
      e('maintenance opex', 300_000, 0),
      e('warehouse storage', 144_000, 0),
    ]);
    expect(input.revenue).toBe(1_200_000);
    expect(input.cogs).toBe(600_000);
    expect(input.operatingExpenses).toBe(300_000);
    expect(input.warehouseCost).toBe(144_000);
  });

  it('downstream engine produces deterministic cost per mile', () => {
    const input = computeFleetCostFromEntries([
      e('freight revenue', 0, 1_200_000),
      e('fuel cogs', 600_000, 0),
      e('maintenance opex', 300_000, 0),
    ]);
    // totalMiles falls back to 400_000, total expenses = 900_000
    const m = computeLogisticsMetrics(input);
    expect(m.totalExpenses).toBe(900_000);
    expect(m.costPerMile).toBe(2.25);
    expect(m.warehouseCostPct).toBe(0);
  });

  it('handles empty GL without throwing', () => {
    const input = computeFleetCostFromEntries([]);
    expect(Number.isFinite(input.revenue)).toBe(true);
  });
});
