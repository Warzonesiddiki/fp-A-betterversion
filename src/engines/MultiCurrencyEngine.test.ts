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

    it('should handle fractional rates', () => {
      const result = MultiCurrencyEngine.translate(3, 'USD', 'GBP', 0.333);
      expect(result).toBeCloseTo(0.999, 3);
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

    it('should return 0 when rates are unchanged', () => {
      const result = MultiCurrencyEngine.calculateTranslationGainLoss(500, 1.25, 1.25);
      expect(result).toBe(0);
    });

    it('should handle negative amounts', () => {
      const result = MultiCurrencyEngine.calculateTranslationGainLoss(-200, 1.0, 1.1);
      expect(result).toBeCloseTo(-20, 10);
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

    it('should return 0 for empty array', () => {
      const result = MultiCurrencyEngine.getWeightedAverageRate([]);
      expect(result).toBe(0);
    });

    it('should return the rate for single entry', () => {
      const rates = [
        {
          id: '1',
          fromCurrency: 'USD',
          toCurrency: 'GBP',
          rate: 1.35,
          effectiveDate: '2024-01-01',
        },
      ];
      const result = MultiCurrencyEngine.getWeightedAverageRate(rates);
      expect(result).toBe(1.35);
    });

    it('should handle all same rates', () => {
      const rates = [
        { id: '1', fromCurrency: 'USD', toCurrency: 'JPY', rate: 110, effectiveDate: '2024-01-01' },
        { id: '2', fromCurrency: 'USD', toCurrency: 'JPY', rate: 110, effectiveDate: '2024-02-01' },
      ];
      const result = MultiCurrencyEngine.getWeightedAverageRate(rates);
      expect(result).toBe(110);
    });
  });

  describe('convertIncomeStatement', () => {
    it('should convert revenue and expenses at average rate', () => {
      const result = MultiCurrencyEngine.convertIncomeStatement(10000, 6000, 1.2, 1.25);
      expect(result.revenueUSD).toBe(12000);
      expect(result.expensesUSD).toBe(7200);
    });

    it('should calculate translation gain when close rate > avg rate', () => {
      const result = MultiCurrencyEngine.convertIncomeStatement(10000, 6000, 1.2, 1.25);
      const netIncomeLocal = 4000;
      expect(result.translationGainLoss).toBe(netIncomeLocal * (1.25 - 1.2));
    });

    it('should calculate translation loss when close rate < avg rate', () => {
      const result = MultiCurrencyEngine.convertIncomeStatement(10000, 6000, 1.2, 1.15);
      const netIncomeLocal = 4000;
      expect(result.translationGainLoss).toBe(netIncomeLocal * (1.15 - 1.2));
    });

    it('should handle zero revenue and expenses', () => {
      const result = MultiCurrencyEngine.convertIncomeStatement(0, 0, 1.2, 1.25);
      expect(result.revenueUSD).toBe(0);
      expect(result.expensesUSD).toBe(0);
      expect(result.translationGainLoss).toBe(0);
    });

    it('should handle negative net income (loss)', () => {
      const result = MultiCurrencyEngine.convertIncomeStatement(5000, 8000, 1.2, 1.25);
      expect(result.translationGainLoss).toBeCloseTo(-150, 10);
    });
  });
});
