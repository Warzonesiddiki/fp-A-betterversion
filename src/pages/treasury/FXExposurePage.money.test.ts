/**
 * GAP-1 (F-0006) known-answer tests for FXExposurePage computeFXExposureTotals.
 *
 * FXExposurePage aggregates per-currency exposure/hedged/unrealizedGL with
 * sumMoney+roundTo so the headline KPIs and overallHedgeRatio (a percent
 * ratio) are exact to the cent and don't drift on cent-equal books.
 *
 * Falsification: under raw float reduce `+` the 0.1/0.2/0.3 family
 * produces 0.30000000000000004 etc. — restored to decimal, results are exact.
 */

import { describe, expect, it } from 'vitest';
import { computeFXExposureTotals, type FXExposure } from './FXExposurePage';

function e(currency: string, exposure: number, hedged: number, unrealizedGL: number): FXExposure {
  return { currency, symbol: '$', exposure, rate: 1, hedged, hedgeRatio: 0, unrealizedGL };
}

describe('computeFXExposureTotals — money known answers (GAP-1)', () => {
  it('empty exposures → all zeros (control)', () => {
    const t = computeFXExposureTotals([]);
    expect(t.totalExposure).toBe(0);
    expect(t.totalHedged).toBe(0);
    expect(t.totalUnrealizedGL).toBe(0);
    expect(t.overallHedgeRatio).toBe(0);
  });

  it('three 0.1 exposures sum to 0.30 exactly (old: 0.30000000000000004)', () => {
    const t = computeFXExposureTotals([
      e('EUR', 0.1, 0, 0),
      e('GBP', 0.1, 0, 0),
      e('JPY', 0.1, 0, 0),
    ]);
    expect(t.totalExposure).toBe(0.3);
  });

  it('three 0.335 hedged → 1.01 half-up (old: 1.00)', () => {
    const t = computeFXExposureTotals([
      e('EUR', 100, 0.335, 0),
      e('GBP', 100, 0.335, 0),
      e('JPY', 100, 0.335, 0),
    ]);
    expect(t.totalHedged).toBe(1.01);
  });

  it('positive + negative unrealized G/L net to exact 0', () => {
    const t = computeFXExposureTotals([e('EUR', 100, 50, 0.1), e('GBP', 100, 50, -0.1)]);
    expect(t.totalUnrealizedGL).toBe(0);
  });

  it('overallHedgeRatio: 60 hedged of 200 exposure = 30%', () => {
    const t = computeFXExposureTotals([e('EUR', 100, 30, 0), e('GBP', 100, 30, 0)]);
    expect(t.overallHedgeRatio).toBe(30);
  });

  it('overallHedgeRatio on 0.1 + 0.2 exposure is exact (60 / 30%)', () => {
    const t = computeFXExposureTotals([e('EUR', 0.1, 0.03, 0), e('GBP', 0.2, 0.03, 0)]);
    expect(t.totalExposure).toBe(0.3);
    expect(t.totalHedged).toBe(0.06);
    expect(t.overallHedgeRatio).toBe(20);
  });
});
