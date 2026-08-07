/**
 * YieldCurveEngine.ext.test.ts — bootstrap/interpolate/forward/par known
 * answers (MISSION D wave 2, 2026-08-07).
 */
import { describe, expect, it } from 'vitest';
import { YieldCurveEngine, type CurvePoint } from './YieldCurveEngine';

const curve: CurvePoint[] = [
  { maturity: 1, rate: 0.02 },
  { maturity: 2, rate: 0.03 },
  { maturity: 5, rate: 0.05 },
  { maturity: 10, rate: 0.06 },
];

describe('YieldCurveEngine — interpolation', () => {
  it('clamps outside the curve to the endpoint rates', () => {
    expect(YieldCurveEngine.interpolate(0.5, curve)).toBeCloseTo(0.02, 10);
    expect(YieldCurveEngine.interpolate(15, curve)).toBeCloseTo(0.06, 10);
    expect(YieldCurveEngine.interpolate(5, curve)).toBeCloseTo(0.05, 10);
    expect(YieldCurveEngine.interpolate(1, [])).toBe(0);
  });

  it('linear interpolation between knots', () => {
    // 3y between 2y=3% and 5y=5% → 3 + (5-3)*(1/3) = 3.6667%
    expect(YieldCurveEngine.interpolate(3, curve)).toBeCloseTo(0.036667, 4);
    // 7.5y between 5y=5% and 10y=6% → 5 + 1*0.5 = 5.5%
    expect(YieldCurveEngine.interpolate(7.5, curve)).toBeCloseTo(0.055, 4);
  });

  it('cubic interpolation differs from linear in the interior', () => {
    const linear = YieldCurveEngine.interpolate(3, curve, 'linear');
    const cubic = YieldCurveEngine.interpolate(3, curve, 'cubic');
    expect(cubic).toBeCloseTo(linear, 1); // same ballpark
    expect(Math.abs(cubic - linear)).toBeGreaterThan(1e-6); // but not identical
  });

  it('bootstraps a sorted curve filling zero rates by interpolation', () => {
    const bootstrapped = YieldCurveEngine.bootstrap([
      { maturity: 10, rate: 0.06 },
      { maturity: 1, rate: 0.02 },
      { maturity: 5, rate: 0 },
    ]);
    expect(bootstrapped.map((p) => p.maturity)).toEqual([1, 5, 10]);
    expect(bootstrapped[0]!.rate).toBe(0.02);
    // zero rate at 5y filled by linear interp between 1y and 10y
    expect(bootstrapped[1]!.rate).toBeCloseTo(0.02 + (0.06 - 0.02) * (4 / 9), 4);
    expect(bootstrapped[2]!.rate).toBe(0.06);
  });
});

describe('YieldCurveEngine — forward / spot / par', () => {
  it('forwardRate computes the implied forward', () => {
    // 2y fwd from 1y: (0.03*2 - 0.02*1)/1 = 4%
    expect(YieldCurveEngine.forwardRate(curve, 1, 2)).toBeCloseTo(0.04, 6);
    // degenerate window → 0
    expect(YieldCurveEngine.forwardRate(curve, 2, 1)).toBe(0);
  });

  it('spotRate is the interpolated rate', () => {
    expect(YieldCurveEngine.spotRate(curve, 5)).toBeCloseTo(0.05, 10);
  });

  it('parRate of a flat curve equals the flat rate', () => {
    const flat: CurvePoint[] = [
      { maturity: 1, rate: 0.05 },
      { maturity: 2, rate: 0.05 },
      { maturity: 3, rate: 0.05 },
      { maturity: 4, rate: 0.05 },
      { maturity: 5, rate: 0.05 },
    ];
    for (const m of [1, 2, 3, 5]) {
      expect(YieldCurveEngine.parRate(flat, m)).toBeCloseTo(0.05, 4);
    }
    expect(YieldCurveEngine.parRate(flat, 0)).toBe(0);
  });

  it('parRate of a rising curve is below the long spot', () => {
    // coupon at par is lower than the 10y spot when the curve rises
    expect(YieldCurveEngine.parRate(curve, 10)).toBeLessThan(0.06);
  });
});
