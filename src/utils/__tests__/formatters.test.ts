import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatCompactNumber,
  formatPercent,
  formatNumber,
  formatVariance,
} from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats whole number currency', () => {
      const r = formatCurrency(1500);
      expect(r).toContain('1,500');
    });
  });

  describe('formatCurrencyDetailed', () => {
    it('formats with 2 decimals', () => {
      const r = formatCurrencyDetailed(1234.5);
      expect(r).toContain('1,234.50');
    });
  });

  describe('formatCompactNumber', () => {
    it('formats with compact notation', () => {
      const r = formatCompactNumber(1500000);
      expect(r).toContain('1.5');
    });
  });

  describe('formatPercent', () => {
    it('formats as percentage', () => {
      const r = formatPercent(15.5);
      expect(r).toBeDefined();
    });
  });

  describe('formatNumber', () => {
    it('formats plain number', () => {
      const r = formatNumber(1234567);
      expect(r).toBe('1,234,567');
    });
  });

  describe('formatVariance', () => {
    it('returns formatted and isPositive', () => {
      const r = formatVariance(100);
      expect(r.isPositive).toBe(true);
      expect(r.formatted).toBeDefined();
    });

    it('handles negative variance', () => {
      const r = formatVariance(-100);
      expect(r.isPositive).toBe(false);
    });
  });
});
