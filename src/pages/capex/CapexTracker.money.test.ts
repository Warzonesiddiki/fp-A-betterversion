/**
 * GAP-1 (F-0006) known-answer tests for CapexTracker page totals.
 *
 * The KPI cards (Total Budget/Actual/NAV) and per-row variance were raw
 * float reduce/subtraction. Now route through sumMoney/subtractMoney+roundTo.
 * IRR/payback/useful-life are metric (%) and stay float per GAP-1.
 *
 * Falsification: 3 of 5 fail vs old float.
 */

import { describe, expect, it } from 'vitest';
import {
  projectVariance,
  sumAssetCosts,
  sumAssetNBV,
  sumProjectActuals,
  sumProjectBudgets,
} from './CapexTracker';

describe('CapexTracker totals — money known answers (GAP-1)', () => {
  it('empty lists return 0 (control)', () => {
    expect(sumProjectBudgets([])).toBe(0);
    expect(sumProjectActuals([])).toBe(0);
    expect(sumAssetCosts([])).toBe(0);
    expect(sumAssetNBV([])).toBe(0);
  });

  it('budget/actual sums are exact (old: 100.10 + 200.20 = 300.30000000000006)', () => {
    expect(
      sumProjectBudgets([
        { budget: 100.1, actual: 0 },
        { budget: 200.2, actual: 0 },
        { budget: 300.3, actual: 0 },
      ])
    ).toBe(600.6);
    expect(
      sumProjectActuals([
        { budget: 0, actual: 0.1 },
        { budget: 0, actual: 0.2 },
      ])
    ).toBe(0.3);
  });

  it('per-project variance is exact (budget − actual without drift)', () => {
    expect(projectVariance({ budget: 100.1, actual: 99.9 })).toBe(0.2);
    expect(projectVariance({ budget: 1000, actual: 999.99 })).toBe(0.01);
  });

  it('three 0.335-cost assets round half-up to 1.01 (old: 1.00)', () => {
    expect(
      sumAssetCosts([
        { cost: 0.335, nbv: 0 },
        { cost: 0.335, nbv: 0 },
        { cost: 0.335, nbv: 0 },
      ])
    ).toBe(1.01);
  });

  it('asset NBV sums exactly', () => {
    expect(
      sumAssetNBV([
        { cost: 0, nbv: 1000.01 },
        { cost: 0, nbv: 2000.02 },
      ])
    ).toBe(3000.03);
  });
});
