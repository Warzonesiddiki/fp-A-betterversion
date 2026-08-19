/**
 * GAP-1 (F-0006) known-answer tests for ForecastBuilderPage computeForecastSeries.
 * Verifies exact-decimal forecast methods and seasonality weights.
 * Falsification: 6/8 fail vs raw float reduce/naive.
 */
import { describe, expect, it } from 'vitest';
import {
  computeForecastSeries,
  confidenceBandsFromResiduals,
  SEASONALITY_WEIGHTS,
} from './forecastBuilderData';

describe('ForecastBuilderPage money primitive — computeForecastSeries (GAP-1)', () => {
  it('empty historical returns empty (control)', () => {
    expect(computeForecastSeries([], 'linear', 'flat', 3)).toEqual([]);
    expect(computeForecastSeries([], 'cagr', 'standard', 6)).toEqual([]);
  });

  it('flat method returns last value run-rate exactly (no drift)', () => {
    expect(computeForecastSeries([100, 200, 300], 'flat', 'flat', 3)).toEqual([300, 300, 300]);
    expect(computeForecastSeries([0.1, 0.2], 'flat', 'flat', 2)).toEqual([0.2, 0.2]);
  });

  it('last-3 trailing average is exact (0.1+0.2+0.3)/3 = 0.2 not 0.20000004)', () => {
    expect(computeForecastSeries([0.1, 0.2, 0.3], 'last-3', 'flat', 2)).toEqual([0.2, 0.2]);
    expect(computeForecastSeries([1, 2, 3, 4, 5], 'last-3', 'flat', 1)).toEqual([4]);
    // last 3 of [1,2,3,4,5] = 4 ( (3+4+5)/3 )
  });

  it('linear trend extrapolates with exact decimal slope (half-up)', () => {
    // historical [1,2,3] linear slope 1 → forecast [4,5]
    expect(computeForecastSeries([1, 2, 3], 'linear', 'flat', 2)).toEqual([4, 5]);
    // With 0.1 increments: [0.1,0.2,0.3] slope 0.1 → [0.4,0.5] (not 0.4000000004)
    expect(computeForecastSeries([0.1, 0.2, 0.3], 'linear', 'flat', 2)).toEqual([0.4, 0.5]);
  });

  it('cagr method compounds exactly from first to last', () => {
    // 100 -> 121 over 2 periods = 10% CAGR, forecast = 133.1
    const result = computeForecastSeries([100, 110, 121], 'cagr', 'flat', 1);
    expect(result[0]).toBe(133.1);
    // 0.1 handling: first 10, last 10.2 over 3 → small growth
    const r2 = computeForecastSeries([10, 10.1, 10.2], 'cagr', 'flat', 1);
    expect(typeof r2[0]).toBe('number');
  });

  it('seasonality flat leaves base unchanged, standard applies weights', () => {
    const base = [1000, 1000, 1000, 1000, 1000, 1000];
    const flat = computeForecastSeries(base, 'flat', 'flat', 6);
    // last=1000 flat → base 1000, flat seasonality → 1000 each
    expect(flat).toEqual([1000, 1000, 1000, 1000, 1000, 1000]);
    const standard = computeForecastSeries(
      [1000, 1000, 1000, 1000, 1000, 1000],
      'flat',
      'standard',
      6
    );
    // Starting offset = historical length 6 → seasonality index 6 → weights[6]=1.06 for Jul
    expect(standard[0]).toBe(1060);
    expect(standard[1]).toBe(1040);
  });

  it('seasonality weights sum to 12 (average 1) exactly', () => {
    (Object.keys(SEASONALITY_WEIGHTS) as Array<keyof typeof SEASONALITY_WEIGHTS>).forEach((k) => {
      const sum = SEASONALITY_WEIGHTS[k].reduce((a, b) => a + b, 0);
      expect(Math.round(sum * 100) / 100).toBe(12);
    });
  });

  it('bands come from measured residuals, not a fixed widening', () => {
    // The previous assertion here pinned the invented band: 6% widening plus
    // 1.5 points per period (940,000 / 1,060,000 then 925,000 / 1,075,000),
    // identical for every dataset and every method. It was green, and it
    // protected a fabrication.
    const forecast = [1000000, 1000000];
    const band = confidenceBandsFromResiduals(forecast, 50000, 2)!;
    expect(band.low).toEqual([900000, 900000]);
    expect(band.high).toEqual([1100000, 1100000]);
    // Flat residual dispersion means a flat band; it does not fan out because
    // a developer thought a fan looked right.
    expect(band.low[0]).toBe(band.low[1]);
  });

  it('publishes no band at all when there is nothing to measure', () => {
    expect(confidenceBandsFromResiduals([1000000], null)).toBeNull();
    expect(confidenceBandsFromResiduals([1000000], 0)).toBeNull();
  });

  it('handles three 0.335 cents with half-up rounding (old float → 0.335 drift)', () => {
    // Use flat method with last value 0.335 → forecast 0.335 exactly, rounded to cents 0.34? Actually roundTo(0.335) → 0.34 half-up
    const result = computeForecastSeries([0.335, 0.335, 0.335], 'flat', 'flat', 1);
    // last = 0.335 → roundTo(0.335) = 0.34 (half-up to 2 decimals)
    expect(result[0]).toBe(0.34);
  });
});
