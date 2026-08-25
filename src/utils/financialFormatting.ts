/**
 * Financial Number Formatting Engine
 * Used across ALL grids, charts, KPI cards, reports
 */

import { formatMoney, subtractMoney, divideMoney } from './money';

interface FormatConfig {
  locale: string;
  currency: string;
  negativeStyle: 'parentheses' | 'minus' | 'color';
  zeroDisplay: string;
  nullDisplay: string;
}

const defaultConfig: FormatConfig = {
  locale: 'en-US',
  currency: 'USD',
  negativeStyle: 'parentheses',
  zeroDisplay: '—',
  nullDisplay: '—',
};

export function formatCurrency(
  value: number | null | undefined,
  config: Partial<FormatConfig> = {}
): string {
  const cfg = { ...defaultConfig, ...config };
  if (value == null) return cfg.nullDisplay;
  if (value === 0) return cfg.zeroDisplay;

  const isNegative = value < 0;
  const absValue = Math.abs(value);

  const formatted = new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cfg.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue);

  if (isNegative) {
    switch (cfg.negativeStyle) {
      case 'parentheses':
        return `(${formatted})`;
      case 'minus':
        return `-${formatted}`;
      case 'color':
        return formatted;
    }
  }
  return formatted;
}

/**
 * Options for {@link currencyFormatter}. This is deliberately a thin subset of
 * `Intl.NumberFormatOptions`: the UI-06 follow-up replaced ~81 hand-rolled
 * `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', … })`
 * call sites, and those sites used exactly these knobs.
 */
export interface CurrencyFormatOptions {
  /**
   * Fixed number of fraction digits (sets both min and max).
   * Omit to keep the currency's own default — important for zero-decimal
   * currencies such as JPY, where forcing 2 digits renders `¥1,234.50`
   * instead of the correct `¥1,235`.
   */
  decimals?: number;
  /** Lower bound on fraction digits, when min and max differ. */
  minDecimals?: number;
  /** Upper bound on fraction digits, when min and max differ. */
  maxDecimals?: number;
  /** Abbreviate to `$1.2M` / `$1.2K`. */
  compact?: boolean;
  /** Force a leading `+` on positives (`'always'`) or on non-zero (`'exceptZero'`). */
  signDisplay?: 'auto' | 'always' | 'exceptZero' | 'never';
  locale?: string;
}

/**
 * A currency formatter bound to a currency code, preserving native `Intl`
 * semantics.
 *
 * This is the module-scope counterpart to `useCurrencyFormatter()`. Prefer the
 * hook inside React components so the output re-renders when the reporting
 * currency changes; use this factory in engines, column definitions and other
 * non-React code.
 *
 * Unlike {@link formatCurrency}, this does NOT substitute `'—'` for null/zero
 * and does NOT wrap negatives in parentheses — it is a faithful `Intl` wrapper.
 * That distinction is deliberate: it lets the ~81 migrated call sites change
 * currency without also changing how they render zeroes and negatives, which
 * would silently alter hundreds of on-screen figures and stored snapshots.
 *
 * DISPLAY ONLY — formatting in a currency never converts the amount.
 */
export function currencyFormatter(
  currency: string,
  options: CurrencyFormatOptions = {}
): (value: number | null | undefined) => string {
  const { decimals, minDecimals, maxDecimals, compact, signDisplay, locale = 'en-US' } = options;

  const intlOptions: Intl.NumberFormatOptions = { style: 'currency', currency };
  if (decimals != null) {
    intlOptions.minimumFractionDigits = decimals;
    intlOptions.maximumFractionDigits = decimals;
  }
  if (minDecimals != null) intlOptions.minimumFractionDigits = minDecimals;
  if (maxDecimals != null) intlOptions.maximumFractionDigits = maxDecimals;
  if (compact) intlOptions.notation = 'compact';
  if (signDisplay) intlOptions.signDisplay = signDisplay;

  // Built once per formatter: Intl.NumberFormat construction is the expensive
  // part, and these formatters live in render paths and grid cell renderers.
  const formatter = new Intl.NumberFormat(locale, intlOptions);
  return (value: number | null | undefined) => (value == null ? '—' : formatter.format(value));
}

/**
 * Currency symbol for a code ('USD' → '$', 'EUR' → '€'). Falls back to the
 * code itself when the runtime has no symbol, so output is never empty.
 */
export function currencySymbol(currency: string, locale = 'en-US'): string {
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(0);
  return parts.find((part) => part.type === 'currency')?.value ?? currency;
}

export function formatCompact(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || value === 0) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const symbol = currencySymbol(currency);
  if (abs >= 1_000_000_000)
    return `${sign}${symbol}${formatMoney(abs / 1_000_000_000, { places: 1 })}B`;
  if (abs >= 1_000_000) return `${sign}${symbol}${formatMoney(abs / 1_000_000, { places: 1 })}M`;
  if (abs >= 1_000) return `${sign}${symbol}${formatMoney(abs / 1_000, { places: 0 })}K`;
  return formatCurrency(value, { currency });
}

/**
 * Formats a value already expressed in percent-points (15.5 → "15.5%").
 *
 * Input convention is percent-points — NOT the repo-stored decimal
 * convention (0.155 = 15.5%); callers holding decimals must `× 100` first.
 * Shares this convention with `formatPercent` in `./formatters` (which also
 * drops the sign) and `localeFormatting.formatPercent`.
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—';
  return `${formatMoney(value, { places: decimals })}%`;
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatVariance(
  actual: number,
  budget: number
): { text: string; className: string; percentage: string } {
  const diff = subtractMoney(actual, budget).toNumber();
  const pct = budget !== 0 ? divideMoney(diff, Math.abs(budget)).toNumber() * 100 : 0;
  const text = formatCurrency(diff, { negativeStyle: 'minus' });
  const percentage = `(${pct >= 0 ? '+' : ''}${formatMoney(pct, { places: 1 })}%)`;
  let className = 'fin-neutral';
  if (Math.abs(pct) > 0.01) {
    className = pct > 0 ? 'fin-positive font-medium' : 'fin-negative font-medium';
  }
  return { text, className, percentage };
}

export function parseFinancialInput(input: string): number | null {
  if (!input || input.trim() === '' || input.trim() === '—') return null;
  let cleaned = input.trim();
  const isParens = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isParens) cleaned = cleaned.slice(1, -1);
  cleaned = cleaned.replace(/[$€£¥,]/g, '');
  const compactMatch = cleaned.match(/^([\d.]+)\s*([KMB])$/i);
  if (compactMatch) {
    const num = parseFloat(compactMatch[1]!);
    const multiplier: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
    return (isParens ? -1 : 1) * num * multiplier![compactMatch[2]!.toUpperCase()]!;
  }
  const pctMatch = cleaned.match(/^([\d.]+)%$/);
  if (pctMatch) return (isParens ? -1 : 1) * parseFloat(pctMatch[1]!);
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return isParens ? -num : num;
}

export function useFinancialFormatter() {
  return {
    currency: (v: number | null) => formatCurrency(v),
    compact: (v: number | null) => formatCompact(v),
    percent: (v: number | null) => formatPercent(v),
    number: (v: number | null) => formatNumber(v),
    variance: (actual: number, budget: number) => formatVariance(actual, budget),
    parse: parseFinancialInput,
  };
}
