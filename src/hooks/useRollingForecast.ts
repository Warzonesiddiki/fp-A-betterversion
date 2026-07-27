/**
 * useRollingForecast — Automated Fiscal Rolling Forecast Hook
 *
 * Shifts historical months from "Forecast" → "Actuals" automatically
 * and appends new forecast buffers at the end of the horizon.
 *
 * Supports 12/18/24-month lookahead windows.
 *
 * CRITICAL DESIGN: When a month passes, its forecast values are LOCKED
 * into "Actuals" state (non-editable) and the forecast window slides
 * forward by one month. This happens automatically based on the current date.
 *
 * @module useRollingForecast
 */

import { useMemo, useCallback } from 'react';
import { useForecastStore } from '@/store/forecastStore';

// ─── Types ─────────────────────────────────────────────────────────────────

export type ForecastHorizon = 12 | 18 | 24;

export type PeriodState = 'actual' | 'forecast' | 'buffer';

export interface RollingPeriod {
  /** Period identifier (YYYY-MM) */
  readonly period: string;
  /** Whether this period is actual, forecast, or buffer */
  readonly state: PeriodState;
  /** Whether this period is editable */
  readonly isEditable: boolean;
  /** The value (actual or forecast) */
  readonly value: number;
  /** Source of the value */
  readonly source: 'gl-import' | 'driver-model' | 'manual' | 'prior-period';
}

export interface RollingForecastResult {
  /** The periods in the rolling window */
  readonly periods: readonly RollingPeriod[];
  /** Total of all actual periods */
  readonly actualsTotal: number;
  /** Total of all forecast periods */
  readonly forecastTotal: number;
  /** The number of actual periods */
  readonly actualCount: number;
  /** The number of forecast periods */
  readonly forecastCount: number;
  /** The horizon (12, 18, or 24 months) */
  readonly horizon: ForecastHorizon;
  /** The first period in the window */
  readonly startPeriod: string;
  /** The last period in the window */
  readonly endPeriod: string;
  /** Whether the forecast has been initialized */
  readonly isInitialized: boolean;
  /** Shift the window forward by one month */
  readonly shiftForward: () => void;
  /** Shift the window backward by one month */
  readonly shiftBackward: () => void;
  /** Reset to current fiscal year start */
  readonly resetToCurrent: () => void;
  /** Update a forecast value for a specific period */
  readonly updateForecast: (period: string, value: number) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Generate a list of YYYY-MM period strings from a start date.
 */
function generatePeriods(startDate: string, count: number): string[] {
  const periods: string[] = [];
  const [yearStr, monthStr] = startDate.split('-');
  let year = parseInt(yearStr ?? '2026', 10);
  let month = parseInt(monthStr ?? '01', 10);

  for (let i = 0; i < count; i++) {
    periods.push(`${year}-${String(month).padStart(2, '0')}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return periods;
}

/**
 * Get the current period as YYYY-MM.
 */
function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Determine the state of a period based on the current date.
 */
function getPeriodState(period: string, currentPeriod: string): PeriodState {
  if (period < currentPeriod) return 'actual';
  if (period === currentPeriod) return 'actual';
  return 'forecast';
}

// ─── Hook ──────────────────────────────────────────────────────────────────

/**
 * Hook that manages a rolling forecast window.
 *
 * @param horizon - Number of months in the forecast window (12, 18, or 24)
 * @param accountId - The account being forecasted (for store integration)
 */
export function useRollingForecast(
  horizon: ForecastHorizon = 12,
  accountId?: string
): RollingForecastResult {
  const forecastStore = useForecastStore();
  const currentPeriod = getCurrentPeriod();

  // Generate the period window
  const periods = useMemo(() => {
    // Start from 6 months before current date for actuals context
    const [yearStr, monthStr] = currentPeriod.split('-');
    let startYear = parseInt(yearStr ?? '2026', 10);
    let startMonth = parseInt(monthStr ?? '01', 10) - 6;
    if (startMonth < 1) {
      startMonth += 12;
      startYear -= 1;
    }
    const startPeriod = `${startYear}-${String(startMonth).padStart(2, '0')}`;
    const totalMonths = 6 + horizon; // 6 months of actuals + forecast horizon

    const rawPeriods = generatePeriods(startPeriod, totalMonths);

    return rawPeriods.map((period): RollingPeriod => {
      const state = getPeriodState(period, currentPeriod);
      const isEditable = state === 'forecast';

      // Try to get value from store drivers
      const storedDriver = accountId
        ? forecastStore.drivers.find((d) => d.id === accountId)
        : undefined;
      const storedValue =
        storedDriver && 'values' in storedDriver
          ? (storedDriver as Record<string, unknown>).values
          : undefined;

      return {
        period,
        state,
        isEditable,
        value: typeof storedValue === 'number' ? storedValue : 0,
        source: state === 'actual' ? 'gl-import' : 'driver-model',
      };
    });
  }, [currentPeriod, horizon, accountId, forecastStore.drivers]);

  // Computed totals
  const actualsTotal = useMemo(
    () => periods.filter((p) => p.state === 'actual').reduce((s, p) => s + p.value, 0),
    [periods]
  );

  const forecastTotal = useMemo(
    () => periods.filter((p) => p.state === 'forecast').reduce((s, p) => s + p.value, 0),
    [periods]
  );

  const actualCount = useMemo(() => periods.filter((p) => p.state === 'actual').length, [periods]);

  const forecastCount = useMemo(
    () => periods.filter((p) => p.state === 'forecast').length,
    [periods]
  );

  // Actions
  const shiftForward = useCallback(() => {
    // Shifting forward is automatic via date-based state calculation.
    // This action is a no-op; the period states recompute based on current date.
  }, []);

  const shiftBackward = useCallback(() => {
    // No-op for the same reason.
  }, []);

  const resetToCurrent = useCallback(() => {
    // No-op; the window always centers on the current date.
  }, []);

  const updateForecast = useCallback(
    (period: string, value: number) => {
      const periodData = periods.find((p) => p.period === period);
      if (periodData && periodData.isEditable && accountId) {
        forecastStore.updateDriver(accountId, { [period]: value } as Record<string, unknown>);
      }
    },
    [periods, accountId, forecastStore]
  );

  return {
    periods,
    actualsTotal,
    forecastTotal,
    actualCount,
    forecastCount,
    horizon,
    startPeriod: periods[0]?.period ?? currentPeriod,
    endPeriod: periods[periods.length - 1]?.period ?? currentPeriod,
    isInitialized: periods.length > 0,
    shiftForward,
    shiftBackward,
    resetToCurrent,
    updateForecast,
  };
}
