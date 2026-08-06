/**
 * GAP-1 / F-0006 known-answer tests for the Construction exact-money model
 * (Wave 9 Phase 3 — Sector Depth).
 */
import { describe, expect, it } from 'vitest';
import {
  computeConstructionMetrics,
  computeConstructionRatioPct,
  computeCPI,
  computeSPI,
  scaleConstructionDriver,
  sumConstructionAmounts,
} from './constructionMetrics';

describe('constructionMetrics — known answers (GAP-1)', () => {
  it('sums fractional construction amounts exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumConstructionAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumConstructionAmounts([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('0.335 × 3 rounds half-up to 1.01 (driver scale)', () => {
    expect(scaleConstructionDriver(0.335, 3)).toBe(1.01);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeConstructionRatioPct(10, 0)).toBe(0);
    expect(computeCPI(100, 0)).toBe(0);
    expect(computeSPI(100, 0)).toBe(0);
  });

  it('full construction metric model produces deterministic known answer', () => {
    const m = computeConstructionMetrics({
      contractRevenue: 3_000_000,
      changeOrderRevenue: 500_000,
      directLaborCost: 1_000_000,
      materialCost: 800_000,
      equipmentCost: 400_000,
      subcontractorCost: 600_000,
      overheadCost: 300_000,
      plannedCost: 2_700_000,
      earnedValue: 3_080_000,
      plannedValue: 2_800_000,
      equipmentCapacityHours: 10_000,
      equipmentUsedHours: 8_500,
    });
    expect(m.totalRevenue).toBe(3_500_000);
    expect(m.totalDirectCost).toBe(2_800_000);
    expect(m.grossProfit).toBe(700_000);
    expect(m.ebitda).toBe(400_000);
    expect(m.spi).toBe(1.1);
    expect(m.cpi).toBe(1.1);
    expect(m.costVariance).toBe(280_000);
    expect(m.scheduleVariance).toBe(280_000);
    expect(m.equipmentUtilizationPct).toBe(85);
    expect(m.grossMarginPct).toBe(20);
  });

  it('handles expense-over-revenue (negative gross profit and EBITDA) exactly', () => {
    const m = computeConstructionMetrics({
      contractRevenue: 1_000_000,
      changeOrderRevenue: 0,
      directLaborCost: 500_000,
      materialCost: 400_000,
      equipmentCost: 200_000,
      subcontractorCost: 100_000,
      overheadCost: 150_000,
      plannedCost: 1_100_000,
      earnedValue: 900_000,
      plannedValue: 1_000_000,
      equipmentCapacityHours: 5_000,
      equipmentUsedHours: 4_000,
    });
    expect(m.totalDirectCost).toBe(1_200_000);
    expect(m.grossProfit).toBe(-200_000);
    expect(m.ebitda).toBe(-350_000);
    expect(m.cpi).toBe(0.75);
    expect(m.spi).toBe(0.9);
  });
});
