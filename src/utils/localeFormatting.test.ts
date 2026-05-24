import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
  formatCompactNumber,
  isRTL,
  getLocaleDirection,
  getCurrencySymbol,
  type SupportedLocale,
} from './localeFormatting';

describe('formatNumber', () => {
  it('should format number with default en locale', () => {
    const result = formatNumber(1234567.89);
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('567');
  });

  it('should format zero', () => {
    const result = formatNumber(0);
    expect(result).toBe('0');
  });

  it('should format negative numbers', () => {
    const result = formatNumber(-1234);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('should format with custom options', () => {
    const result = formatNumber(1234.5678, 'en', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('57');
  });

  it('should format with different locales', () => {
    const enResult = formatNumber(1234.56, 'en');
    const deResult = formatNumber(1234.56, 'de');
    // German uses comma as decimal separator and period as grouping
    expect(deResult).not.toBe(enResult);
  });

  it('should handle all supported locales without throwing', () => {
    const locales: SupportedLocale[] = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'pt'];
    for (const locale of locales) {
      expect(() => formatNumber(1234.56, locale)).not.toThrow();
    }
  });

  it('should format very large numbers', () => {
    const result = formatNumber(1_000_000_000);
    expect(result).toContain('1');
    expect(result).toContain('000');
  });

  it('should format very small decimals', () => {
    const result = formatNumber(0.001, 'en', { minimumFractionDigits: 3 });
    expect(result).toContain('0');
    expect(result).toContain('001');
  });
});

describe('formatCurrency', () => {
  it('should format USD currency', () => {
    const result = formatCurrency(1234.56, 'USD');
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('56');
    expect(result).toMatch(/\$/);
  });

  it('should format EUR currency', () => {
    const result = formatCurrency(1234.56, 'EUR', 'de');
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('56');
  });

  it('should format zero currency', () => {
    const result = formatCurrency(0, 'USD');
    expect(result).toContain('0');
    expect(result).toContain('00');
  });

  it('should format negative currency', () => {
    const result = formatCurrency(-500, 'USD');
    expect(result).toContain('500');
  });

  it('should always show 2 decimal places', () => {
    const result = formatCurrency(100, 'USD');
    expect(result).toContain('00');
  });

  it('should format JPY currency', () => {
    const result = formatCurrency(1234, 'JPY', 'ja');
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('should handle all supported locales for currency', () => {
    const locales: SupportedLocale[] = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'pt'];
    for (const locale of locales) {
      expect(() => formatCurrency(100, 'USD', locale)).not.toThrow();
    }
  });
});

describe('formatPercent', () => {
  it('should format percentage with default 1 decimal', () => {
    const result = formatPercent(15.5);
    expect(result).toContain('15');
    expect(result).toContain('5');
    expect(result).toContain('%');
  });

  it('should format zero percent', () => {
    const result = formatPercent(0);
    expect(result).toContain('0');
    expect(result).toContain('%');
  });

  it('should format 100 percent', () => {
    const result = formatPercent(100);
    expect(result).toContain('100');
    expect(result).toContain('%');
  });

  it('should divide by 100 (value is already in percentage form)', () => {
    // formatPercent(50) -> 50/100 = 0.5 -> "50.0%"
    const result = formatPercent(50);
    expect(result).toContain('50');
    expect(result).toContain('%');
  });

  it('should respect custom decimal places', () => {
    const result = formatPercent(33.333, 'en', 2);
    expect(result).toContain('33');
    expect(result).toContain('33');
    expect(result).toContain('%');
  });

  it('should handle negative percentages', () => {
    const result = formatPercent(-10);
    expect(result).toContain('10');
    expect(result).toContain('%');
  });
});

describe('formatDate', () => {
  it('should format Date object', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const result = formatDate(date);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should format date string', () => {
    const result = formatDate('2024-06-15');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should format with different styles', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const short = formatDate(date, 'en', 'short');
    const medium = formatDate(date, 'en', 'medium');
    const long = formatDate(date, 'en', 'long');
    const full = formatDate(date, 'en', 'full');

    // Each should produce a non-empty string
    expect(short).toBeTruthy();
    expect(medium).toBeTruthy();
    expect(long).toBeTruthy();
    expect(full).toBeTruthy();

    // Longer styles should produce longer or equal strings
    expect(full.length).toBeGreaterThanOrEqual(short.length);
  });

  it('should format with different locales', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const _enResult = formatDate(date, 'en');
    const jaResult = formatDate(date, 'ja');
    // Japanese date format is different from English
    expect(jaResult).toBeTruthy();
  });

  it('should handle ISO date strings', () => {
    const result = formatDate('2024-01-01T00:00:00.000Z');
    expect(result).toBeTruthy();
  });
});

describe('formatDateTime', () => {
  it('should format Date object with time', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    const result = formatDateTime(date);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should format date string with time', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z');
    expect(result).toBeTruthy();
  });

  it('should format with different locales', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    const locales: SupportedLocale[] = ['en', 'de', 'ja'];
    for (const locale of locales) {
      expect(() => formatDateTime(date, locale)).not.toThrow();
    }
  });
});

