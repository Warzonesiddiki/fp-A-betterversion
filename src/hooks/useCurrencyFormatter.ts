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
import { isMoneyValue, toDecimal, type MoneyInput } from '@/utils/money';
import {
  currencyFormatter,
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
  type CurrencyFormatOptions,
} from '@/utils/financialFormatting';

/**
 * The value a display formatter can render: a plain number, a decimal string,
 * or a `Money` (Q5 stage 3). A `Money` is converted from integer minor units
 * exactly, so a derived row needs no adapter of its own — this IS the single
 * display adapter stage 6 of the migration plan calls for.
 */
export type DisplayableMoney = MoneyInput | null | undefined;

/**
 * An absent value stays absent (`—`); nothing is coerced to zero.
 *
 * DISPLAY MUST NOT THROW. A formatter runs inside render, so an exception here
 * is a blank screen — and a `NaN` reaching a grid is a data defect the grid is
 * not the place to report. Non-finite and unparseable values therefore render
 * as an em dash; the strict gate stays in `@/utils/money`, where money is
 * computed and where refusing is the correct behaviour.
 */
function toDisplayNumber(value: DisplayableMoney): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  if (isMoneyValue(value)) return toDecimal(value).toNumber();
  try {
    return toDecimal(value).toNumber();
  } catch {
    return null;
  }
}

/** Reporting currency from global financial context (ISO 4217). */
export function useReportingCurrency(): string {
  return useFinancialContextStore((state) => state.context.currency.code);
}

export interface CurrencyFormatter {
  /** Full precision, e.g. `$1,234.56`; negatives in parentheses. */
  currency: (value: DisplayableMoney) => string;
  /** Whole units, e.g. `$1,235` — the default for KPI tiles and grids. */
  currency0: (value: DisplayableMoney) => string;
  /** Abbreviated, e.g. `$1.2M`. */
  compact: (value: DisplayableMoney) => string;
  /** Percent with a fixed number of decimals. */
  percent: (value: DisplayableMoney, decimals?: number) => string;
  /** Plain number, no currency symbol. */
  number: (value: DisplayableMoney, decimals?: number) => string;
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
  custom: (options?: CurrencyFormatOptions) => (value: DisplayableMoney) => string;
}

/**
 * Money formatters bound to the active reporting currency. Re-renders the
 * calling component when the user changes the currency in the context bar.
 */
export function useCurrencyFormatter(): CurrencyFormatter {
  const currencyCode = useReportingCurrency();

  const currency = useCallback(
    (value: DisplayableMoney) => formatCurrency(toDisplayNumber(value), { currency: currencyCode }),
    [currencyCode]
  );

  const currency0 = useCallback(
    (value: DisplayableMoney) => {
      const amount = toDisplayNumber(value);
      if (amount === null || amount === 0) return '—';
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.abs(amount));
      return amount < 0 ? `(${formatted})` : formatted;
    },
    [currencyCode]
  );

  const compact = useCallback(
    (value: DisplayableMoney) => formatCompact(toDisplayNumber(value), currencyCode),
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
    formatters: Map<string, (value: DisplayableMoney) => string>;
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
      const wrapped = (value: DisplayableMoney) => formatter(toDisplayNumber(value));
      cacheRef.current.formatters.set(key, wrapped);
      return wrapped;
    },
    [currencyCode]
  );

  return useMemo(
    () => ({
      currency,
      currency0,
      compact,
      percent: (value: DisplayableMoney, decimals = 1) =>
        formatPercent(toDisplayNumber(value), decimals),
      number: (value: DisplayableMoney, decimals = 0) =>
        formatNumber(toDisplayNumber(value), decimals),
      currencyCode,
      custom,
    }),
    [currency, currency0, compact, currencyCode, custom]
  );
}
