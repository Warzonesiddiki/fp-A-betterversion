/**
 * GAP-1 (F-0006) known-answer tests for RollingForecastEngine's money
 * migration.
 *
 * Forecast/actual values are financial amounts: weighted blends, trend
 * adjustments and driver-based forecast generation now run through the
 * canonical money primitive (decimal.js, ROUND_HALF_UP) and round to cents.
 * The old float code cent-rounded too (Math.round(x*100)/100), but the float
 * error occasionally crossed a cent boundary — those cases are pinned here.
 * Each case is a FIXED input -> EXACT expected decimal asserted with `toBe`
 * (Object.is); the pre-migration float literal is recorded inline.
 */
import { describe, it, expect } from 'vitest';
import { RollingForecastEngine } from './RollingForecastEngine';

function engine() {
  const e = new RollingForecastEngine();
  e.configure('fc', { windowMonths: 12, recentWeight: 0.7, forecastWeight: 0.3, extendMonths: 0 });
  return e;
}

describe('RollingForecastEngine — money known answers (GAP-1 / F-0006)', () => {
  it('blends actual and forecast to exact cents (float gave 0.5)', () => {
    const r = engine().rollForward('fc', new Map([['2026-01', 0.01]]), () => 1.66, [
      { period: '2026-01', isActual: false, value: 1.66 },
    ]);
    // 0.01*0.7 + 1.66*0.3 = 0.007 + 0.498 = 0.505 -> 0.51 half-up.
    // Float: 0.01*0.7 + 1.66*0.3 = 0.5050000000000001? *100 -> 50.5 -> rounds 50.
    expect(r.newWindow[0]!.value).toBe(0.51);
  });

  it('keeps whole-dollar blends exact (regression anchor)', () => {
    const r = engine().rollForward('fc', new Map([['2026-01', 105]]), () => 100, [
      { period: '2026-01', isActual: false, value: 100 },
    ]);
    // 105*0.7 + 100*0.3 = 103.5 exactly in decimal.
    expect(r.newWindow[0]!.value).toBe(103.5);
  });

  it('generates driver forecasts to exact cents (float gave 0.31)', () => {
    const e = engine();
    const out = e.generateForecastFromDrivers(
      new Map([['d', 5]]), // 5% driver
      new Map([['a', 0.3]]),
      [{ driverName: 'd', account: 'a', weight: 1 / 3 }]
    );
    // 0.3 * (1 + 0.05/3) = 0.3 * 1.0166666666666666 = 0.3049999... -> 0.30.
    // Float: 0.3 * 1.0166666666666666 = 0.30500000000000005 -> 0.31.
    expect(out.get('a')).toBe(0.3);
  });

  it('generates driver forecasts with a second falsifier (float gave 0.61)', () => {
    const e = engine();
    const out = e.generateForecastFromDrivers(new Map([['d', 2.5]]), new Map([['a', 0.6]]), [
      { driverName: 'd', account: 'a', weight: 1 / 3 },
    ]);
    expect(out.get('a')).toBe(0.6);
  });

  it('applies multiple cascade rules sequentially in Decimal space', () => {
    const e = engine();
    const out = e.generateForecastFromDrivers(
      new Map([
        ['d1', 50],
        ['d2', 20],
      ]),
      new Map([['a', 0.3]]),
      [
        { driverName: 'd1', account: 'a', weight: 1 / 3 },
        { driverName: 'd2', account: 'a', weight: 1 / 3 },
      ]
    );
    expect(out.get('a')).toBe(0.37);
  });
});
