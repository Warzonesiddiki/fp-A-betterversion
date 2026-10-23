import { reportingCurrency } from '@/store/financialContextStore';

const LOCALE = 'en-US';

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();
const currencyDetailFormatterCache = new Map<string, Intl.NumberFormat>();

function cachedCurrencyFormatter(
  cache: Map<string, Intl.NumberFormat>,
  currency: string,
  minimumFractionDigits: number,
  maximumFractionDigits: number
): Intl.NumberFormat {
  let formatter = cache.get(currency);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
      });
    } catch {
      formatter = new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits,
        maximumFractionDigits,
      });
    }
    cache.set(currency, formatter);
  }
  return formatter;
}

const compactFormatter = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});
const percentFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const numberFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return cachedCurrencyFormatter(currencyFormatterCache, reportingCurrency(), 0, 0).format(value);
}

export function formatCurrencyDetailed(value: number): string {
  return cachedCurrencyFormatter(currencyDetailFormatterCache, reportingCurrency(), 2, 2).format(
    value
  );
}

export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value);
}

/**
 * Formats a value already expressed in percent-points (15.5 → "15.5%").
 *
 * The `/100` here cancels the `×100` that `Intl` percent style applies, so the
 * input convention is percent-points — NOT the repo-stored decimal convention
 * (0.155 = 15.5%); callers holding decimals must `× 100` first. Sign is
 * dropped (`Math.abs`). Mirrors {@link ../financialFormatting.formatPercent},
 * which shares the same input convention.
 */
export function formatPercent(value: number): string {
  return percentFormatter.format(Math.abs(value) / 100);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatVariance(value: number): { formatted: string; isPositive: boolean } {
  const isPositive = value >= 0;
  return { formatted: formatCurrency(Math.abs(value)), isPositive };
}
