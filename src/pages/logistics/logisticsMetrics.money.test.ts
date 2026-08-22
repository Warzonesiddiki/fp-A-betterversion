/**
 * GAP-1 / F-0006 known-answer tests for the Logistics exact-money model
 * (Wave 9 Phase 3 — Sector Depth).
 *
 * Falsifiability: these assertions fail under naive float math (e.g. the
 * 0.1 + 0.2 case and the fractional freight summation) and under old
 * placeholder logic that returned static KPI values.
 */
import { describe, expect, it } from 'vitest';
import {
  computeLogisticsMetrics,
  computeCostPerMile,
  computeRatioPct,
  scaleByDriver,
  sumFreightAmounts,
  warehouseCostModel,
} from './logisticsMetrics';

describe('logisticsMetrics — known answers (GAP-1)', () => {
  it('sums fractional freight amounts exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumFreightAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumFreightAmounts([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('0.335 × 3 rounds half-up to 1.01 (driver scale)', () => {
    // 0.335 × 3 = 1.005 → rounds half-up to 1.01
    expect(scaleByDriver(0.335, 200)).toBe(1.01);
  });

  it('computes cost per mile exactly', () => {
    expect(computeCostPerMile(400_000, 200_000)).toBe(2.0);
    // fractional division has no float drift
    expect(computeCostPerMile(4.5, 3)).toBe(1.5);
  });

  it('returns 0 cost per mile for zero miles (undefined ratio)', () => {
    expect(computeCostPerMile(1000, 0)).toBe(0);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeRatioPct(10, 0)).toBe(0);
    expect(computeRatioPct(0, 0)).toBe(0);
  });

  it('full metric model produces deterministic known answer', () => {
    const m = computeLogisticsMetrics({
      revenue: 1_200_000,
      cogs: 600_000,
      operatingExpenses: 300_000,
      totalMiles: 400_000,
      loadedMiles: 340_000,
      onTimeDeliveries: 9500,
      totalDeliveries: 10000,
      fleetCapacityMiles: 470_000,
      warehouseCost: 144_000,
    });
    expect(m.totalExpenses).toBe(900_000);
    expect(m.grossProfit).toBe(600_000);
    expect(m.ebitda).toBe(300_000);
    expect(m.costPerMile).toBe(2.25);
    expect(m.onTimeDeliveryPct).toBe(95);
    expect(m.emptyMilesPct).toBe(15);
    expect(m.fleetUtilizationPct).toBe(85.11);
    expect(m.warehouseCostPct).toBe(12);
    expect(m.operatingMarginPct).toBe(25);
  });

  // W-FAB lane N4: unposted fleet volumes are `null`, and every volume-derived
  // ratio is `null` — never back-filled with assumed mileage or deliveries.
  it('returns null volume ratios when volumes were never posted (W-FAB)', () => {
    const m = computeLogisticsMetrics({
      revenue: 1_200_000,
      cogs: 600_000,
      operatingExpenses: 300_000,
      totalMiles: null,
      loadedMiles: null,
      onTimeDeliveries: null,
      totalDeliveries: null,
      fleetCapacityMiles: null,
      warehouseCost: 144_000,
    });
    expect(m.totalExpenses).toBe(900_000); // money KPIs stay exact
    expect(m.costPerMile).toBeNull();
    expect(m.onTimeDeliveryPct).toBeNull();
    expect(m.emptyMilesPct).toBeNull();
    expect(m.fleetUtilizationPct).toBeNull();
  });

  it('keeps partial volume coverage honest (miles posted, capacity missing)', () => {
    const m = computeLogisticsMetrics({
      revenue: 100_000,
      cogs: 20_000,
      operatingExpenses: 10_000,
      totalMiles: 50_000,
      loadedMiles: 45_000,
      onTimeDeliveries: null,
      totalDeliveries: null,
      fleetCapacityMiles: null,
      warehouseCost: 5_000,
    });
    expect(m.costPerMile).toBe(0.6);
    expect(m.emptyMilesPct).toBe(10);
    expect(m.onTimeDeliveryPct).toBeNull();
    expect(m.fleetUtilizationPct).toBeNull();
  });

  it('handles expense-over-revenue (negative operating margin) exactly', () => {
    const m = computeLogisticsMetrics({
      revenue: 100_000,
      cogs: 120_000,
      operatingExpenses: 30_000,
      totalMiles: 50_000,
      loadedMiles: 45_000,
      onTimeDeliveries: 800,
      totalDeliveries: 1000,
      fleetCapacityMiles: 60_000,
      warehouseCost: 5_000,
    });
    expect(m.ebitda).toBe(-50_000);
    expect(m.operatingMarginPct).toBe(-50);
  });

  it('warehouseCostModel is an exact percentage share', () => {
    expect(warehouseCostModel(1_200_000, 12)).toBe(144_000);
    expect(warehouseCostModel(0.1, 50)).toBe(0.05);
  });
});
