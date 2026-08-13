/**
 * UI-06 — the single display-formatting entry point for money in the UI.
 *
 * WHY THIS EXISTS
 * ---------------
 * The app has a reporting-currency selector in the global context bar
 * (`FinancialContextBar`, Scope → Time → Version → Currency → Freshness), but
 * before UI-06 nothing outside that bar ever read it: 75 modules defined their
 * own `formatCurrency` with `currency: 'USD'` baked in. Selecting GBP changed
 * the dropdown and nothing else — every figure on screen stayed in dollars.
 * For a multi-entity, multi-currency product that is a correctness bug, not a
 * styling nit, so display formatting is centralised here and reads the store.
 *
 * DISPLAY ONLY. This module never performs financial arithmetic; `@/utils/money`
 * (decimal.js) remains the canonical engine for money math. Formatting a value
 * in a presentation currency does NOT convert it — conversion is `FXEngine`'s
 * job. Callers must pass amounts already expressed in the reporting currency.
 */

import { useCallback, useMemo, useRef } from 'react';

import { useFinancialContextStore } from '@/store/financialContextStore';
import {
  currencyFormatter,
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
  type CurrencyFormatOptions,
} from '@/utils/financialFormatting';

/** Reporting currency from global financial context (ISO 4217). */
export function useReportingCurrency(): string {
  return useFinancialContextStore((state) => state.context.currency.code);
}

export interface CurrencyFormatter {
  /** Full precision, e.g. `$1,234.56`; negatives in parentheses. */
  currency: (value: number | null | undefined) => string;
  /** Whole units, e.g. `$1,235` — the default for KPI tiles and grids. */
  currency0: (value: number | null | undefined) => string;
  /** Abbreviated, e.g. `$1.2M`. */
  compact: (value: number | null | undefined) => string;
  /** Percent with a fixed number of decimals. */
  percent: (value: number | null | undefined, decimals?: number) => string;
  /** Plain number, no currency symbol. */
  number: (value: number | null | undefined, decimals?: number) => string;
  /** The ISO 4217 code these formatters render in. */
  currencyCode: string;
  /**
   * A formatter for shapes the named members above do not cover — sign display,
   * asymmetric min/max digits, or compact with a specific precision.
   *
   * Unlike `currency`/`currency0`, this is a faithful `Intl` wrapper: it does
   * not render zero as `'—'` and does not put negatives in parentheses. Use it
   * when replacing a hand-rolled `new Intl.NumberFormat(...)` so the migration
   * changes the currency and nothing else.
   *
   * Stable across renders for a given set of options, so it is safe to call
   * during render or inside a grid cell renderer.
   */
  custom: (options?: CurrencyFormatOptions) => (value: number | null | undefined) => string;
}

/**
 * Money formatters bound to the active reporting currency. Re-renders the
 * calling component when the user changes the currency in the context bar.
 */
export function useCurrencyFormatter(): CurrencyFormatter {
  const currencyCode = useReportingCurrency();

  const currency = useCallback(
    (value: number | null | undefined) => formatCurrency(value, { currency: currencyCode }),
    [currencyCode]
  );

  const currency0 = useCallback(
    (value: number | null | undefined) => {
      if (value == null) return '—';
      if (value === 0) return '—';
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.abs(value));
      return value < 0 ? `(${formatted})` : formatted;
    },
    [currencyCode]
  );

  const compact = useCallback(
    (value: number | null | undefined) => formatCompact(value, currencyCode),
    [currencyCode]
  );

  // `Intl.NumberFormat` construction is the expensive part of formatting, and
  // `custom()` is called from render paths and grid cell renderers, so
  // formatters are memoised per option shape.
  //
  // The cache lives in a ref rather than a `useMemo` value: it is mutated on
  // access, and mutating a memoised object during render is unsafe under
  // concurrent rendering (react-hooks/immutability flags it). The ref stores
  // the currency it was built for and is discarded when that changes, so a
  // stale currency can never be served from cache.
  const cacheRef = useRef<{
    currency: string;
    formatters: Map<string, (value: number | null | undefined) => string>;
  }>({ currency: currencyCode, formatters: new Map() });

  const custom = useCallback(
    (options: CurrencyFormatOptions = {}) => {
      if (cacheRef.current.currency !== currencyCode) {
        cacheRef.current = { currency: currencyCode, formatters: new Map() };
      }
      const key = `${options.decimals ?? ''}|${options.minDecimals ?? ''}|${
        options.maxDecimals ?? ''
      }|${options.compact ? 'c' : ''}|${options.signDisplay ?? ''}|${options.locale ?? ''}`;
      const cached = cacheRef.current.formatters.get(key);
      if (cached) return cached;
      const formatter = currencyFormatter(currencyCode, options);
      cacheRef.current.formatters.set(key, formatter);
      return formatter;
    },
    [currencyCode]
  );

  return useMemo(
    () => ({
      currency,
      currency0,
      compact,
      percent: (value: number | null | undefined, decimals = 1) => formatPercent(value, decimals),
      number: (value: number | null | undefined, decimals = 0) => formatNumber(value, decimals),
      currencyCode,
      custom,
    }),
    [currency, currency0, compact, currencyCode, custom]
  );
}
