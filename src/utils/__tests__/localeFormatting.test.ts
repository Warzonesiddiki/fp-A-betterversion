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
} from '../localeFormatting';

describe('localeFormatting', () => {
  describe('formatNumber', () => {
    it('formats with en locale', () => {
      const r = formatNumber(1234.5, 'en');
      expect(r).toBe('1,234.5');
    });
  });

  describe('formatCurrency', () => {
    it('formats with currency symbol', () => {
      const r = formatCurrency(100, 'USD', 'en');
      expect(r).toContain('100');
    });
  });

  describe('formatPercent', () => {
    it('formats percentage', () => {
      const r = formatPercent(15.5, 'en');
      expect(r).toContain('15.5');
    });
  });

  describe('formatDate', () => {
    it('formats date', () => {
      const r = formatDate('2026-01-15', 'en');
      expect(r).toContain('2026');
    });

    it('formats Date object', () => {
      const r = formatDate(new Date(2026, 0, 15), 'en');
      expect(r).toContain('2026');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time', () => {
      const r = formatDateTime('2026-01-15T10:30:00', 'en');
      expect(r).toContain('2026');
    });
  });

  describe('formatCompactNumber', () => {
    it('formats compact', () => {
      const r = formatCompactNumber(1500000, 'en');
      expect(r).toContain('1.5');
    });
  });

  describe('isRTL', () => {
    it('returns true for Arabic', () => expect(isRTL('ar')).toBe(true));
    it('returns false for English', () => expect(isRTL('en')).toBe(false));
  });

  describe('getLocaleDirection', () => {
    it('returns rtl for Arabic', () => expect(getLocaleDirection('ar')).toBe('rtl'));
    it('returns ltr for English', () => expect(getLocaleDirection('en')).toBe('ltr'));
  });

  describe('getCurrencySymbol', () => {
    it('returns $ for USD', () => {
      expect(getCurrencySymbol('USD', 'en')).toBe('$');
    });
  });
});
