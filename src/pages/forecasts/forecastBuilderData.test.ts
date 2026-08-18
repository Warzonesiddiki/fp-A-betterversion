import { describe, it, expect } from 'vitest';
import {
  backtestForecastMethod,
  confidenceBandsFromResiduals,
  deriveMonthlyRevenue,
  MIN_HISTORY_FOR_BACKTEST,
  type ForecastGLEntry,
} from './forecastBuilderData';

/**
 * Known-answer tests for the forecast-builder derivation.
 *
 * The old page forecast from six invented months and published four literal
 * accuracy statistics (MAPE 4.2%, RMSE $182K, R² 0.94, Bias −1.8%).
 */
function rev(period: string, amount: number): ForecastGLEntry {
  return { accountCode: '4000', period, debit: 0, credit: amount };
}

describe('deriveMonthlyRevenue', () => {
  it('reads posted revenue by period, credit-normal and netted', () => {
    const entries: ForecastGLEntry[] = [
      rev('2026-01', 100000),
      { accountCode: '4000', period: '2026-01', debit: 10000, credit: 0 }, // refund
      rev('2026-02', 120000),
      { accountCode: '6000', period: '2026-02', debit: 999, credit: 0 }, // expense: ignored
    ];
    expect(deriveMonthlyRevenue(entries)).toEqual([
      { month: '2026-01', value: 90000 },
      { month: '2026-02', value: 120000 },
    ]);
  });

  it('returns nothing when no revenue is posted', () => {
    expect(deriveMonthlyRevenue([])).toEqual([]);
    expect(
      deriveMonthlyRevenue([{ accountCode: '1000', period: '2026-01', debit: 5, credit: 0 }])
    ).toEqual([]);
  });
});

describe('backtestForecastMethod', () => {
  it('scores a perfectly flat series at zero error', () => {
    const flat = [100, 100, 100, 100, 100, 100];
    const a = backtestForecastMethod(flat, 'flat', 'flat');
    expect(a.sampleCount).toBe(3); // months 4, 5, 6
    expect(a.mapePercent).toBe(0);
    expect(a.rmse).toBe(0);
    expect(a.biasPercent).toBe(0);
    expect(a.residualStdDev).toBe(0);
  });

  it('measures a real error instead of asserting 4.2%', () => {
    // flat method predicts the previous value; the series steps up by 10 each
    // month, so every one-step prediction is 10 low.
    const rising = [100, 110, 120, 130, 140];
    const a = backtestForecastMethod(rising, 'flat', 'flat');
    expect(a.sampleCount).toBe(2); // predicts month 4 and month 5
    expect(a.rmse).toBe(10);
    // errors: 10/130 and 10/140 -> 7.69% and 7.14% -> mean 7.42%
    expect(a.mapePercent).toBe(7.42);
    // Under-forecast, so bias is positive on actual − predicted.
    expect(a.biasPercent).toBeGreaterThan(0);
    expect(a.mapePercent).not.toBe(4.2);
  });

  it('reports nulls, not numbers, when history is too short to test', () => {
    const a = backtestForecastMethod([100, 110], 'linear', 'flat');
    expect(a.sampleCount).toBe(0);
    expect(a.mapePercent).toBeNull();
    expect(a.rmse).toBeNull();
    expect(a.rSquared).toBeNull();
    expect(a.biasPercent).toBeNull();
    expect(a.residualStdDev).toBeNull();
  });

  it('needs MIN_HISTORY_FOR_BACKTEST months before it scores anything', () => {
    const justShort = Array.from({ length: MIN_HISTORY_FOR_BACKTEST - 1 }, () => 100);
    expect(backtestForecastMethod(justShort, 'flat', 'flat').sampleCount).toBe(0);
    const justEnough = Array.from({ length: MIN_HISTORY_FOR_BACKTEST }, () => 100);
    expect(backtestForecastMethod(justEnough, 'flat', 'flat').sampleCount).toBe(1);
  });

  it('scores each method separately — accuracy is not a page-level constant', () => {
    const rising = [100, 110, 120, 130, 140, 150];
    const flat = backtestForecastMethod(rising, 'flat', 'flat');
    const linear = backtestForecastMethod(rising, 'linear', 'flat');
    // A linear method fits a linear series better than a run-rate does.
    expect(linear.rmse!).toBeLessThan(flat.rmse!);
  });

  it('explains variance with R-squared rather than asserting 0.94', () => {
    const rising = [100, 110, 120, 130, 140, 150];
    const linear = backtestForecastMethod(rising, 'linear', 'flat');
    expect(linear.rSquared).not.toBeNull();
    expect(linear.rSquared!).toBeGreaterThan(0.9);
    expect(linear.rSquared).not.toBe(0.94);
  });
});

describe('confidenceBandsFromResiduals', () => {
  it('widens by the measured dispersion, not by period index', () => {
    const band = confidenceBandsFromResiduals([1000, 1000, 1000], 100, 1.96)!;
    expect(band.low).toEqual([804, 804, 804]);
    expect(band.high).toEqual([1196, 1196, 1196]);
    expect(band.z).toBe(1.96);
  });

  it('publishes nothing when dispersion could not be measured', () => {
    expect(confidenceBandsFromResiduals([1000], null)).toBeNull();
    expect(confidenceBandsFromResiduals([1000], 0)).toBeNull();
    expect(confidenceBandsFromResiduals([1000], Number.NaN)).toBeNull();
  });
});
