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

import { useCallback, useMemo } from 'react';

import { useFinancialContextStore } from '@/store/financialContextStore';
import {
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
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

  return useMemo(
    () => ({
      currency,
      currency0,
      compact,
      percent: (value: number | null | undefined, decimals = 1) => formatPercent(value, decimals),
      number: (value: number | null | undefined, decimals = 0) => formatNumber(value, decimals),
      currencyCode,
    }),
    [currency, currency0, compact, currencyCode]
  );
}
