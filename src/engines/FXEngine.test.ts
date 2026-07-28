import { describe, it, expect, beforeEach } from 'vitest';
import { FXEngine, MissingFXRateError, InvalidFinancialInputError } from './FXEngine';

/**
 * Rewritten per audit F-0001 / F-0002 / F-0007.
 * The previous version of this file asserted the defects:
 *  - "returns 0 for unknown pair" (silent zero → misstated consolidation)
 *  - "falls back to latest when no rate matches date" (asserted the oldest
 *    rate for a date before all rates)
 * Both assertions were deleted. Missing data now throws typed errors.
 */

describe('FXEngine', () => {
  beforeEach(() => {
    FXEngine.clearRates();
  });

  describe('getRate — same currency identity', () => {
    it('returns 1 for same currency', () => {
      expect(FXEngine.getRate('USD', 'USD')).toBe(1);
    });

    it('validates dates even for same-currency lookups', () => {
      expect(() => FXEngine.getRate('USD', 'USD', 'not-a-date')).toThrow(
        InvalidFinancialInputError
      );
    });
  });

  describe('getRate — KAV-01: latest-on-or-before lookup (F-0002)', () => {
    beforeEach(() => {
      FXEngine.setRate('EUR', 'USD', 1.05, '2026-01-31');
      FXEngine.setRate('EUR', 'USD', 1.07, '2026-02-28');
      FXEngine.setRate('EUR', 'USD', 1.09, '2026-03-31');
    });

    it('KAV-01: exact date match returns that date rate', () => {
      expect(FXEngine.getRate('EUR', 'USD', '2026-03-31')).toBe(1.09);
    });

    it('date between rates returns the LATEST rate on or before, not the oldest', () => {
      // The audit defect: find() returned the FIRST (oldest) match → 1.05.
      expect(FXEngine.getRate('EUR', 'USD', '2026-03-15')).toBe(1.07);
      expect(FXEngine.getRate('EUR', 'USD', '2026-02-28')).toBe(1.07);
      expect(FXEngine.getRate('EUR', 'USD', '2026-02-01')).toBe(1.05);
    });

    it('date after all rates returns the latest rate', () => {
      expect(FXEngine.getRate('EUR', 'USD', '2026-12-31')).toBe(1.09);
    });

    it('date before all rates throws by default (safe policy)', () => {
      expect(() => FXEngine.getRate('EUR', 'USD', '2025-12-31')).toThrow(MissingFXRateError);
    });

    it('date before all rates can explicitly opt into earliest rate', () => {
      expect(
        FXEngine.getRate('EUR', 'USD', '2025-12-31', { onDateBeforeEarliest: 'use-earliest' })
      ).toBe(1.05);
    });

    it('accepts ISO datetime input by normalizing to the calendar date', () => {
      expect(FXEngine.getRate('EUR', 'USD', '2026-03-31T23:59:59.000Z')).toBe(1.09);
    });

    it('works when rates were inserted out of chronological order', () => {
      FXEngine.clearRates();
      FXEngine.setRate('EUR', 'USD', 1.09, '2026-03-31');
      FXEngine.setRate('EUR', 'USD', 1.05, '2026-01-31');
      FXEngine.setRate('EUR', 'USD', 1.07, '2026-02-28');
      expect(FXEngine.getRate('EUR', 'USD', '2026-03-15')).toBe(1.07);
      expect(FXEngine.getRate('EUR', 'USD')).toBe(1.09);
    });

    it('invalid date throws InvalidFinancialInputError', () => {
      expect(() => FXEngine.getRate('EUR', 'USD', '2026-13-99')).toThrow(
        InvalidFinancialInputError
      );
      expect(() => FXEngine.getRate('EUR', 'USD', 'March 2026')).toThrow(
        InvalidFinancialInputError
      );
    });
  });

  describe('getRate — KAV-02: missing rate throws (F-0001)', () => {
    it('KAV-02: convert with no rates loaded throws MissingFXRateError', () => {
      expect(() => FXEngine.convert(1000, 'GBP', 'USD')).toThrow(MissingFXRateError);
    });

    it('error carries from, to, date, and context', () => {
      try {
        FXEngine.getRate('GBP', 'USD', '2026-03-31', { context: 'unit-test' });
        expect.unreachable('should have thrown');
      } catch (e) {
        const err = e as MissingFXRateError;
        expect(err).toBeInstanceOf(MissingFXRateError);
        expect(err.name).toBe('MissingFXRateError');
        expect(err.from).toBe('GBP');
        expect(err.to).toBe('USD');
        expect(err.date).toBe('2026-03-31');
        expect(err.context).toBe('unit-test');
        expect(err.message).toContain('GBP->USD');
      }
    });

    it('no code path returns 0 as a legal FX rate', () => {
      FXEngine.setRate('EUR', 'USD', 1.1, '2026-01-31');
      // Missing pair → throw, not 0. Empty pair list → throw, not 0.
      expect(() => FXEngine.getRate('JPY', 'USD')).toThrow(MissingFXRateError);
      // Conversion uses the real rate, never a 0 fallback.
      expect(FXEngine.convert(0, 'EUR', 'USD')).toBe(0); // 0 amount is legitimately 0
      expect(FXEngine.convert(100, 'EUR', 'USD')).toBeCloseTo(110, 10);
    });
  });

  describe('convert', () => {
    beforeEach(() => {
      FXEngine.setRate('EUR', 'USD', 1.09, '2026-03-31');
    });

    it('converts with dated rate', () => {
      expect(FXEngine.convert(1000, 'EUR', 'USD', '2026-03-31')).toBeCloseTo(1090, 10);
    });

    it('same-currency conversion is identity', () => {
      expect(FXEngine.convert(1234.56, 'USD', 'USD')).toBe(1234.56);
    });

    it.each([NaN, Infinity, -Infinity])('rejects non-finite amount %s', (bad) => {
      expect(() => FXEngine.convert(bad, 'EUR', 'USD')).toThrow(InvalidFinancialInputError);
    });
  });

  describe('setRate input rejection', () => {
    it.each([0, -1.2, NaN, Infinity])('rejects invalid rate %s loudly', (bad) => {
      expect(() => FXEngine.setRate('EUR', 'USD', bad, '2026-01-31')).toThrow(
        InvalidFinancialInputError
      );
      // Nothing was stored: a subsequent lookup still fails closed.
      expect(() => FXEngine.getRate('EUR', 'USD')).toThrow(MissingFXRateError);
    });

    it('rejects invalid date', () => {
      expect(() => FXEngine.setRate('EUR', 'USD', 1.1, 'not a date')).toThrow(
        InvalidFinancialInputError
      );
    });

    it('rejects empty currency codes', () => {
      expect(() => FXEngine.setRate('', 'USD', 1.1, '2026-01-31')).toThrow(
        InvalidFinancialInputError
      );
    });

    it('normalizes ISO datetimes to date-only so dated lookups are consistent', () => {
      FXEngine.setRate('EUR', 'USD', 1.08, '2026-03-15T09:30:00.000Z');
      expect(FXEngine.getRate('EUR', 'USD', '2026-03-15')).toBe(1.08);
    });
  });

  describe('getAverageRate', () => {
    beforeEach(() => {
      FXEngine.setRate('EUR', 'USD', 1.0, '2025-06-30');
      FXEngine.setRate('EUR', 'USD', 1.1, '2026-01-15');
      FXEngine.setRate('EUR', 'USD', 1.3, '2026-06-15');
    });

    it('averages rates within the requested year', () => {
      expect(FXEngine.getAverageRate('EUR', 'USD', '2026')).toBeCloseTo(1.2, 10);
    });

    it('throws when the pair has no rates', () => {
      expect(() => FXEngine.getAverageRate('GBP', 'USD', '2026')).toThrow(MissingFXRateError);
    });

    it('throws when no rates exist in the requested year (no silent cross-year fallback)', () => {
      expect(() => FXEngine.getAverageRate('EUR', 'USD', '2024')).toThrow(MissingFXRateError);
    });

    it('same currency returns 1', () => {
      expect(FXEngine.getAverageRate('USD', 'USD', '2026')).toBe(1);
    });
  });

  describe('loadRates (bulk, all-or-nothing)', () => {
    it('loads valid feed records', () => {
      FXEngine.loadRates([
        { id: '1', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.1, effectiveDate: '2026-01-31' },
      ]);
      expect(FXEngine.getRate('EUR', 'USD')).toBe(1.1);
    });

    it('rejects a record with missing effective date instead of defaulting to today', () => {
      expect(() =>
        FXEngine.loadRates([
          {
            id: '1',
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: 1.1,
            effectiveDate: '',
          },
        ])
      ).toThrow(InvalidFinancialInputError);
    });

    it('rejects a record with missing currency pair', () => {
      expect(() =>
        FXEngine.loadRates([
          { id: '1', fromCurrency: '', toCurrency: 'USD', rate: 1.1, effectiveDate: '2026-01-31' },
        ])
      ).toThrow(InvalidFinancialInputError);
    });

    it('is all-or-nothing: one bad record leaves no partial state', () => {
      expect(() =>
        FXEngine.loadRates([
          {
            id: '1',
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: 1.1,
            effectiveDate: '2026-01-31',
          },
          {
            id: '2',
            fromCurrency: 'GBP',
            toCurrency: 'USD',
            rate: -5,
            effectiveDate: '2026-01-31',
          },
        ])
      ).toThrow(InvalidFinancialInputError);
      expect(() => FXEngine.getRate('EUR', 'USD')).toThrow(MissingFXRateError);
    });
  });

  describe('translateForConsolidation / translateTemporal (ASC 830, F-0007)', () => {
    beforeEach(() => {
      FXEngine.setRate('EUR', 'USD', 1.08, '2026-01-15');
      FXEngine.setRate('EUR', 'USD', 1.12, '2026-06-15');
      FXEngine.setRate('EUR', 'USD', 1.2, '2026-12-31');
    });

    it('monetary accounts translate at closing rate', () => {
      const result = FXEngine.translateTemporal(100, 'EUR', 'USD', 'monetary', '2026');
      expect(result.rateType).toBe('closing');
      expect(result.rateUsed).toBe(1.2);
      expect(result.translated).toBeCloseTo(120, 10);
    });

    it('income and expense translate at AVERAGE rate for the period', () => {
      const avg = FXEngine.getAverageRate('EUR', 'USD', '2026'); // (1.08+1.12+1.2)/3
      const income = FXEngine.translateTemporal(100, 'EUR', 'USD', 'income', '2026');
      const expense = FXEngine.translateTemporal(100, 'EUR', 'USD', 'expense', '2026');
      expect(income.rateType).toBe('average');
      expect(income.rateUsed).toBeCloseTo(avg, 10);
      expect(expense.rateUsed).toBeCloseTo(avg, 10);
    });

    it('non-monetary accounts translate at historical (latest undated) rate', () => {
      const result = FXEngine.translateTemporal(100, 'EUR', 'USD', 'non-monetary', '2026');
      expect(result.rateType).toBe('historical');
    });

    it('missing rate propagates MissingFXRateError instead of returning 0', () => {
      expect(() =>
        FXEngine.translateForConsolidation({
          amount: 500,
          rateType: 'closing',
          entityCurrency: 'JPY',
          parentCurrency: 'USD',
          period: '2026-12-31',
        })
      ).toThrow(MissingFXRateError);
    });

    it.each([NaN, Infinity])('rejects non-finite amount %s', (bad) => {
      expect(() =>
        FXEngine.translateForConsolidation({
          amount: bad,
          rateType: 'closing',
          entityCurrency: 'EUR',
          parentCurrency: 'USD',
          period: '2026-12-31',
        })
      ).toThrow(InvalidFinancialInputError);
    });
  });

  describe('CTA (ASC 830, F-0007)', () => {
    beforeEach(() => {
      FXEngine.setRate('EUR', 'USD', 1.1, '2026-06-30');
      FXEngine.setRate('EUR', 'USD', 1.2, '2026-12-31');
      // A post-period rate makes the undated ("historical" convention) lookup
      // differ from the period-end closing rate, so CTA must be non-zero.
      FXEngine.setRate('EUR', 'USD', 1.3, '2027-01-15');
    });

    it('calculateCTA computes current minus historical translation', () => {
      expect(FXEngine.calculateCTA(1000, 1.2, 1.1)).toBeCloseTo(100, 10);
    });

    it.each([NaN, Infinity])('calculateCTA rejects invalid amount %s (never silent 0)', (bad) => {
      expect(() => FXEngine.calculateCTA(bad, 1.2, 1.1)).toThrow(InvalidFinancialInputError);
    });

    it('calculateCTA rejects invalid rates', () => {
      expect(() => FXEngine.calculateCTA(100, NaN, 1.1)).toThrow(InvalidFinancialInputError);
    });

    it('ASC 830 report assigns CTA only to monetary (net asset) lines — never to income/expense', () => {
      const report = FXEngine.generateASC830Report(
        [
          { code: '1000', name: 'Cash', category: 'monetary', localAmount: 1000 },
          { code: '1700', name: 'Fixed Assets', category: 'non-monetary', localAmount: 500 },
          { code: '4000', name: 'Revenue', category: 'income', localAmount: 2000 },
          { code: '6000', name: 'Salaries', category: 'expense', localAmount: 800 },
        ],
        'EUR',
        'USD',
        '2026'
      );
      const byCode = Object.fromEntries(report.map((r) => [r.code, r]));
      // monetary: closing 1.2 (2026-12-31) vs historical 1.3 (latest undated)
      // → 1000 * (1.2 - 1.3) = -100
      expect(byCode['1000']!.ctaAdjustment).toBeCloseTo(-100, 6);
      expect(byCode['1700']!.ctaAdjustment).toBe(0); // non-monetary: historical rate
      expect(byCode['4000']!.ctaAdjustment).toBe(0); // income: no CTA (F-0007)
      expect(byCode['6000']!.ctaAdjustment).toBe(0); // expense: no CTA (F-0007)
      // Income/expense translated at average rate, not closing.
      const avg = FXEngine.getAverageRate('EUR', 'USD', '2026');
      expect(byCode['4000']!.translatedAmount).toBeCloseTo(2000 * avg, 6);
    });
  });

  describe('calculateFXGainLoss', () => {
    it('computes gain/loss between current and historical translation', () => {
      expect(FXEngine.calculateFXGainLoss(100, 0, 1.2, 1.1)).toBeCloseTo(10, 10);
    });

    it('rejects non-finite inputs instead of returning 0', () => {
      expect(() => FXEngine.calculateFXGainLoss(NaN, 0, 1.2, 1.1)).toThrow(
        InvalidFinancialInputError
      );
      expect(() => FXEngine.calculateFXGainLoss(100, 0, Infinity, 1.1)).toThrow(
        InvalidFinancialInputError
      );
    });
  });
});
