/**
 * GAP-1 / F-0006 known-answer tests for the Manufacturing exact-money model
 * (Wave 9 Phase 3 — Sector Depth).
 */
import { describe, expect, it } from 'vitest';
import {
  computeManufacturingMetrics,
  computeManufacturingRatioPct,
  computeOEE,
  scaleManufacturingDriver,
  sumManufacturingAmounts,
} from './manufacturingMetrics';

describe('manufacturingMetrics — known answers (GAP-1)', () => {
  it('sums fractional manufacturing amounts exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumManufacturingAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumManufacturingAmounts([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('0.335 × 3 rounds half-up to 1.01 (driver scale)', () => {
    expect(scaleManufacturingDriver(0.335, 3)).toBe(1.01);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeManufacturingRatioPct(10, 0)).toBe(0);
  });

  it('computes OEE exactly from Availability, Performance, Quality', () => {
    expect(computeOEE(90, 80, 95)).toBe(68.4);
  });

  it('full manufacturing metric model produces deterministic known answer', () => {
    const m = computeManufacturingMetrics({
      revenue: 2_000_000,
      cogs: 1_200_000,
      operatingExpenses: 400_000,
      outputUnits: 10_000,
      defectUnits: 200,
      scrapCost: 24_000,
      machineCapacityUnits: 12_500,
      scheduledHours: 1_000,
      actualHours: 900,
    });
    expect(m.totalExpenses).toBe(1_600_000);
    expect(m.grossProfit).toBe(800_000);
    expect(m.ebitda).toBe(400_000);
    expect(m.defectRatePct).toBe(2);
    expect(m.unitCost).toBe(160);
    expect(m.capacityUtilizationPct).toBe(80);
    expect(m.scrapCostPct).toBe(2);
    expect(m.operatingMarginPct).toBe(20);
    expect(m.oeePct).toBe(70.56);
  });

  it('handles expense-over-revenue (negative margin) exactly', () => {
    const m = computeManufacturingMetrics({
      revenue: 500_000,
      cogs: 450_000,
      operatingExpenses: 100_000,
      outputUnits: 5_000,
      defectUnits: 100,
      scrapCost: 10_000,
      machineCapacityUnits: 10_000,
      scheduledHours: 500,
      actualHours: 400,
    });
    expect(m.ebitda).toBe(-50_000);
    expect(m.operatingMarginPct).toBe(-10);
  });
});
