/**
 * GAP-1 / F-0006 known-answer tests for the Energy/ESG exact-money model
 * (Wave 9 Phase 3 — Sector Depth).
 */
import { describe, expect, it } from 'vitest';
import {
  computeEnergyMetrics,
  computeEnergyRatioPct,
  computeCarbonIntensity,
  scaleEnergyDriver,
  sumEnergyAmounts,
} from './energyMetrics';

describe('energyMetrics — known answers (GAP-1)', () => {
  it('sums fractional energy amounts exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumEnergyAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumEnergyAmounts([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('0.335 × 3 rounds half-up to 1.01 (driver scale)', () => {
    expect(scaleEnergyDriver(0.335, 3)).toBe(1.01);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeEnergyRatioPct(10, 0)).toBe(0);
    expect(computeCarbonIntensity(500, 0)).toBe(0);
  });

  it('full energy metric model produces deterministic known answer', () => {
    const m = computeEnergyMetrics({
      revenue: 10_000_000,
      cogs: 6_000_000,
      operatingExpenses: 1_500_000,
      productionMWh: 100_000,
      scope1Emissions: 10_000,
      scope2Emissions: 5_000,
      scope3Emissions: 15_000,
      renewableMWh: 40_000,
      liftingCost: 2_000_000,
      totalCapacityMWh: 125_000,
    });
    expect(m.totalExpenses).toBe(7_500_000);
    expect(m.grossProfit).toBe(4_000_000);
    expect(m.ebitda).toBe(2_500_000);
    expect(m.totalEmissions).toBe(30_000);
    expect(m.carbonIntensity).toBe(0.3);
    expect(m.renewableMixPct).toBe(40);
    expect(m.liftingCostPerMWh).toBe(20);
    expect(m.capacityUtilizationPct).toBe(80);
    expect(m.operatingMarginPct).toBe(25);
  });

  it('handles expense-over-revenue (negative margin) exactly', () => {
    const m = computeEnergyMetrics({
      revenue: 1_000_000,
      cogs: 900_000,
      operatingExpenses: 300_000,
      productionMWh: 10_000,
      scope1Emissions: 1_000,
      scope2Emissions: 500,
      scope3Emissions: 1_500,
      renewableMWh: 2_000,
      liftingCost: 400_000,
      totalCapacityMWh: 20_000,
    });
    expect(m.ebitda).toBe(-200_000);
    expect(m.operatingMarginPct).toBe(-20);
  });

  it('guards zero production (lifting cost per MWh falls back to 0)', () => {
    const m = computeEnergyMetrics({
      revenue: 1_000_000,
      cogs: 600_000,
      operatingExpenses: 150_000,
      productionMWh: 0,
      scope1Emissions: 1_000,
      scope2Emissions: 500,
      scope3Emissions: 1_500,
      renewableMWh: 0,
      liftingCost: 200_000,
      totalCapacityMWh: 0,
    });
    expect(m.liftingCostPerMWh).toBe(0);
    expect(m.renewableMixPct).toBe(0);
    expect(m.capacityUtilizationPct).toBe(0);
    // emissions totals still compute
    expect(m.totalEmissions).toBe(3_000);
    expect(m.ebitda).toBe(250_000);
  });

  it('guards zero production while capacity exists', () => {
    const m = computeEnergyMetrics({
      revenue: 1_000_000,
      cogs: 600_000,
      operatingExpenses: 150_000,
      productionMWh: 0,
      scope1Emissions: 0,
      scope2Emissions: 0,
      scope3Emissions: 0,
      renewableMWh: 0,
      liftingCost: 200_000,
      totalCapacityMWh: 100_000,
    });
    expect(m.liftingCostPerMWh).toBe(0);
    expect(m.capacityUtilizationPct).toBe(0);
  });
});
