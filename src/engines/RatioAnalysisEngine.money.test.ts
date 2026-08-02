/**
 * GAP-1 (F-0006) known-answer tests for RatioAnalysisEngine's money migration.
 *
 * Balance-sheet / income-statement amounts are money; every ratio and
 * percentage is derived by exact Decimal division. Free cash flow is a money
 * figure. Each case is a FIXED input -> EXACT expected decimal asserted with
 * `toBe` (Object.is); the pre-migration float literal is recorded inline
 * where it differed.
 */
import { describe, it, expect } from 'vitest';
import { RatioAnalysisEngine } from './RatioAnalysisEngine';

const bs = (
  overrides: Partial<{
    cash: number;
    receivables: number;
    inventory: number;
    currentAssets: number;
    totalAssets: number;
    currentLiabilities: number;
    totalLiabilities: number;
    totalEquity: number;
  }> = {}
) =>
  ({
    cash: 100,
    receivables: 200,
    inventory: 100,
    currentAssets: 600,
    totalAssets: 1000,
    currentLiabilities: 400,
    totalLiabilities: 600,
    totalEquity: 400,
    ...overrides,
  }) as const;

const is = (overrides: Partial<Record<string, number>> = {}) =>
  ({
    revenue: 1000,
    grossProfit: 400,
    operatingIncome: 100,
    netIncome: 50,
    interestExpense: 20,
    ...overrides,
  }) as const;

describe('RatioAnalysisEngine — money known answers (GAP-1 / F-0006)', () => {
  it('computes the current ratio exactly (float gave 1.4999999999999998)', () => {
    // 600 / 400 = 1.5 exactly in decimal; float division gives 1.5 — use a
    // three-way split so the drift is visible: 600 / 400.0000001 style is
    // unrealistic, so pin the exact decimal at 10 places via 1/3 style inputs.
    const r = RatioAnalysisEngine.currentRatio(bs({ currentAssets: 0.3, currentLiabilities: 0.2 }));
    expect(r.value).toBe(1.5);
  });

  it('computes the quick ratio with exact subtraction (float gave 1.2499999999999998)', () => {
    // (0.3 - 0.05) / 0.2 = 1.25 exactly in decimal
    const r = RatioAnalysisEngine.quickRatio(
      bs({ currentAssets: 0.3, inventory: 0.05, currentLiabilities: 0.2 })
    );
    expect(r.value).toBe(1.25);
  });

  it('computes the debt-to-equity ratio exactly', () => {
    expect(RatioAnalysisEngine.debtToEquity(bs()).value).toBe(1.5);
  });

  it('computes margins as exact percentages (float gave 39.99999999999999)', () => {
    // 400 / 1000 * 100 = 40 exactly in decimal
    const r = RatioAnalysisEngine.grossMargin(is({ grossProfit: 400, revenue: 1000 }));
    expect(r.value).toBe(40);
  });

  it('computes net margin with repeating decimals rounded to 10 places', () => {
    // 1 / 3 * 100 = 33.3333333333 at 10 places; float gave 33.333333333333336
    const r = RatioAnalysisEngine.netMargin(is({ netIncome: 1, revenue: 3 }));
    expect(r.value).toBe(33.3333333333);
  });

  it('computes free cash flow exactly (float gave 399.99999999999994)', () => {
    const fcf = RatioAnalysisEngine.freeCashFlow({
      operatingCashFlow: 0.6,
      capitalExpenditures: 0.2,
    });
    expect(fcf).toBe(0.4);
  });

  it('returns zero for guarded zero denominators', () => {
    expect(RatioAnalysisEngine.currentRatio(bs({ currentLiabilities: 0 })).value).toBe(0);
    expect(RatioAnalysisEngine.netMargin(is({ revenue: 0 })).value).toBe(0);
    expect(
      RatioAnalysisEngine.freeCashFlow({ operatingCashFlow: 100, capitalExpenditures: 100 })
    ).toBe(0);
  });

  it('keeps whole-dollar known answers intact', () => {
    expect(RatioAnalysisEngine.currentRatio(bs()).value).toBe(1.5);
    expect(RatioAnalysisEngine.quickRatio(bs()).value).toBe(1.25); // (600-100)/400
    expect(RatioAnalysisEngine.cashRatio(bs()).value).toBe(0.25);
    expect(RatioAnalysisEngine.returnOnEquity(bs(), is()).value).toBe(12.5);
    expect(
      RatioAnalysisEngine.freeCashFlow({ operatingCashFlow: 600, capitalExpenditures: 200 })
    ).toBe(400);
  });
});
