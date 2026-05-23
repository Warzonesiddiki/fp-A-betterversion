import { useCallback, useMemo } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

interface CurrencyFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSign?: boolean;
}

export function useCurrency() {
  const preferences = useSettingsStore((s) => s.preferences);
  const currency = preferences.currency ?? 'USD';
  const locale = preferences.locale ?? 'en-US';

  const format = useCallback(
    (amount: number, options?: CurrencyFormatOptions): string => {
      const {
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
        showSign = false,
      } = options ?? {};

      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount);

      if (showSign && amount > 0) {
        return `+${formatted}`;
      }

      return formatted;
    },
    [currency, locale]
  );

  const formatPercent = useCallback(
    (value: number, decimals = 1): string => {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    },
    [locale]
  );

  const formatCompact = useCallback(
    (amount: number): string => {
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
      }).format(amount);
    },
    [locale]
  );

  const formatter = useMemo(
    () => ({ format, formatPercent, formatCompact }),
    [format, formatPercent, formatCompact]
  );

  return formatter;
}
