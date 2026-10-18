import { describe, it, expect } from 'vitest';
import { backtestForecast, monthlySeriesForAccount } from './backtestForecast';
import type { GLEntry } from '@/types';

/**
 * Phase 7 forecast backtesting harness: walk-forward evaluation of the
 * existing ForecastMethodEngine methods against held-out actuals. Every
 * metric below is hand-computed or directionally certain — a forecaster
 * that cannot beat its own history is labelled, never hidden.
 */
describe('backtestForecast — walk-forward accuracy', () => {
  it('a perfect trend gives the linear method zero error and the win', () => {
    const result = backtestForecast({
      periods: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'],
      values: [10, 20, 30, 40, 50, 60],
      minTrain: 3,
      horizon: 1,
    });
    expect(result.status).toBe('OK');
    const linear = result.methods.find((m) => m.method === 'linear')!;
    expect(linear.evaluatedSteps).toBe(3);
    expect(linear.mae).toBe(0);
    expect(linear.mape).toBe(0);
    expect(result.winner).toBe('linear');
    // Naive on a +10 trend is wrong by exactly 10 every step.
    const naive = result.methods.find((m) => m.method === 'naive')!;
    expect(naive.mae).toBe(10);
  });

  it('excludes zero actuals from MAPE and says how many were excluded', () => {
    const result = backtestForecast({
      periods: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'],
      values: [0, 10, 0, 20, 30],
      minTrain: 2,
      horizon: 1,
    });
    const naive = result.methods.find((m) => m.method === 'naive')!;
    // Steps: train[0,10]->10 vs actual 0 (excluded), [0,10,0]->0 vs 20, [..20]->20 vs 30.
    expect(naive.evaluatedSteps).toBe(3);
    expect(naive.mapeExcludedZeros).toBe(1);
    expect(naive.mape).not.toBeNull();
  });

  it('refuses honestly when history is too short — no invented metrics', () => {
    const result = backtestForecast({
      periods: ['2026-01', '2026-02'],
      values: [10, 20],
      minTrain: 3,
      horizon: 1,
    });
    expect(result.status).toBe('INSUFFICIENT_HISTORY');
    expect(result.methods).toEqual([]);
    expect(result.winner).toBeNull();
    expect(result.reason).toMatch(/at least/i);
  });

  it('on a noisy rising series the trend method beats naive on MAE', () => {
    const values = [100, 108, 115, 121, 130, 138, 145, 152, 161, 169, 178, 186];
    const result = backtestForecast({
      periods: values.map((_, i) => `2026-${String(i + 1).padStart(2, '0')}`),
      values,
      minTrain: 6,
      horizon: 1,
    });
    const linear = result.methods.find((m) => m.method === 'linear')!;
    const naive = result.methods.find((m) => m.method === 'naive')!;
    expect(linear.mae).toBeLessThan(naive.mae);
  });
});

describe('monthlySeriesForAccount — GL adapter with gap honesty', () => {
  const entries = [
    { id: '1', postDate: '2026-01-05', accountCode: '4010', debit: 0, credit: 100 },
    { id: '2', postDate: '2026-01-20', accountCode: '4010', debit: 0, credit: 50 },
    { id: '3', postDate: '2026-03-02', accountCode: '4010', debit: 0, credit: 70 },
    { id: '4', postDate: '2026-03-02', accountCode: '9999', debit: 0, credit: 999 },
  ] as unknown as GLEntry[];

  it('sums signed amounts per month and discloses the missing month', () => {
    const series = monthlySeriesForAccount(entries, '4010');
    expect(series.periods).toEqual(['2026-01', '2026-03']);
    expect(series.values).toEqual([-150, -70]);
    expect(series.missingPeriods).toEqual(['2026-02']);
    expect(series.complete).toBe(false);
  });
});
