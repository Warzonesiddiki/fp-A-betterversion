export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ar' | 'pt';

const LOCALE_MAP: Record<SupportedLocale, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ar: 'ar-SA',
  pt: 'pt-BR',
};

export function formatNumber(
  value: number,
  locale: SupportedLocale = 'en',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(LOCALE_MAP[locale], options).format(value);
}

export function formatCurrency(
  value: number,
  currency: string,
  locale: SupportedLocale = 'en'
): string {
  return new Intl.NumberFormat(LOCALE_MAP[locale], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(
  value: number,
  locale: SupportedLocale = 'en',
  decimals: number = 1
): string {
  return new Intl.NumberFormat(LOCALE_MAP[locale], {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatDate(
  date: Date | string,
  locale: SupportedLocale = 'en',
  style: 'full' | 'long' | 'medium' | 'short' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE_MAP[locale], { dateStyle: style }).format(d);
}

export function formatDateTime(date: Date | string, locale: SupportedLocale = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE_MAP[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function formatCompactNumber(value: number, locale: SupportedLocale = 'en'): string {
  return new Intl.NumberFormat(LOCALE_MAP[locale], {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

export function isRTL(locale: SupportedLocale): boolean {
  return locale === 'ar';
}

export function getLocaleDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

export function getCurrencySymbol(currency: string, locale: SupportedLocale = 'en'): string {
  const parts = new Intl.NumberFormat(LOCALE_MAP[locale], {
    style: 'currency',
    currency,
  }).formatToParts(0);
  const symbolPart = parts.find((p) => p.type === 'currency');
  return symbolPart?.value ?? currency;
}
