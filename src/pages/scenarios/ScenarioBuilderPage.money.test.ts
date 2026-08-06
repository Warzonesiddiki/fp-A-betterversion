/**
 * GAP-1 (F-0006) known-answer tests for ScenarioBuilderPage simulateScenarioComparison.
 * Falsification: 5/8 fail vs raw float.
 */
import { describe, expect, it } from 'vitest';
import { simulateScenarioComparison } from './ScenarioBuilderPage';

describe('ScenarioBuilderPage money primitive — simulateScenarioComparison (GAP-1)', () => {
  it('control: zero changes yields zero variance, 100% probability', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 1000000,
      cogs: 500000,
      growthRatePct: 0,
      pricingChangePct: 0,
      cogsChangePct: 0,
      headcountChange: 0,
      avgSalary: 85000,
      probabilityPct: 100,
    });
    expect(r.scenarioRevenue).toBe(1000000);
    expect(r.revenueVariance).toBe(0);
    expect(r.variancePct).toBe(0);
    expect(r.probabilityWeightedRevenue).toBe(1000000);
    expect(r.netImpact).toBe(0);
  });

  it('10% growth + 5% pricing on $48M → $55.2M exact', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 48000000,
      cogs: 28800000,
      growthRatePct: 10,
      pricingChangePct: 5,
      cogsChangePct: 0,
      headcountChange: 0,
      avgSalary: 85000,
      probabilityPct: 100,
    });
    // 48M + 4.8M + 2.4M = 55.2M
    expect(r.scenarioRevenue).toBe(55200000);
    expect(r.revenueVariance).toBe(7200000);
    expect(r.variancePct).toBe(15);
  });

  it('probability weighting is exact (60% of $55.2M = $33.12M)', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 48000000,
      cogs: 28800000,
      growthRatePct: 10,
      pricingChangePct: 5,
      cogsChangePct: 0,
      headcountChange: 0,
      avgSalary: 85000,
      probabilityPct: 60,
    });
    expect(r.probabilityWeightedRevenue).toBe(33120000);
    expect(r.probabilityWeightedNet).toBe(4320000); // 7.2M *0.6
  });

  it('COGS -2% reduces COGS by $576k exact', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 48000000,
      cogs: 28800000,
      growthRatePct: 0,
      pricingChangePct: 0,
      cogsChangePct: -2,
      headcountChange: 0,
      avgSalary: 85000,
      probabilityPct: 100,
    });
    expect(r.cogsImpact).toBe(-576000);
    expect(r.newCogs).toBe(28224000);
    expect(r.netImpact).toBe(576000);
  });

  it('headcount +20 at $85k → $1.7M opex impact', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 48000000,
      cogs: 28800000,
      growthRatePct: 0,
      pricingChangePct: 0,
      cogsChangePct: 0,
      headcountChange: 20,
      avgSalary: 85000,
      probabilityPct: 100,
    });
    expect(r.opexImpact).toBe(1700000);
    expect(r.newOpex).toBe(16100000);
  });

  it('combined growth/pricing/cogs/headcount produces exact net', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 1000000,
      cogs: 500000,
      growthRatePct: 10,
      pricingChangePct: 5,
      cogsChangePct: -2,
      headcountChange: 10,
      avgSalary: 50000,
      probabilityPct: 50,
    });
    // revenue: 1M +100k+50k=1.15M, cogsImpact -10k, opex 500k, net=150k -490k = -340k
    expect(r.scenarioRevenue).toBe(1150000);
    expect(r.cogsImpact).toBe(-10000);
    expect(r.opexImpact).toBe(500000);
    expect(r.netImpact).toBe(-340000);
    expect(r.probabilityWeightedRevenue).toBe(575000);
  });

  it('handles cent-level drift (0.1+0.2 pricing on $0.3 base)', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 0.3,
      cogs: 0.1,
      growthRatePct: 10,
      pricingChangePct: 20,
      cogsChangePct: 0,
      headcountChange: 0,
      avgSalary: 85000,
      probabilityPct: 100,
    });
    // 0.3 +0.03+0.06=0.39 exact
    expect(r.scenarioRevenue).toBe(0.39);
    expect(r.revenueVariance).toBe(0.09);
  });

  it('zero base revenue yields 0 variancePct (no divide-by-zero)', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 0,
      cogs: 0,
      growthRatePct: 10,
      pricingChangePct: 5,
      cogsChangePct: 0,
      headcountChange: 0,
      avgSalary: 85000,
      probabilityPct: 100,
    });
    expect(r.variancePct).toBe(0);
    expect(r.probabilityWeightedRevenue).toBe(0);
  });

  it('0% probability gives 0 weighted, 100% gives full', () => {
    const base = {
      baseRevenue: 1000000,
      cogs: 500000,
      growthRatePct: 10,
      pricingChangePct: 0,
      cogsChangePct: 0,
      headcountChange: 0,
      avgSalary: 85000,
      probabilityPct: 0,
    };
    expect(simulateScenarioComparison(base).probabilityWeightedRevenue).toBe(0);
    expect(
      simulateScenarioComparison({ ...base, probabilityPct: 100 }).probabilityWeightedRevenue
    ).toBe(1100000);
  });
});
