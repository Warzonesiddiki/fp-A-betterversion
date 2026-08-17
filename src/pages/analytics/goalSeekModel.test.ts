import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  computeContribution,
  deriveGoalSeekActuals,
  modeledTotalCost,
  modeledVolatility,
  profitFromDraw,
  summarizeOutcomes,
  variableCostPctForTarget,
  type GoalSeekGLEntry,
} from './goalSeekModel';

/**
 * Known-answer suite for the contribution / goal-seek model.
 *
 * The page this module replaced did IEEE-754 `fixed / (cm / 100)` and
 * `(fixed + target) / (cm / 100)`, abs'd every expense, and invented a
 * $1,000,000 revenue base when the GL was empty. Every test below pins
 * one of those closed.
 */

const gl = (accountCode: string, debit: number, credit: number): GoalSeekGLEntry => ({
  accountCode,
  debit,
  credit,
});

/** Owner contributes 500 cash; sells 1,000; pays 400 COGS; pays 250 opex. */
function operatingLedger(): GoalSeekGLEntry[] {
  return [
    gl('1000', 500, 0),
    gl('3000', 0, 500),
    gl('1000', 1000, 0),
    gl('4000', 0, 1000),
    gl('5000', 400, 0),
    gl('1000', 0, 400),
    gl('6000', 250, 0),
    gl('1000', 0, 250),
  ];
}

describe('computeContribution — closed-form known answers', () => {
  it('is the 40% contribution identity (fixed 500k, VC 60%, target 1M)', () => {
    const r = computeContribution({
      fixedCost: 500000,
      variableCostPct: 60,
      targetProfit: 1000000,
    });
    expect(r.valid).toBe(true);
    expect(r.contributionMarginPct).toBe(40);
    expect(r.breakEvenRevenue).toBe(1250000);
    expect(r.revenueForTarget).toBe(3750000);
  });

  it('is exact on a repeating cent that IEEE-754 cannot represent', () => {
    // 0.3 / 0.4 = 0.75. Float (0.1+0.2) / 0.4 is not 0.75.
    const r = computeContribution({
      fixedCost: 0.3,
      variableCostPct: 60,
      targetProfit: 0,
    });
    expect(r.breakEvenRevenue).toBe(0.75);
  });

  it('returns invalid (not Infinity) when contribution is zero or negative', () => {
    expect(computeContribution({ fixedCost: 100, variableCostPct: 100, targetProfit: 10 })).toEqual(
      {
        valid: false,
        contributionMarginPct: 0,
        breakEvenRevenue: 0,
        revenueForTarget: 0,
      }
    );
    expect(
      computeContribution({ fixedCost: 100, variableCostPct: 110, targetProfit: 10 }).valid
    ).toBe(false);
  });

  it('with zero variable cost, break-even equals fixed cost', () => {
    const r = computeContribution({ fixedCost: 250, variableCostPct: 0, targetProfit: 50 });
    expect(r.breakEvenRevenue).toBe(250);
    expect(r.revenueForTarget).toBe(300);
  });
});

describe('variableCostPctForTarget — inverse of computeContribution', () => {
  it('recovers the 60% that produced the 3.75M revenue-for-target', () => {
    const r = variableCostPctForTarget({
      revenue: 3750000,
      fixedCost: 500000,
      targetProfit: 1000000,
    });
    expect(r.valid).toBe(true);
    expect(r.variableCostPct).toBe(60);
  });

  it('is invalid when revenue is zero (no rate to solve for)', () => {
    expect(variableCostPctForTarget({ revenue: 0, fixedCost: 100, targetProfit: 10 }).valid).toBe(
      false
    );
  });
});

describe('deriveGoalSeekActuals — posted GL, no invented base', () => {
  it('returns null for an empty ledger (the old page invented $1,000,000)', () => {
    expect(deriveGoalSeekActuals([])).toBeNull();
  });

  it('nets revenue credit-normal and expenses debit-normal (no Math.abs)', () => {
    const a = deriveGoalSeekActuals(operatingLedger());
    expect(a).not.toBeNull();
    expect(a!.revenue).toBe(1000);
    expect(a!.operatingExpenses).toBe(650);
    expect(a!.netOperatingIncome).toBe(350);
  });

  it('nets a sales return instead of adding it', () => {
    const a = deriveGoalSeekActuals([gl('4000', 0, 1000), gl('4000', 150, 0)]);
    // Math.abs per entry would give 1150.
    expect(a!.revenue).toBe(850);
  });

  it('honours amount-only imports as already-signed economic amounts', () => {
    const a = deriveGoalSeekActuals([
      { accountCode: '4000', amount: 1000 },
      { accountCode: '5000', amount: 400 },
    ]);
    expect(a!.revenue).toBe(1000);
    expect(a!.operatingExpenses).toBe(400);
    expect(a!.netOperatingIncome).toBe(600);
  });
});

