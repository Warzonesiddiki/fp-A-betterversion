import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCompact,
  formatPercent,
  formatNumber,
  formatVariance,
  parseFinancialInput,
  useFinancialFormatter,
} from '../financialFormatting';

describe('financialFormatting', () => {
  describe('formatCurrency', () => {
    it('formats positive value', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1,234.56');
    });

    it('formats negative with parentheses by default', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('(');
      expect(result).toContain(')');
    });

    it('returns null display for null', () => {
      expect(formatCurrency(null)).toBe('—');
    });

    it('returns zero display for zero', () => {
      expect(formatCurrency(0)).toBe('—');
    });

    it('supports minus negative style', () => {
      const result = formatCurrency(-100, { negativeStyle: 'minus' });
      expect(result).toContain('-');
    });
  });

  describe('formatCompact', () => {
    it('formats billions', () => {
      expect(formatCompact(1_500_000_000)).toContain('1.5B');
    });

    it('formats millions', () => {
      expect(formatCompact(2_500_000)).toContain('2.5M');
    });

    it('formats thousands', () => {
      const r = formatCompact(1000);
      expect(r).not.toBe('—');
    });

    it('returns dash for null', () => {
      expect(formatCompact(null)).toBe('—');
    });

    it('formats negative compact', () => {
      expect(formatCompact(-2_500_000)).toContain('-');
    });
  });

  describe('formatPercent', () => {
    it('formats with decimals', () => {
      expect(formatPercent(15.5)).toBe('15.5%');
    });

    it('returns dash for null', () => {
      expect(formatPercent(null)).toBe('—');
    });
  });

  describe('formatNumber', () => {
    it('formats number with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('returns dash for null', () => {
      expect(formatNumber(null)).toBe('—');
    });
  });

  describe('formatVariance', () => {
    it('returns positive variance', () => {
      const r = formatVariance(120, 100);
      expect(r.text).toBeDefined();
      expect(r.className).toContain('fin-positive');
      expect(r.percentage).toContain('+');
    });

    it('returns negative variance', () => {
      const r = formatVariance(80, 100);
      expect(r.className).toContain('fin-negative');
    });

    it('returns neutral for zero diff', () => {
      const r = formatVariance(100, 100);
      expect(r.className).toBe('fin-neutral');
    });
  });

  describe('parseFinancialInput', () => {
    it('parses simple number', () => {
      expect(parseFinancialInput('1000')).toBe(1000);
    });

    it('parses parentheses negative', () => {
      expect(parseFinancialInput('(500)')).toBe(-500);
    });

    it('parses compact K notation', () => {
      expect(parseFinancialInput('100K')).toBe(100000);
    });

    it('parses compact M notation', () => {
      expect(parseFinancialInput('2.5M')).toBe(2500000);
    });

    it('parses compact B notation', () => {
      expect(parseFinancialInput('1B')).toBe(1000000000);
    });

    it('parses percentage', () => {
      expect(parseFinancialInput('15%')).toBe(15);
    });

    it('returns null for empty', () => {
      expect(parseFinancialInput('')).toBeNull();
      expect(parseFinancialInput('—')).toBeNull();
    });

    it('returns null for invalid', () => {
      expect(parseFinancialInput('abc')).toBeNull();
    });
  });

  describe('useFinancialFormatter', () => {
    it('returns all formatting functions', () => {
      const f = useFinancialFormatter();
      expect(f.currency).toBeDefined();
      expect(f.compact).toBeDefined();
      expect(f.percent).toBeDefined();
      expect(f.number).toBeDefined();
      expect(f.variance).toBeDefined();
      expect(f.parse).toBeDefined();
    });
  });
});
