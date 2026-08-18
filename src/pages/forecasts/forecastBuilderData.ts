/**
 * Forecast-builder inputs, backtested accuracy and residual-based bands.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. **History must be the user's history.** The page forecast from
 *    `HISTORICAL_ACTUALS = [4_200_000, 3_900_000, 4_500_000, 4_100_000,
 *    4_400_000, 4_600_000]` — six invented months — and exported the result.
 *    History now comes from posted revenue (prefix 4, credit-normal) by period.
 * 2. **Accuracy statistics must be measured.** `MAPE 4.2%`, `RMSE $182K`,
 *    `R-Squared 0.94` and `Bias −1.8%` were literals in an array, rendered
 *    under the heading "Forecast Accuracy" as though the model had been
 *    evaluated. They are now produced by a walk-forward backtest of the
 *    SELECTED method against the user's own posted months, or reported as
 *    unavailable when there is too little history to test.
 * 3. **A confidence band must come from residuals.** The old band was
 *    `widenPct = 0.06 + i * 0.015` — 6% widening by 1.5 points per period,
 *    identical for every dataset and every method. Bands are now
 *    `forecast ± z · σ(residuals)` from the backtest, and are omitted entirely
 *    when no backtest is possible.
 * 4. **A prior forecast that was never made cannot be plotted.** The history
 *    chart drew `actual + round(actual * 0.02 − 50_000)` as the "forecast"
 *    line over past months, manufacturing a track record that tracked actuals.
 *    Past periods now show actuals only.
 * 5. Seasonality presets remain user-selected MODEL ASSUMPTIONS and are
 *    labelled as such — they are not measured from the data.
 * 6. All money arithmetic is decimal.js via `@/utils/money`.
 */

import Decimal from 'decimal.js';
import {
  divideMoney,
  multiplyMoney,
  roundTo,
  sumMoney,
  toDecimal,
  type MoneyInput,
} from '@/utils/money';

export type ForecastMethod = 'linear' | 'cagr' | 'last-3' | 'flat';
export type SeasonalityPreset = 'standard' | 'q4_spike' | 'summer_peak' | 'flat';

/**
 * Seasonality presets. These are ASSUMPTIONS the user picks, not measurements;
 * each set averages 1.0 so a preset re-shapes a forecast without inflating it.
 */
export const SEASONALITY_WEIGHTS: Record<SeasonalityPreset, readonly number[]> = {
  standard: [0.92, 0.88, 0.96, 0.98, 1.02, 1.04, 1.06, 1.04, 1.02, 1.04, 0.98, 1.06],
  q4_spike: [0.8, 0.82, 0.88, 0.9, 0.95, 0.95, 0.95, 0.9, 0.95, 1.1, 1.35, 1.45],
  summer_peak: [0.85, 0.85, 0.9, 1.0, 1.1, 1.25, 1.3, 1.25, 1.1, 0.95, 0.85, 0.6],
  flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

export interface ForecastGLEntry {
  readonly accountCode?: string | null;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
  readonly period?: string | null;
  readonly date?: string | null;
}

export interface MonthlyActual {
  readonly month: string;
  readonly value: number;
}

export interface BacktestAccuracy {
  /** Mean absolute percentage error. */
  readonly mapePercent: number | null;
  /** Root mean square error, in currency. */
  readonly rmse: number | null;
  /** Mean signed error over mean actual, percent. Negative = under-forecast. */
  readonly biasPercent: number | null;
  /** Coefficient of determination against the actual series. */
  readonly rSquared: number | null;
  /** Standard deviation of residuals, in currency. */
  readonly residualStdDev: number | null;
  readonly sampleCount: number;
}

export interface ConfidenceBand {
  readonly low: number[];
  readonly high: number[];
  /** Multiplier applied to the residual standard deviation. */
  readonly z: number;
}

const ZERO = new Decimal(0);
const CURRENCY_PLACES = 2;
const PERCENT_PLACES = 2;

/** Months of history the backtest needs before it will score anything. */
export const MIN_HISTORY_FOR_BACKTEST = 4;
/** ~95% two-sided normal quantile. */
export const BAND_Z = 1.96;

const REVENUE_PREFIX = '4';

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function hasDebitCredit(entry: ForecastGLEntry): boolean {
  const { debit, credit } = entry;
  if (debit == null && credit == null) return false;
  const debitN = debit == null ? 0 : Number(debit);
  const creditN = credit == null ? 0 : Number(credit);
  if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
    return false;
  }
  return true;
}

function creditNormal(entry: ForecastGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

/** Posted revenue by period, oldest first. */
export function deriveMonthlyRevenue(entries: readonly ForecastGLEntry[]): MonthlyActual[] {
  const map = new Map<string, Decimal>();
  for (const entry of entries) {
    if (!(entry.accountCode ?? '').startsWith(REVENUE_PREFIX)) continue;
    const month = entry.period || entry.date?.slice(0, 7);
    if (!month) continue;
    map.set(month, (map.get(month) ?? ZERO).plus(creditNormal(entry)));
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value: value.toDecimalPlaces(CURRENCY_PLACES).toNumber() }));
}

/**
 * Forecast series for a method and seasonality preset.
 *
 * - linear: least-squares trend on historical indices
 * - cagr: compound growth from first to last historical value
 * - last-3: trailing three-period average, flat
 * - flat: last value run-rate
 */
