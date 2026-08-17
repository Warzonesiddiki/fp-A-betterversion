import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  deriveScenarioBase,
  profitFromScenarioDraw,
  scenarioGrossProfit,
  scenarioNetIncome,
  simulateScenarioComparison,
  summarizeScenarioDraws,
  type ScenarioGLEntry,
} from './scenarioBuilderModel';

const gl = (accountCode: string, debit: number, credit: number): ScenarioGLEntry => ({
  accountCode,
  debit,
  credit,
});

function withOpex(
  input: Omit<Parameters<typeof simulateScenarioComparison>[0], 'opex'> & { opex?: number }
) {
  return simulateScenarioComparison({ opex: 14400000, ...input });
}

describe('simulateScenarioComparison — known answers (GAP-1)', () => {
  it('control: zero changes yields zero variance', () => {
    const r = withOpex({
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
    expect(r.newOpex).toBe(14400000);
  });

  it('10% growth + 5% pricing on $48M is additive 55.2M, not compounded 55.44M', () => {
    const r = withOpex({
      baseRevenue: 48000000,
      cogs: 28800000,
      growthRatePct: 10,
      pricingChangePct: 5,
      cogsChangePct: 0,
      headcountChange: 0,
      avgSalary: 85000,
      probabilityPct: 100,
    });
    expect(r.scenarioRevenue).toBe(55200000);
    expect(r.revenueVariance).toBe(7200000);
    expect(r.variancePct).toBe(15);
    expect(r.scenarioRevenue).not.toBe(55440000);
  });

  it('probability weighting is exact (60% of $55.2M = $33.12M)', () => {
    const r = withOpex({
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
    expect(r.probabilityWeightedNet).toBe(4320000);
  });

  it('COGS -2% reduces COGS by $576k exact', () => {
    const r = withOpex({
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

  it('headcount +20 at $85k → $1.7M opex on the *supplied* opex, not a hidden 14.4M', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 48000000,
      cogs: 28800000,
      opex: 2000000,
      growthRatePct: 0,
      pricingChangePct: 0,
      cogsChangePct: 0,
      headcountChange: 20,
      avgSalary: 85000,
      probabilityPct: 100,
    });
    expect(r.opexImpact).toBe(1700000);
    expect(r.newOpex).toBe(3700000);
    expect(r.newOpex).not.toBe(16100000);
  });

  it('combined growth/pricing/cogs/headcount produces exact net', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 1000000,
      cogs: 500000,
      opex: 0,
      growthRatePct: 10,
      pricingChangePct: 5,
      cogsChangePct: -2,
      headcountChange: 10,
      avgSalary: 50000,
      probabilityPct: 50,
    });
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
      opex: 0,
      growthRatePct: 10,
      pricingChangePct: 20,
      cogsChangePct: 0,
      headcountChange: 0,
      avgSalary: 85000,
      probabilityPct: 100,
    });
    expect(r.scenarioRevenue).toBe(0.39);
    expect(r.revenueVariance).toBe(0.09);
  });

  it('zero base revenue yields 0 variancePct (no divide-by-zero)', () => {
    const r = simulateScenarioComparison({
      baseRevenue: 0,
      cogs: 0,
      opex: 0,
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
});

describe('deriveScenarioBase — posted GL, no invented $48M', () => {
  it('returns null for an empty ledger', () => {
    expect(deriveScenarioBase([])).toBeNull();
  });

  it('nets revenue / COGS / opex with the account-class normal', () => {
    const b = deriveScenarioBase([gl('4000', 0, 1000), gl('5000', 400, 0), gl('6000', 250, 0)]);
    expect(b).toEqual({ revenue: 1000, cogs: 400, opex: 250 });
  });

  it('nets a sales return instead of adding it', () => {
    const b = deriveScenarioBase([gl('4000', 0, 1000), gl('4000', 150, 0)]);
    expect(b!.revenue).toBe(850);
  });
});

describe('profitFromScenarioDraw / summarizeScenarioDraws', () => {
  it('shocks the scenario totals on decimal.js', () => {
    // 1000 * 1.10 * 1.05 − 400 * 0.98 − 250 = 1155 − 392 − 250 = 513
    expect(
      profitFromScenarioDraw({
        revenue: 1000,
        cogs: 400,
        opex: 250,
        growthPct: 10,
        pricingPct: 5,
        cogsPct: -2,
      })
    ).toBe(513);
  });

  it('averages 0.1 + 0.2 + 0.3 exactly', () => {
    const s = summarizeScenarioDraws([0.1, 0.2, 0.3]);
    expect(s.average).toBe(0.2);
    expect(s.median).toBe(0.2);
  });
});

describe('scenarioGrossProfit / scenarioNetIncome', () => {
  it('is revenue − COGS − opex, not a float chain', () => {
    expect(scenarioGrossProfit(0.3, 0.1)).toBe(0.2);
    expect(scenarioNetIncome(0.3, 0.1, 0.1)).toBe(0.1);
  });
});

function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('source-level guards against reintroduced defects', () => {
  const source = codeOnly(readFileSync('src/pages/scenarios/scenarioBuilderModel.ts', 'utf-8'));
  const page = codeOnly(readFileSync('src/pages/scenarios/ScenarioBuilderPage.tsx', 'utf-8'));

  it('contains no Math.abs', () => {
    expect(source).not.toMatch(/Math\.abs/);
    expect(page).not.toMatch(/Math\.abs/);
  });

  it('the page does not hardcode a $48M / $28.8M / $14.4M base', () => {
    expect(page).not.toMatch(/48000000/);
    expect(page).not.toMatch(/28800000/);
    expect(page).not.toMatch(/14400000/);
    expect(page).not.toMatch(/85000/);
  });

  it('does not do raw newRevenue - newCogs on the save path', () => {
    expect(page).not.toMatch(/newRevenue\s*-\s*(?:scenarioComparison\.)?newCogs/);
    expect(page).not.toMatch(/baseRevenue\s*\*\s*\(/);
  });

  it('the page consumes the derivation instead of recomputing it', () => {
    const raw = readFileSync('src/pages/scenarios/ScenarioBuilderPage.tsx', 'utf-8');
    expect(raw).toMatch(/simulateScenarioComparison/);
    expect(raw).toMatch(/deriveScenarioBase/);
    expect(raw).toMatch(/summarizeScenarioDraws/);
  });
});
