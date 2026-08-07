import { describe, it, expect } from 'vitest';
import { MultiCurrencyEngine } from './MultiCurrencyEngine';

describe('MultiCurrencyEngine', () => {
  describe('translate', () => {
    it('should return amount unchanged when currencies are the same', () => {
      const result = MultiCurrencyEngine.translate(100, 'USD', 'USD', 1.25);
      expect(result).toBe(100);
    });

    it('should multiply amount by rate for different currencies', () => {
      const result = MultiCurrencyEngine.translate(100, 'USD', 'EUR', 0.85);
      expect(result).toBe(85);
    });

    it('should return 0 when rate is 0', () => {
      const result = MultiCurrencyEngine.translate(100, 'USD', 'EUR', 0);
      expect(result).toBe(0);
    });

    it('should handle zero amount', () => {
      const result = MultiCurrencyEngine.translate(0, 'USD', 'EUR', 1.2);
      expect(result).toBe(0);
    });

    it('should handle negative amount', () => {
      const result = MultiCurrencyEngine.translate(-50, 'USD', 'EUR', 1.1);
      expect(result).toBeCloseTo(-55, 10);
    });

    it('validates currency codes and numeric arguments', () => {
      expect(() => MultiCurrencyEngine.translate(NaN, 'USD', 'EUR', 1.2)).toThrow();
      expect(() => MultiCurrencyEngine.translate(100, 'invalid', 'EUR', 1.2)).toThrow();
      expect(() => MultiCurrencyEngine.translate(100, 'USD', 'invalid', 1.2)).toThrow();
      expect(() => MultiCurrencyEngine.translate(100, 'USD', 'EUR', NaN)).toThrow();
      expect(() => MultiCurrencyEngine.translate(100, 'USD', 'EUR', -1.5)).toThrow();
    });
  });

  describe('calculateTranslationGainLoss', () => {
    it('should calculate gain when rate increases', () => {
      const result = MultiCurrencyEngine.calculateTranslationGainLoss(1000, 1.1, 1.2);
      expect(result).toBeCloseTo(100, 10);
    });

    it('should calculate loss when rate decreases', () => {
      const result = MultiCurrencyEngine.calculateTranslationGainLoss(1000, 1.2, 1.1);
      expect(result).toBeCloseTo(-100, 10);
    });

    it('should return 0 when old rate is 0', () => {
      const result = MultiCurrencyEngine.calculateTranslationGainLoss(100, 0, 1.5);
      expect(result).toBe(0);
    });

    it('validates rate values and types', () => {
      expect(() => MultiCurrencyEngine.calculateTranslationGainLoss(NaN, 1, 1.2)).toThrow();
      expect(() => MultiCurrencyEngine.calculateTranslationGainLoss(100, NaN, 1.2)).toThrow();
      expect(() => MultiCurrencyEngine.calculateTranslationGainLoss(100, 1.2, NaN)).toThrow();
      expect(() => MultiCurrencyEngine.calculateTranslationGainLoss(100, -1, 1.2)).toThrow();
    });
  });

  describe('getWeightedAverageRate', () => {
    it('should return average of multiple rates', () => {
      const rates = [
        { id: '1', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.8, effectiveDate: '2024-01-01' },
        { id: '2', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.9, effectiveDate: '2024-02-01' },
        { id: '3', fromCurrency: 'USD', toCurrency: 'EUR', rate: 1.0, effectiveDate: '2024-03-01' },
      ];
      const result = MultiCurrencyEngine.getWeightedAverageRate(rates);
      expect(result).toBeCloseTo(0.9, 5);
    });

    it('validates rates array and items', () => {
      expect(() => MultiCurrencyEngine.getWeightedAverageRate(null as any)).toThrow();
      expect(() => MultiCurrencyEngine.getWeightedAverageRate([{ rate: -1 } as any])).toThrow();
      expect(() => MultiCurrencyEngine.getWeightedAverageRate([{ rate: NaN } as any])).toThrow();
    });
  });

  describe('convertIncomeStatement', () => {
    it('should convert revenue and expenses at average rate and calculate gain/loss', () => {
      const result = MultiCurrencyEngine.convertIncomeStatement(10000, 6000, 1.2, 1.25);
      expect(result.revenueUSD).toBe(12000);
      expect(result.expensesUSD).toBe(7200);
      expect(result.translationGainLoss).toBe(200);
    });

    it('validates input parameters', () => {
      expect(() => MultiCurrencyEngine.convertIncomeStatement(NaN, 500, 1.2, 1.2)).toThrow();
      expect(() => MultiCurrencyEngine.convertIncomeStatement(1000, NaN, 1.2, 1.2)).toThrow();
      expect(() => MultiCurrencyEngine.convertIncomeStatement(1000, 500, NaN, 1.2)).toThrow();
      expect(() => MultiCurrencyEngine.convertIncomeStatement(1000, 500, 1.2, NaN)).toThrow();
      expect(() => MultiCurrencyEngine.convertIncomeStatement(1000, 500, -1.2, 1.2)).toThrow();
    });
  });

  describe('translateBalanceSheet and calculateTotalCTA (ASC 830)', () => {
    it('translates balance sheet items according to ASC 830 rate conventions', () => {
      const items = [
        { name: 'Cash', type: 'asset' as const, localAmount: 10000 },
        { name: 'Accounts Payable', type: 'liability' as const, localAmount: 4000 },
        { name: 'Common Stock', type: 'equity' as const, localAmount: 5000 },
        { name: 'Sales Revenue', type: 'revenue' as const, localAmount: 8000 },
        { name: 'Operating Expenses', type: 'expense' as const, localAmount: 3000 },
      ];

      const translated = MultiCurrencyEngine.translateBalanceSheet(items, 1.3, 1.25, 1.1);
      expect(translated).toHaveLength(5);
      expect(translated[0]!.translatedAmount).toBe(13000); // 10000 * 1.3
      expect(translated[0]!.ctaAdjustment).toBe(2000); // 13000 - 11000
      expect(translated[2]!.ctaAdjustment).toBe(0); // equity has 0 CTA

      const totalCTA = MultiCurrencyEngine.calculateTotalCTA(translated);
      expect(totalCTA).toBeGreaterThan(0);
      expect(MultiCurrencyEngine.calculateTotalCTA(null as any)).toBe(0);
    });

    it('validates parameters for balance sheet translation', () => {
      expect(() => MultiCurrencyEngine.translateBalanceSheet(null as any, 1, 1, 1)).toThrow();
      expect(() => MultiCurrencyEngine.translateBalanceSheet([], NaN, 1, 1)).toThrow();
      expect(() => MultiCurrencyEngine.translateBalanceSheet([], 1, NaN, 1)).toThrow();
      expect(() => MultiCurrencyEngine.translateBalanceSheet([], 1, 1, NaN)).toThrow();
    });
  });

  describe('remeasure (ASC 830)', () => {
    it('remeasures monetary and non-monetary items', () => {
      const items = [
        { name: 'Cash', monetary: true, localAmount: 10000 },
        { name: 'Inventory', monetary: false, localAmount: 5000 },
      ];

      const remeasured = MultiCurrencyEngine.remeasure(items, 1.25, 1.1);
      expect(remeasured).toHaveLength(2);
      expect(remeasured[0]!.functionalAmount).toBe(12500);
      expect(remeasured[0]!.gainLoss).toBeCloseTo(1500, 2);
      expect(remeasured[1]!.functionalAmount).toBe(5500);
      expect(remeasured[1]!.gainLoss).toBe(0);
    });

    it('validates remeasure input array', () => {
      expect(() => MultiCurrencyEngine.remeasure(null as any, 1.2, 1.1)).toThrow();
    });
  });
});
