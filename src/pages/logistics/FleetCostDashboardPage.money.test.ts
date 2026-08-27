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

  it('reports unposted volumes as null — never an assumed constant (W-FAB)', () => {
    const input = computeFleetCostFromEntries([
      e('freight revenue', 0, 1_200_000),
      e('fuel cogs', 600_000, 0),
      e('maintenance opex', 300_000, 0),
    ]);
    // No mileage/delivery/capacity accounts are tagged: the quantities were
    // never posted. The previous version back-filled 400_000 miles and
    // produced a fabricated $2.25 cost-per-mile.
    expect(input.totalMiles).toBeNull();
    expect(input.loadedMiles).toBeNull();
    expect(input.onTimeDeliveries).toBeNull();
    expect(input.totalDeliveries).toBeNull();
    expect(input.fleetCapacityMiles).toBeNull();

    const m = computeLogisticsMetrics(input);
    expect(m.totalExpenses).toBe(900_000); // money KPIs stay exact
    expect(m.costPerMile).toBeNull();
    expect(m.fleetUtilizationPct).toBeNull();
    expect(m.emptyMilesPct).toBeNull();
    expect(m.onTimeDeliveryPct).toBeNull();
  });

  it('derives posted volumes exactly (no fallbacks needed)', () => {
    const input = computeFleetCostFromEntries([
      e('freight revenue', 0, 100_000),
      e('total miles', 20_000, 0),
      e('loaded miles', 15_000, 0),
      e('on-time delivery count', 9500, 0),
      e('total deliveries', 10_000, 0),
      e('fleet capacity miles', 40_000, 0),
    ]);
    expect(input.totalMiles).toBe(20_000);
    expect(input.loadedMiles).toBe(15_000);
    expect(input.onTimeDeliveries).toBe(9500);
    expect(input.totalDeliveries).toBe(10_000);
    expect(input.fleetCapacityMiles).toBe(40_000);

    const m = computeLogisticsMetrics(input);
    expect(m.emptyMilesPct).toBe(25);
    expect(m.onTimeDeliveryPct).toBe(95);
    expect(m.fleetUtilizationPct).toBe(50);
  });

  it('excludes debit-heavy volume/cost rows from revenue (W-FAB)', () => {
    // "Total Miles" matches the /mile/ keyword but is a debit-heavy volume
    // row; the old netChange fallback inflated revenue by +20,000.
    const input = computeFleetCostFromEntries([
      e('freight revenue', 0, 100_000),
      e('total miles', 20_000, 0),
      e('warehouse storage', 5_000, 0),
    ]);
    expect(input.revenue).toBe(100_000);
    expect(input.totalMiles).toBe(20_000);
    expect(input.warehouseCost).toBe(5_000);
  });

  it('handles empty GL without throwing and fabricates nothing', () => {
    const input = computeFleetCostFromEntries([]);
    expect(Number.isFinite(input.revenue)).toBe(true);
    expect(input.totalMiles).toBeNull();
    expect(input.totalDeliveries).toBeNull();
  });
});
