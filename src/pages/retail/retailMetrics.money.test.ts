/**
 * GAP-1 / F-0006 known-answer tests for the Retail exact-money model
 * (Wave 9 Phase 3 — Sector Depth).
 */
import { describe, expect, it } from 'vitest';
import {
  computeRetailMetrics,
  computeRetailRatioPct,
  computeGMROI,
  scaleRetailDriver,
  sumRetailAmounts,
} from './retailMetrics';

describe('retailMetrics — known answers (GAP-1)', () => {
  it('sums fractional retail amounts exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumRetailAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumRetailAmounts([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('0.335 × 3 rounds half-up to 1.01 (driver scale)', () => {
    expect(scaleRetailDriver(0.335, 3)).toBe(1.01);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeRetailRatioPct(10, 0)).toBe(0);
    expect(computeGMROI(100, 0)).toBe(0);
  });

  it('full retail metric model produces deterministic known answer', () => {
    const m = computeRetailMetrics({
      revenue: 5_000_000,
      cogs: 3_000_000,
      operatingExpenses: 1_000_000,
      priorYearRevenue: 4_500_000,
      totalSqFt: 50_000,
      averageInventory: 1_000_000,
      storeCount: 10,
      shrinkageAmount: 50_000,
      promoCost: 100_000,
    });
    expect(m.totalExpenses).toBe(4_000_000);
    expect(m.grossProfit).toBe(2_000_000);
    expect(m.ebitda).toBe(1_000_000);
    expect(m.sameStoreSalesGrowthPct).toBe(11.11);
    expect(m.salesPerSqFt).toBe(100);
    expect(m.inventoryTurnover).toBe(3);
    expect(m.gmroi).toBe(2);
    expect(m.shrinkageRatePct).toBe(1);
    expect(m.operatingMarginPct).toBe(20);
  });

  it('handles expense-over-revenue (negative EBITDA and margin) exactly', () => {
    const m = computeRetailMetrics({
      revenue: 1_000_000,
      cogs: 900_000,
      operatingExpenses: 300_000,
      priorYearRevenue: 1_200_000,
      totalSqFt: 10_000,
      averageInventory: 400_000,
      storeCount: 2,
      shrinkageAmount: 20_000,
      promoCost: 50_000,
    });
    expect(m.ebitda).toBe(-200_000);
    expect(m.sameStoreSalesGrowthPct).toBe(-16.67);
    expect(m.operatingMarginPct).toBe(-20);
  });

  it('guards zero square footage and zero inventory (no division by zero)', () => {
    const m = computeRetailMetrics({
      revenue: 500_000,
      cogs: 300_000,
      operatingExpenses: 100_000,
      priorYearRevenue: 450_000,
      totalSqFt: 0,
      averageInventory: 0,
      storeCount: 1,
      shrinkageAmount: 10_000,
      promoCost: 20_000,
    });
    expect(m.salesPerSqFt).toBe(0);
    expect(m.inventoryTurnover).toBe(0);
    expect(m.gmroi).toBe(0);
    // other metrics still compute from revenue
    expect(m.grossProfit).toBe(200_000);
    expect(m.ebitda).toBe(100_000);
  });

  it('guards only one of the two zero denominators independently', () => {
    const noSqFt = computeRetailMetrics({
      revenue: 1_000_000,
      cogs: 600_000,
      operatingExpenses: 200_000,
      priorYearRevenue: 900_000,
      totalSqFt: 0,
      averageInventory: 250_000,
      storeCount: 2,
      shrinkageAmount: 5_000,
      promoCost: 10_000,
    });
    expect(noSqFt.salesPerSqFt).toBe(0);
    expect(noSqFt.inventoryTurnover).toBe(2.4);

    const noInventory = computeRetailMetrics({
      revenue: 1_000_000,
      cogs: 600_000,
      operatingExpenses: 200_000,
      priorYearRevenue: 900_000,
      totalSqFt: 25_000,
      averageInventory: 0,
      storeCount: 2,
      shrinkageAmount: 5_000,
      promoCost: 10_000,
    });
    expect(noInventory.salesPerSqFt).toBe(40);
    expect(noInventory.inventoryTurnover).toBe(0);
    expect(noInventory.gmroi).toBe(0);
  });
});