describe('modeledTotalCost / modeledVolatility / profitFromDraw', () => {
  it('is percent-of-revenue plus fixed, exactly', () => {
    expect(modeledTotalCost(1000, 60, 100)).toBe(700);
  });

  it('scales volatility as a percent of the base, not a hidden * 0.1', () => {
    expect(modeledVolatility(1000, 10)).toBe(100);
    expect(modeledVolatility(1250, 8)).toBe(100);
  });

  it('subtracts a draw on decimal.js (0.3 − 0.1 = 0.2)', () => {
    expect(profitFromDraw(0.3, 0.1)).toBe(0.2);
  });
});

describe('summarizeOutcomes — money average, index percentiles', () => {
  it('returns zeros for an empty series (no fabricated distribution)', () => {
    expect(summarizeOutcomes([])).toEqual({
      count: 0,
      average: 0,
      median: 0,
      p10: 0,
      p90: 0,
      positivePct: 0,
    });
  });

  it('averages 0.1 + 0.2 + 0.3 exactly and picks order statistics', () => {
    const s = summarizeOutcomes([0.1, 0.2, 0.3]);
    expect(s.count).toBe(3);
    expect(s.average).toBe(0.2);
    expect(s.median).toBe(0.2);
    expect(s.p10).toBe(0.1);
    expect(s.p90).toBe(0.3);
    expect(s.positivePct).toBe(100);
  });

  it('counts a negative draw against the positive-outcome rate', () => {
    const s = summarizeOutcomes([-10, 0, 10, 20]);
    expect(s.positivePct).toBe(75);
    expect(s.average).toBe(5);
  });
});

/** Strip comments so prose describing a defect never satisfies a guard against it. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('source-level guards against reintroduced defects', () => {
  const source = codeOnly(readFileSync('src/pages/analytics/goalSeekModel.ts', 'utf-8'));
  const page = codeOnly(readFileSync('src/pages/analytics/GoalSeekPage.tsx', 'utf-8'));

  it('contains no Math.abs (it discards contra entries)', () => {
    expect(source).not.toMatch(/Math\.abs/);
    expect(page).not.toMatch(/Math\.abs/);
  });

  it('does not invent a $1,000,000 revenue base', () => {
    expect(source).not.toMatch(/\|\|\s*1000000/);
    expect(page).not.toMatch(/\|\|\s*1000000/);
    expect(page).not.toMatch(/\$1,000,000/);
  });

  it('does not hide volatility as * 0.1 / * 0.08', () => {
    expect(source).not.toMatch(/\*\s*0\.1\b/);
    expect(source).not.toMatch(/\*\s*0\.08\b/);
    expect(source).not.toMatch(/\.times\(\s*0\.1\s*\)/);
    expect(source).not.toMatch(/\.times\(\s*0\.08\s*\)/);
    expect(page).not.toMatch(/\*\s*0\.1\b/);
    expect(page).not.toMatch(/\*\s*0\.08\b/);
  });

  it('does not do raw debit/credit or fixed/target arithmetic', () => {
    expect(source).not.toMatch(/credit\s*-\s*debit/);
    expect(page).not.toMatch(/credit\s*-\s*debit/);
    expect(page).not.toMatch(/fixedCost\s*\//);
    expect(page).not.toMatch(/fixedCost\s*\+/);
  });

  it('the page consumes the derivation instead of recomputing it', () => {
    const raw = readFileSync('src/pages/analytics/GoalSeekPage.tsx', 'utf-8');
    expect(raw).toMatch(/computeContribution/);
    expect(raw).toMatch(/deriveGoalSeekActuals/);
    expect(raw).toMatch(/summarizeOutcomes/);
  });
});
