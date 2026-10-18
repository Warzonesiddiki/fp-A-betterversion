import { ForecastMethodEngine } from '@/engines/ForecastMethodEngine';
import { toDecimal, roundTo } from '@/utils/money';
import type { GLEntry } from '@/types';

/**
 * Phase 7 — forecast backtesting harness.
 *
 * Walk-forward evaluation of the existing ForecastMethodEngine methods:
 * at each origin the method sees only the history up to that point, then
 * its forecast is scored against the actuals that followed. A method
 * that cannot beat the naive "same as last period" baseline is labelled
 * by its own numbers — the harness never hides a loser, never invents
 * metrics for too-short history, and excludes zero actuals from MAPE
 * (division by zero) while counting exactly how many were excluded.
 */

export type BacktestMethodId = 'naive' | 'sma' | 'ses' | 'linear';

export interface MethodScore {
  method: BacktestMethodId;
  evaluatedSteps: number;
  mae: number;
  rmse: number;
  /** Mean absolute percentage error; null when every actual was zero. */
  mape: number | null;
  mapeExcludedZeros: number;
}

export interface BacktestResult {
  status: 'OK' | 'INSUFFICIENT_HISTORY';
  reason: string | null;
  methods: MethodScore[];
  winner: BacktestMethodId | null;
  origins: number;
}

export interface BacktestInput {
  periods: string[];
  values: number[];
  minTrain: number;
  horizon: number;
}

const METHOD_ORDER: BacktestMethodId[] = ['naive', 'sma', 'ses', 'linear'];
const SMA_WINDOW = 3;
const SES_ALPHA = 0.3;

function predict(method: BacktestMethodId, train: number[], horizon: number): number[] | null {
  try {
    switch (method) {
      case 'naive':
        return new Array(horizon).fill(train[train.length - 1]);
      case 'sma': {
        if (train.length < SMA_WINDOW) return null;
        const value = ForecastMethodEngine.simpleMovingAverage(train, SMA_WINDOW).forecast[0]!;
        return new Array(horizon).fill(value);
      }
      case 'ses': {
        const value = ForecastMethodEngine.exponentialSmoothing(train, SES_ALPHA).forecast[0]!;
        return new Array(horizon).fill(value);
      }
      case 'linear':
        return ForecastMethodEngine.linearRegression(train, horizon).forecast.slice(0, horizon);
    }
  } catch {
    return null;
  }
}

export function backtestForecast(input: BacktestInput): BacktestResult {
  const { values, minTrain, horizon } = input;
  if (values.length < minTrain + horizon) {
    return {
      status: 'INSUFFICIENT_HISTORY',
      reason: `Backtesting needs at least ${minTrain + horizon} periods (${minTrain} to train + ${horizon} to score); only ${values.length} available.`,
      methods: [],
      winner: null,
      origins: 0,
    };
  }

  const errors = new Map<
    BacktestMethodId,
    { abs: string[]; ape: number[]; zeros: number; steps: number }
  >();
  for (const m of METHOD_ORDER) errors.set(m, { abs: [], ape: [], zeros: 0, steps: 0 });

  let origins = 0;
  for (let trainEnd = minTrain; trainEnd + horizon <= values.length; trainEnd += 1) {
    origins += 1;
    const train = values.slice(0, trainEnd);
    const actuals = values.slice(trainEnd, trainEnd + horizon);
    for (const method of METHOD_ORDER) {
      const forecast = predict(method, train, horizon);
      if (!forecast || forecast.length < horizon) continue;
      const bucket = errors.get(method)!;
      for (let h = 0; h < horizon; h += 1) {
        const actual = actuals[h]!;
        const err = toDecimal(actual).minus(toDecimal(forecast[h]!));
        bucket.abs.push(err.abs().toString());
        bucket.steps += 1;
        if (actual === 0) bucket.zeros += 1;
        else
          bucket.ape.push(
            err
              .abs()
              .div(toDecimal(Math.abs(actual)))
              .times(100)
              .toNumber()
          );
      }
    }
  }

  const methods: MethodScore[] = METHOD_ORDER.map((method) => {
    const bucket = errors.get(method)!;
    const absSum = bucket.abs.reduce((acc, v) => acc.plus(toDecimal(v)), toDecimal(0));
    const sqSum = bucket.abs.reduce((acc, v) => acc.plus(toDecimal(v).pow(2)), toDecimal(0));
    return {
      method,
      evaluatedSteps: bucket.steps,
      mae: bucket.steps ? roundTo(absSum.div(bucket.steps), 4) : 0,
      rmse: bucket.steps ? roundTo(sqSum.div(bucket.steps).sqrt(), 4) : 0,
      mape:
        bucket.ape.length > 0
          ? roundTo(bucket.ape.reduce((a, b) => a + b, 0) / bucket.ape.length, 4)
          : null,
      mapeExcludedZeros: bucket.zeros,
    };
  }).filter((m) => m.evaluatedSteps > 0);

  const winner =
    methods.length === 0
      ? null
      : [...methods].sort((a, b) => {
          const aKey = a.mape ?? Number.POSITIVE_INFINITY;
          const bKey = b.mape ?? Number.POSITIVE_INFINITY;
          if (aKey !== bKey) return aKey - bKey;
          return a.mae - b.mae;
        })[0]!.method;

  return { status: 'OK', reason: null, methods, winner, origins };
}

export interface MonthlySeries {
  periods: string[];
  values: number[];
  missingPeriods: string[];
  complete: boolean;
}

/**
 * Monthly signed totals (debit − credit) for one account, in calendar
 * order. Months inside the span with no entries are disclosed in
 * `missingPeriods` — never silently zero-filled.
 */
export function monthlySeriesForAccount(entries: GLEntry[], accountCode: string): MonthlySeries {
  const byMonth = new Map<string, ReturnType<typeof toDecimal>>();
  for (const e of entries) {
    if (e.accountCode !== accountCode) continue;
    const month = (e.postDate ?? e.date).slice(0, 7);
    const net = toDecimal(e.debit).minus(toDecimal(e.credit));
    byMonth.set(month, (byMonth.get(month) ?? toDecimal(0)).plus(net));
  }
  const periods = [...byMonth.keys()].sort();
  if (periods.length === 0) return { periods: [], values: [], missingPeriods: [], complete: true };

  const missingPeriods: string[] = [];
  const [first, last] = [periods[0]!, periods[periods.length - 1]!];
  let cursor = first;
  while (cursor < last) {
    const [y, m] = cursor.split('-').map(Number) as [number, number];
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    if (next < last && !byMonth.has(next)) missingPeriods.push(next);
    cursor = next;
  }

  return {
    periods,
    values: periods.map((p) => roundTo(byMonth.get(p)!, 2)),
    missingPeriods,
    complete: missingPeriods.length === 0,
  };
}
