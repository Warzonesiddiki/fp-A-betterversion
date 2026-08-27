import { describe, it, expect, beforeEach } from 'vitest';
import * as fmt from './formatters';
import { useFinancialContextStore } from '@/store/financialContextStore';

describe('formatters utility', () => {
  describe('formatCurrency', () => {
    it('should format USD currency without decimals', () => {
      // Using a regex to match because of potential NBSP (\u00A0) in different environments
      const result = fmt.formatCurrency(1234);
      expect(result).toMatch(/\$1,234/);
    });
    it('should handle zero', () => {
      expect(fmt.formatCurrency(0)).toMatch(/\$0/);
    });
  });

  describe('formatCurrencyDetailed', () => {
    it('should format USD currency with 2 decimals', () => {
      expect(fmt.formatCurrencyDetailed(1234.56)).toMatch(/\$1,234.56/);
    });
  });

  describe('formatPercent', () => {
    it('should format percentage', () => {
      // formatPercent(10) -> (10/100) -> 0.1 -> "10.0%"
      expect(fmt.formatPercent(10)).toMatch(/10\.0%/);
      expect(fmt.formatPercent(-5.5)).toMatch(/5\.5%/); // implementation uses Math.abs
    });
  });

  describe('formatCompactNumber', () => {
    it('should format large numbers compactly', () => {
      expect(fmt.formatCompactNumber(1200000)).toMatch(/1.2M/);
      expect(fmt.formatCompactNumber(1500)).toMatch(/1.5K/);
    });
  });

  describe('formatVariance', () => {
    it('should identify positive variance', () => {
      const result = fmt.formatVariance(100);
      expect(result.isPositive).toBe(true);
      expect(result.formatted).toMatch(/\$100/);
    });
    it('should identify negative variance', () => {
      const result = fmt.formatVariance(-100);
      expect(result.isPositive).toBe(false);
      expect(result.formatted).toMatch(/\$100/);
    });
  });

  describe('reporting currency integration', () => {
    beforeEach(() => {
      useFinancialContextStore.getState().resetContext();
    });

    it('formatCurrency reflects the reporting currency at call time', () => {
      expect(fmt.formatCurrency(1234)).toMatch(/\$1,234/);
      useFinancialContextStore.getState().setContext({ currency: { code: 'EUR' } });
      expect(fmt.formatCurrency(1234)).toMatch(/€1,234/);
    });

    it('formatCurrencyDetailed reflects the reporting currency at call time', () => {
      useFinancialContextStore.getState().setContext({ currency: { code: 'GBP' } });
      expect(fmt.formatCurrencyDetailed(1234.56)).toMatch(/£1,234.56/);
    });

    it('formatVariance reflects the reporting currency at call time', () => {
      useFinancialContextStore.getState().setContext({ currency: { code: 'EUR' } });
      const result = fmt.formatVariance(-100);
      expect(result.isPositive).toBe(false);
      expect(result.formatted).toMatch(/€100/);
    });

    it('caches formatter instances per currency across calls', () => {
      fmt.formatCurrency(1);
      fmt.formatCurrency(2);
      useFinancialContextStore.getState().setContext({ currency: { code: 'JPY' } });
      expect(fmt.formatCurrency(1234)).toMatch(/¥1,234/);
      expect(fmt.formatCurrency(-7)).toMatch(/¥7/);
    });
  });
});
