/**
 * GAP-1 (F-0006) known-answer tests for DepreciationEngine's residual
 * money drift.
 *
 * `impairmentTest` (carrying − recoverable), `assetDisposal`
 * (book value, gain/loss), `assetRevaluation` (surplus + raw `Math.round`
 * on adjusted accumulated depreciation), and the declining-balance schedule
 * wrapper (accumulated sums, beginning/ending values) run raw `-`, `+`,
 * `Math.round` over IEEE-754 doubles on currency. The straight-line path was
 * already migrated; each fixed input asserts the exact result with `toBe`;
 * the pre-migration float output is recorded inline.
 */

import { describe, expect, it } from 'vitest';
import { DepreciationEngine } from './DepreciationEngine';

describe('DepreciationEngine — money known answers (GAP-1 / F-0006)', () => {
  it('computes impairment loss exactly (old float: 0.19999999999999998)', () => {
    const result = DepreciationEngine.impairmentTest(0.3, 0.1);

    expect(result.isImpaired).toBe(true);
    expect(result.impairmentLoss).toBe(0.2);
    expect(result.adjustedValue).toBe(0.1);
  });

  it('computes disposal book value and gain/loss exactly (old float: 0.19999999999999998 / -0.04999999999999999)', () => {
    const result = DepreciationEngine.assetDisposal(0.3, 0.1, 0.15);

    expect(result.bookValue).toBe(0.2);
    expect(result.gainLoss).toBe(-0.05);
    expect(result.isGain).toBe(false);
  });

  it('revaluates with exact accumulated depreciation, not Math.round (old float: 0 → 0.08)', () => {
    // ratio = 0.3 / 0.2 = 1.5; adjusted accumulated dep = 0.05 × 1.5 =
    // 0.075. Old code: Math.round(0.075) — 0.075 in IEEE-754 is
    // 0.074999999999999997…, which rounds to 0, wiping accumulated
    // depreciation entirely. Declared half-up gives 0.08.
    const result = DepreciationEngine.assetRevaluation(0.2, 0.05, 0.3);

    expect(result.revaluationSurplus).toBe(0.15);
    expect(result.adjustedCost).toBe(0.3);
    expect(result.adjustedAccumDep).toBe(0.08);
  });

  it('builds the declining-balance schedule with exact accumulated values (old float: 0.10999999999999999)', () => {
    const result = DepreciationEngine.generateSchedule('decliningBalance', 0.3, 0, 5);

    const row2 = result[1];
    expect(row2?.period).toBe(2);
    expect(row2?.beginningValue).toBe(0.18);
    expect(row2?.depreciation).toBe(0.07);
    expect(row2?.accumulated).toBe(0.19);
    // Old float: 0.3 − (0.12 + 0.07) = 0.10999999999999999; exact: 0.11.
    expect(row2?.endingValue).toBe(0.11);

    const row5 = result[4];
    expect(row5?.endingValue).toBe(0.02);
  });
});