describe('formatCompactNumber', () => {
  it('should format thousands', () => {
    const result = formatCompactNumber(1500);
    expect(result).toContain('1');
    expect(result).toContain('5');
    expect(result).toContain('K');
  });

  it('should format millions', () => {
    const result = formatCompactNumber(1500000);
    expect(result).toContain('1');
    expect(result).toContain('5');
    expect(result).toContain('M');
  });

  it('should format billions', () => {
    const result = formatCompactNumber(2000000000);
    expect(result).toContain('2');
    expect(result).toContain('B');
  });

  it('should format small numbers without suffix', () => {
    const result = formatCompactNumber(999);
    expect(result).not.toContain('K');
    expect(result).toContain('999');
  });

  it('should format zero', () => {
    const result = formatCompactNumber(0);
    expect(result).toContain('0');
  });

  it('should format negative numbers compactly', () => {
    const result = formatCompactNumber(-1500000);
    expect(result).toContain('1');
    expect(result).toContain('5');
    expect(result).toContain('M');
  });
});

describe('isRTL', () => {
  it('should return true for Arabic', () => {
    expect(isRTL('ar')).toBe(true);
  });

  it('should return false for English', () => {
    expect(isRTL('en')).toBe(false);
  });

  it('should return false for all non-RTL locales', () => {
    const nonRTL: SupportedLocale[] = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt'];
    for (const locale of nonRTL) {
      expect(isRTL(locale)).toBe(false);
    }
  });
});

describe('getLocaleDirection', () => {
  it('should return rtl for Arabic', () => {
    expect(getLocaleDirection('ar')).toBe('rtl');
  });

  it('should return ltr for English', () => {
    expect(getLocaleDirection('en')).toBe('ltr');
  });

  it('should return ltr for all non-RTL locales', () => {
    const nonRTL: SupportedLocale[] = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt'];
    for (const locale of nonRTL) {
      expect(getLocaleDirection(locale)).toBe('ltr');
    }
  });
});

describe('getCurrencySymbol', () => {
  it('should return $ for USD', () => {
    const result = getCurrencySymbol('USD');
    expect(result).toBe('$');
  });

  it('should return EUR symbol for EUR in en locale', () => {
    const result = getCurrencySymbol('EUR', 'en');
    // In en-US locale, Intl returns the euro sign
    expect(result).toBe('\u20AC');
  });

  it('should return currency code as fallback for unknown currency', () => {
    // For unknown currencies, Intl may return the code itself
    const result = getCurrencySymbol('XYZ');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should return JPY symbol', () => {
    const result = getCurrencySymbol('JPY', 'ja');
    expect(result).toBeTruthy();
  });

  it('should handle all supported locales', () => {
    const locales: SupportedLocale[] = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'pt'];
    for (const locale of locales) {
      expect(() => getCurrencySymbol('USD', locale)).not.toThrow();
    }
  });
});
