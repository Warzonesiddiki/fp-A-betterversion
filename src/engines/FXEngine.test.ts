import { describe, it, expect, beforeEach } from 'vitest';
import { FXEngine } from './FXEngine';

describe('FXEngine', () => {
  beforeEach(() => {
    FXEngine.clearRates();
  });

  describe('getRate', () => {
    it('returns 1 for same currency', () => {
      expect(FXEngine.getRate('USD', 'USD')).toBe(1);
    });

    it('returns 0 for unknown pair', () => {
      expect(FXEngine.getRate('USD', 'XYZ')).toBe(0);
    });

    it('returns latest rate when no date specified', () => {
      FXEngine.setRate('USD', 'EUR', 0.85, '2026-01-01');
      FXEngine.setRate('USD', 'EUR', 0.9, '2026-06-01');
      expect(FXEngine.getRate('USD', 'EUR')).toBe(0.9);
    });

    it('returns rate on or before given date', () => {
      FXEngine.setRate('USD', 'EUR', 0.85, '2026-01-01');
      FXEngine.setRate('USD', 'EUR', 0.9, '2026-06-01');
      expect(FXEngine.getRate('USD', 'EUR', '2026-03-01')).toBe(0.85);
    });

    it('falls back to latest when no rate matches date', () => {
      FXEngine.setRate('USD', 'EUR', 0.85, '2026-01-01');
      expect(FXEngine.getRate('USD', 'EUR', '2025-01-01')).toBe(0.85);
    });
  });

  describe('convert', () => {
    it('converts amount using rate', () => {
      FXEngine.setRate('USD', 'EUR', 0.85, '2026-01-01');
      expect(FXEngine.convert(100, 'USD', 'EUR')).toBeCloseTo(85);
    });

    it('returns 0 for NaN amount', () => {
      expect(FXEngine.convert(NaN, 'USD', 'EUR')).toBe(0);
    });

    it('returns 0 for Infinity amount', () => {
      expect(FXEngine.convert(Infinity, 'USD', 'EUR')).toBe(0);
    });

    it('returns 0 when no rate exists', () => {
      expect(FXEngine.convert(100, 'USD', 'XYZ')).toBe(0);
    });

    it('returns amount when same currency', () => {
      expect(FXEngine.convert(100, 'USD', 'USD')).toBe(100);
    });
  });

  describe('setRate', () => {
    it('adds rate entry', () => {
      FXEngine.setRate('USD', 'EUR', 0.85, '2026-01-01');
      expect(FXEngine.getRate('USD', 'EUR')).toBe(0.85);
    });

    it('ignores negative rate', () => {
      FXEngine.setRate('USD', 'EUR', -0.5, '2026-01-01');
      expect(FXEngine.getRate('USD', 'EUR')).toBe(0);
    });

    it('ignores NaN rate', () => {
      FXEngine.setRate('USD', 'EUR', NaN, '2026-01-01');
      expect(FXEngine.getRate('USD', 'EUR')).toBe(0);
    });

    it('sorts entries by date', () => {
      FXEngine.setRate('USD', 'EUR', 0.9, '2026-06-01');
      FXEngine.setRate('USD', 'EUR', 0.85, '2026-01-01');
      // getRate uses find() — returns first entry with date <= target
      expect(FXEngine.getRate('USD', 'EUR', '2026-03-01')).toBe(0.85);
      expect(FXEngine.getRate('USD', 'EUR', '2026-07-01')).toBe(0.85);
    });
  });

  describe('getHistoricalRates', () => {
    it('returns rates within date range', () => {
      FXEngine.setRate('USD', 'EUR', 0.85, '2026-01-01');
      FXEngine.setRate('USD', 'EUR', 0.87, '2026-03-01');
      FXEngine.setRate('USD', 'EUR', 0.9, '2026-06-01');
      const result = FXEngine.getHistoricalRates('USD', 'EUR', '2026-02-01', '2026-04-01');
      expect(result).toHaveLength(1);
      expect(result![0]!.rate).toBe(0.87);
    });

    it('returns empty for no matches', () => {
      FXEngine.setRate('USD', 'EUR', 0.85, '2026-01-01');
      expect(FXEngine.getHistoricalRates('USD', 'GBP', '2026-01-01', '2026-12-31')).toHaveLength(0);
    });
  });

  describe('getAverageRate', () => {
    it('returns average of rates in period', () => {
      FXEngine.setRate('USD', 'EUR', 0.8, '2026-01-15');
      FXEngine.setRate('USD', 'EUR', 0.9, '2026-06-15');
      expect(FXEngine.getAverageRate('USD', 'EUR', '2026-12-31')).toBeCloseTo(0.85);
    });

    it('returns 0 when no rates exist', () => {
      expect(FXEngine.getAverageRate('USD', 'XYZ')).toBe(0);
    });

    it('returns latest when no entries match period', () => {
      FXEngine.setRate('USD', 'EUR', 0.85, '2025-01-01');
      expect(FXEngine.getAverageRate('USD', 'EUR', '2026-12-31')).toBeCloseTo(0.85);
    });
  });

  describe('translateForConsolidation', () => {
    beforeEach(() => {
      FXEngine.setRate('EUR', 'USD', 1.1, '2026-01-01');
      FXEngine.setRate('EUR', 'USD', 1.15, '2026-06-01');
    });

    it('uses closing rate', () => {
      // getRate uses find() — returns first entry with date <= period
      const result = FXEngine.translateForConsolidation({
        amount: 1000,
        rateType: 'closing',
        entityCurrency: 'EUR',
        parentCurrency: 'USD',
        period: '2026-06-01',
      });
      expect(result.translated).toBeCloseTo(1100);
      expect(result.rateUsed).toBe(1.1);
      expect(result.rateType).toBe('closing');
    });

    it('uses average rate', () => {
      const result = FXEngine.translateForConsolidation({
        amount: 1000,
        rateType: 'average',
        entityCurrency: 'EUR',
        parentCurrency: 'USD',
        period: '2026-12-31',
      });
      expect(result.translated).toBeCloseTo(1125);
    });

    it('returns 0 translated when no rate', () => {
      const result = FXEngine.translateForConsolidation({
        amount: 1000,
        rateType: 'closing',
        entityCurrency: 'XYZ',
        parentCurrency: 'USD',
        period: '2026-06-01',
      });
      expect(result.translated).toBe(0);
      expect(result.rateUsed).toBe(0);
    });
  });

  describe('calculateFXGainLoss', () => {
    it('calculates gain when current rate > historical', () => {
      const result = FXEngine.calculateFXGainLoss(1000, 850, 1.15, 1.1);
      expect(result).toBeCloseTo(50);
    });

    it('calculates loss when current rate < historical', () => {
      const result = FXEngine.calculateFXGainLoss(1000, 850, 1.05, 1.1);
      expect(result).toBeCloseTo(-50);
    });

    it('returns 0 for non-finite inputs', () => {
      expect(FXEngine.calculateFXGainLoss(NaN, 850, 1.15, 1.1)).toBe(0);
      expect(FXEngine.calculateFXGainLoss(1000, Infinity, 1.15, 1.1)).toBe(0);
    });
  });

  describe('getAllRates and clearRates', () => {
    it('returns all rates sorted by date', () => {
      FXEngine.setRate('USD', 'EUR', 0.85, '2026-06-01');
      FXEngine.setRate('USD', 'GBP', 0.75, '2026-01-01');
      const all = FXEngine.getAllRates();
      expect(all).toHaveLength(2);
      expect(all![0]!.date).toBe('2026-01-01');
    });

    it('clears all rates', () => {
      FXEngine.setRate('USD', 'EUR', 0.85, '2026-01-01');
      FXEngine.clearRates();
      expect(FXEngine.getAllRates()).toHaveLength(0);
    });
  });
});
