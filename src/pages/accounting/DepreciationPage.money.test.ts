/**
 * GAP-1 (F-0006) known-answer tests for DepreciationPage totals.
 *
 * Per-asset accumulated depreciation, totalCost, totalAccumulated, totalNBV
 * and year-by-year book-value chart sums previously used raw float reduce
 * / `+=` / Math.max(a.cost - accumulated). Now accumulate at full Decimal
 * precision and cent-round once. The depreciation rate is a % metric
 * (non-money) and stays float.
 *
 * Falsification: replacing helper bodies with raw float math makes 3 of 5
 * tests fail.
 */

import { describe, expect, it } from 'vitest';
import {
  computeAccumulatedFromSchedule,
  computeBookValueByYear,
  sumAccumulatedDepreciation,
  sumDepreciationCost,
  sumNetBookValue,
} from './DepreciationPage';

describe('DepreciationPage totals — money known answers (GAP-1)', () => {
  it('empty lists return 0 (control)', () => {
    expect(sumDepreciationCost([])).toBe(0);
    expect(sumAccumulatedDepreciation([])).toBe(0);
    expect(sumNetBookValue([])).toBe(0);
    expect(computeAccumulatedFromSchedule([], 0)).toBe(0);
    expect(computeBookValueByYear([], 2)).toEqual([
      { year: 'Y1', book: 0 },
      { year: 'Y2', book: 0 },
    ]);
  });

  it('sums cost/NBV exactly (old: 100.10+200.20 = 300.30000000000006)', () => {
    const assets = [
      { cost: 100.1, salvage: 0, accumulated: 10, currentValue: 90.1 },
      { cost: 200.2, salvage: 0, accumulated: 20, currentValue: 180.2 },
      { cost: 300.3, salvage: 0, accumulated: 30, currentValue: 270.3 },
    ];
    expect(sumDepreciationCost(assets)).toBe(600.6);
    expect(sumAccumulatedDepreciation(assets)).toBe(60);
    expect(sumNetBookValue(assets)).toBe(540.6);
  });

  it('accumulated-from-schedule sums exact decimals', () => {
    // 0.10 + 0.20 + 0.30 = 0.60 exactly.
    const sched = [{ depreciation: 0.1 }, { depreciation: 0.2 }, { depreciation: 0.3 }];
    expect(computeAccumulatedFromSchedule(sched, 3)).toBe(0.6);
    expect(computeAccumulatedFromSchedule(sched, 2)).toBe(0.3);
    expect(computeAccumulatedFromSchedule(sched, 0)).toBe(0);
  });

  it('three 0.335-depreciation years round half-up to 1.01 (old: 1.00)', () => {
    const sched = [{ depreciation: 0.335 }, { depreciation: 0.335 }, { depreciation: 0.335 }];
    expect(computeAccumulatedFromSchedule(sched, 3)).toBe(1.01);
  });

  it('book value by year sums exactly across multiple assets', () => {
    const assets = [
      { schedule: [{ endingValue: 90.1 }, { endingValue: 80.2 }], salvage: 0 },
      { schedule: [{ endingValue: 180.2 }, { endingValue: 160.4 }], salvage: 0 },
    ];
    const series = computeBookValueByYear(assets, 2);
    expect(series[0]!.book).toBe(270.3);
    expect(series[1]!.book).toBe(240.6);
  });
});