export function computeForecastSeries(
  historical: readonly number[],
  method: ForecastMethod,
  seasonality: SeasonalityPreset,
  periods = 6
): number[] {
  if (historical.length === 0 || periods <= 0) return [];
  const weights = SEASONALITY_WEIGHTS[seasonality] ?? SEASONALITY_WEIGHTS.flat;
  let base: number[] = [];

  if (method === 'linear') {
    const n = historical.length;
    const xMean = (n - 1) / 2;
    const yMean = roundTo(divideMoney(sumMoney(historical), n));
    let ssXY = 0;
    let ssXX = 0;
    for (let i = 0; i < n; i++) {
      ssXY += (i - xMean) * (historical[i]! - yMean);
      ssXX += (i - xMean) ** 2;
    }
    const slope = ssXX === 0 ? 0 : ssXY / ssXX;
    const intercept = yMean - slope * xMean;
    for (let h = 0; h < periods; h++) {
      base.push(roundTo(intercept + slope * (n + h)));
    }
  } else if (method === 'cagr') {
    const first = historical[0]!;
    const last = historical.at(-1)!;
    const n = historical.length;
    let growth = 0;
    if (first !== 0 && n > 1) {
      const ratio = divideMoney(last, first).toNumber();
      growth = Math.pow(ratio, 1 / (n - 1)) - 1;
    }
    for (let h = 0; h < periods; h++) {
      base.push(roundTo(multiplyMoney(last, Math.pow(1 + growth, h + 1)).toNumber()));
    }
  } else if (method === 'last-3') {
    const last3 = historical.slice(-3);
    const avg = roundTo(divideMoney(sumMoney(last3), last3.length));
    base = Array.from({ length: periods }, () => avg);
  } else {
    base = Array.from({ length: periods }, () => roundTo(historical.at(-1)!));
  }

  const startIdx = historical.length % 12;
  const result: number[] = [];
  for (let i = 0; i < periods; i++) {
    const w = weights[(startIdx + i) % 12]!;
    result.push(roundTo(multiplyMoney(base[i]!, w)));
  }
  return result;
}

/**
 * Walk-forward backtest of a method against the user's own history.
 *
 * For each month k from `MIN_HISTORY_FOR_BACKTEST − 1` onwards the method is
 * fitted on months before k and asked for one period; the prediction is
 * compared with what was actually posted. This measures the METHOD on this
 * data — it is not the accuracy of forecasts previously shown to a user,
 * because the app does not store those.
 */
export function backtestForecastMethod(
  historical: readonly number[],
  method: ForecastMethod,
  seasonality: SeasonalityPreset
): BacktestAccuracy {
  const residuals: Decimal[] = [];
  const actuals: Decimal[] = [];
  const absPctErrors: Decimal[] = [];

  for (let k = MIN_HISTORY_FOR_BACKTEST - 1; k < historical.length; k += 1) {
    const train = historical.slice(0, k);
    const predicted = computeForecastSeries(train, method, seasonality, 1)[0];
    if (predicted === undefined) continue;
    const actual = toDecimal(historical[k]!);
    const residual = actual.minus(predicted);
    residuals.push(residual);
    actuals.push(actual);
    if (!actual.isZero()) {
      absPctErrors.push(divideMoney(residual.abs(), actual.abs()).times(100));
    }
  }

  if (residuals.length === 0) {
    return {
      mapePercent: null,
      rmse: null,
      biasPercent: null,
      rSquared: null,
      residualStdDev: null,
      sampleCount: 0,
    };
  }

  const n = residuals.length;
  const meanActual = divideMoney(sumMoney(actuals), n);
  const sse = sumMoney(residuals.map((r) => r.times(r)));
  const sst = sumMoney(actuals.map((a) => a.minus(meanActual).times(a.minus(meanActual))));
  const meanResidual = divideMoney(sumMoney(residuals), n);
  const variance = divideMoney(
    sumMoney(residuals.map((r) => r.minus(meanResidual).times(r.minus(meanResidual)))),
    n
  );

  return {
    mapePercent:
      absPctErrors.length === 0
        ? null
        : divideMoney(sumMoney(absPctErrors), absPctErrors.length)
            .toDecimalPlaces(PERCENT_PLACES)
            .toNumber(),
    rmse: new Decimal(Math.sqrt(divideMoney(sse, n).toNumber()))
      .toDecimalPlaces(CURRENCY_PLACES)
      .toNumber(),
    biasPercent: meanActual.isZero()
      ? null
      : divideMoney(meanResidual, meanActual.abs())
          .times(100)
          .toDecimalPlaces(PERCENT_PLACES)
          .toNumber(),
    rSquared: sst.isZero()
      ? null
      : new Decimal(1).minus(divideMoney(sse, sst)).toDecimalPlaces(4).toNumber(),
    residualStdDev: new Decimal(Math.sqrt(variance.toNumber()))
      .toDecimalPlaces(CURRENCY_PLACES)
      .toNumber(),
    sampleCount: n,
  };
}

/**
 * Prediction band from measured residual dispersion.
 *
 * Returns `null` when the backtest produced no residual standard deviation —
 * an unmeasured band is not published.
 */
export function confidenceBandsFromResiduals(
  forecast: readonly number[],
  residualStdDev: number | null,
  z = BAND_Z
): ConfidenceBand | null {
  if (residualStdDev === null || !Number.isFinite(residualStdDev) || residualStdDev <= 0) {
    return null;
  }
  const halfWidth = multiplyMoney(residualStdDev, z);
  return {
    low: forecast.map((v) => roundTo(toDecimal(v).minus(halfWidth))),
    high: forecast.map((v) => roundTo(toDecimal(v).plus(halfWidth))),
    z,
  };
}
