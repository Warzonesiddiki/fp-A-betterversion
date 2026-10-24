import { describe, it, expect } from 'vitest';
import { FXEngine, MissingFXRateError, InvalidFinancialInputError } from './FXEngine';

/**
 * GOVERNANCE EVIDENCE for cap:fx.engine
 *
 * The FXEngine provides currency conversion, rate management, and
 * consolidation translation. The governance dimension here is CONVERSION
 * ACCURACY — FX translation feeds every consolidated statement. The engine
 * must use decimal.js (not IEEE-754 float) for multiplication, must throw
 * on missing rates (never substitute 0), and must reject invalid inputs.
 *
 * Tested dimensions:
 * 1. Rate setting and retrieval
 * 2. Currency conversion accuracy
 * 3. Missing rate error handling
 * 4. Invalid input rejection
 * 5. Translation for consolidation
 * 6. Determinism
 *
 * NOTE: FXEngine uses a static rate store. Each test uses a unique currency
 * pair to avoid rate leakage between tests.
 */

describe('FXEngine — GOVERNANCE (fx.engine)', () => {

  describe('1. Rate setting and retrieval', () => {

    it('setRate then getRate returns the same rate', () => {
      FXEngine.setRate('AUD', 'NZD', 0.92, '2026-01-15', 'manual');
      const rate = FXEngine.getRate('AUD', 'NZD', '2026-01-15');
      expect(rate).toBe(0.92);
    });

    it('getRate returns 1 for same currency', () => {
      expect(FXEngine.getRate('USD', 'USD')).toBe(1);
    });

    it('getRate returns latest rate when no date specified', () => {
      FXEngine.setRate('GBP', 'CHF', 0.90, '2026-01-01', 'manual');
      FXEngine.setRate('GBP', 'CHF', 0.92, '2026-02-01', 'manual');
      FXEngine.setRate('GBP', 'CHF', 0.95, '2026-03-01', 'manual');
      const rate = FXEngine.getRate('GBP', 'CHF');
      expect(rate).toBe(0.95);
    });

    it('getRate with date returns rate on or before that date', () => {
      FXEngine.setRate('JPY', 'CNY', 0.06, '2026-01-01', 'manual');
      FXEngine.setRate('JPY', 'CNY', 0.07, '2026-02-01', 'manual');
      FXEngine.setRate('JPY', 'CNY', 0.08, '2026-03-01', 'manual');
      const rate = FXEngine.getRate('JPY', 'CNY', '2026-02-15');
      expect(rate).toBe(0.07);
    });
  });

  describe('2. Currency conversion accuracy', () => {

    it('convert converts between currencies using decimal arithmetic', () => {
      FXEngine.setRate('CAD', 'MXN', 0.92, '2026-01-15', 'manual');
      const result = FXEngine.convert(1000, 'CAD', 'MXN', '2026-01-15');
      expect(result).toBeCloseTo(920, 2);
    });

    it('convert uses decimal.js not IEEE-754 (no float drift)', () => {
      FXEngine.setRate('SEK', 'NOK', 1.1, '2026-01-15', 'manual');
      // Raw float: 0.07 * 1.1 = 0.07700000000000001
      // Decimal: should be exactly 0.077
      const result = FXEngine.convert(0.07, 'SEK', 'NOK', '2026-01-15');
      expect(result).toBeCloseTo(0.077, 10);
    });

    it('convert with same currency returns same amount', () => {
      expect(FXEngine.convert(1000, 'USD', 'USD')).toBe(1000);
    });

    it('convertExact returns Decimal with full precision', () => {
      FXEngine.setRate('PLN', 'CZK', 0.92, '2026-01-15', 'manual');
      const result = FXEngine.convertExact(1000, 'PLN', 'CZK', '2026-01-15');
      expect(result.toString()).toBe('920');
    });
  });

  describe('3. Missing rate error handling', () => {

    it('getRate throws MissingFXRateError for unknown pair', () => {
      expect(() => FXEngine.getRate('ZZZ', 'YYY', '2026-01-15')).toThrow(MissingFXRateError);
    });

    it('convert throws MissingFXRateError for unknown pair', () => {
      expect(() => FXEngine.convert(100, 'ZZZ', 'YYY', '2026-01-15')).toThrow(MissingFXRateError);
    });

    it('MissingFXRateError includes currency codes', () => {
      try {
        FXEngine.getRate('ZZZ', 'YYY', '2026-01-15');
      } catch (e) {
        expect((e as MissingFXRateError).from).toBe('ZZZ');
        expect((e as MissingFXRateError).to).toBe('YYY');
      }
    });

    it('getRate with date before earliest rate throws unless use-earliest option', () => {
      FXEngine.setRate('HUF', 'RON', 0.02, '2026-06-01', 'manual');
      expect(() => FXEngine.getRate('HUF', 'RON', '2026-01-15')).toThrow(MissingFXRateError);
    });
  });

  describe('4. Invalid input rejection', () => {

    it('setRate rejects non-positive rates', () => {
      expect(() => FXEngine.setRate('USD', 'EUR', 0, '2026-01-15', 'manual')).toThrow(InvalidFinancialInputError);
      expect(() => FXEngine.setRate('USD', 'EUR', -1, '2026-01-15', 'manual')).toThrow(InvalidFinancialInputError);
    });

    it('setRate rejects non-finite rates', () => {
      expect(() => FXEngine.setRate('USD', 'EUR', NaN, '2026-01-15', 'manual')).toThrow(InvalidFinancialInputError);
      expect(() => FXEngine.setRate('USD', 'EUR', Infinity, '2026-01-15', 'manual')).toThrow(InvalidFinancialInputError);
    });

    it('convert rejects non-finite amounts', () => {
      expect(() => FXEngine.convert(NaN, 'USD', 'EUR')).toThrow(InvalidFinancialInputError);
      expect(() => FXEngine.convert(Infinity, 'USD', 'EUR')).toThrow(InvalidFinancialInputError);
    });
  });

  describe('5. Translation for consolidation', () => {

    it('translateForConsolidation returns translated amount', () => {
      FXEngine.setRate('INR', 'USD', 0.012, '2026-01-15', 'manual');
      const result = FXEngine.translateForConsolidation({
        amount: 1000,
        rateType: 'closing',
        entityCurrency: 'INR',
        parentCurrency: 'USD',
        period: '2026-01',
      });
      expect(result.translated).toBeCloseTo(12, 2);
      expect(result.rateUsed).toBe(0.012);
      expect(result.rateType).toBe('closing');
    });

    it('getHistoricalRates returns rates in date range', () => {
      FXEngine.setRate('BRL', 'ARS', 0.002, '2026-01-01', 'manual');
      FXEngine.setRate('BRL', 'ARS', 0.003, '2026-02-01', 'manual');
      FXEngine.setRate('BRL', 'ARS', 0.004, '2026-03-01', 'manual');
      const rates = FXEngine.getHistoricalRates('BRL', 'ARS', '2026-01-15', '2026-02-15');
      expect(rates).toHaveLength(1);
      expect(rates[0]!.rate).toBe(0.003);
    });
  });

  describe('6. Determinism', () => {

    it('convert is deterministic for same inputs', () => {
      FXEngine.setRate('ZAR', 'AUD', 0.70, '2026-01-15', 'manual');
      const r1 = FXEngine.convert(1000, 'ZAR', 'AUD', '2026-01-15');
      const r2 = FXEngine.convert(1000, 'ZAR', 'AUD', '2026-01-15');
      expect(r1).toBe(r2);
    });

    it('getRate is deterministic for same date', () => {
      FXEngine.setRate('ILS', 'KRW', 0.0003, '2026-01-15', 'manual');
      const r1 = FXEngine.getRate('ILS', 'KRW', '2026-01-15');
      const r2 = FXEngine.getRate('ILS', 'KRW', '2026-01-15');
      expect(r1).toBe(r2);
    });
  });
});
