import { describe, it, expect } from 'vitest';
import { mockExchangeRates, getExchangeRate, convertCurrency } from './exchangeRates';

describe('mockData exchangeRates', () => {
  it('provides a non-empty list of well-formed rates', () => {
    expect(mockExchangeRates.length).toBeGreaterThan(20);
    for (const r of mockExchangeRates) {
      expect(r.fromCurrency).toBeTruthy();
      expect(r.toCurrency).toBeTruthy();
      expect(r.rate).toBeGreaterThan(0);
      expect(r.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    // unique ids
    expect(new Set(mockExchangeRates.map((r) => r.id)).size).toBe(mockExchangeRates.length);
  });

  it('covers USD pairs across the four months', () => {
    for (const month of ['2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01']) {
      for (const ccy of ['EUR', 'GBP', 'JPY', 'CAD', 'AUD']) {
        expect(getExchangeRate('USD', ccy, month)).toBeGreaterThan(0);
      }
    }
  });

  it('getExchangeRate returns the exact rate for a known pair/date', () => {
    expect(getExchangeRate('USD', 'EUR', '2024-01-01')).toBe(0.92);
    expect(getExchangeRate('USD', 'JPY', '2024-03-01')).toBe(146.8);
    expect(getExchangeRate('EUR', 'GBP', '2024-01-01')).toBe(0.86);
  });

  it('getExchangeRate falls back to 1.0 for unknown pairs/dates', () => {
    expect(getExchangeRate('USD', 'EUR', '2024-05-01')).toBe(1.0);
    expect(getExchangeRate('USD', 'ZAR', '2024-01-01')).toBe(1.0);
    expect(getExchangeRate('JPY', 'USD', '2024-01-01')).toBe(1.0);
    expect(getExchangeRate('', '', '')).toBe(1.0);
  });

  it('convertCurrency returns the amount unchanged when currencies match', () => {
    expect(convertCurrency(100, 'USD', 'USD', '2024-01-01')).toBe(100);
    expect(convertCurrency(-42.5, 'EUR', 'EUR', '2024-06-01')).toBe(-42.5);
    expect(convertCurrency(0, 'USD', 'JPY', '2024-01-01')).toBe(0);
  });

  it('convertCurrency multiplies by the found rate', () => {
    expect(convertCurrency(1000, 'USD', 'EUR', '2024-01-01')).toBe(920);
    expect(convertCurrency(1000, 'USD', 'JPY', '2024-04-01')).toBe(151200);
    expect(convertCurrency(200, 'EUR', 'GBP', '2024-01-01')).toBe(172);
  });

  it('convertCurrency applies the 1.0 fallback when the rate is missing', () => {
    expect(convertCurrency(50, 'USD', 'ZAR', '2024-01-01')).toBe(50);
    expect(convertCurrency(50, 'USD', 'EUR', '2030-01-01')).toBe(50);
  });

  it('contains both directions for EUR/USD and GBP/USD', () => {
    expect(getExchangeRate('EUR', 'USD', '2024-01-01')).toBe(1.09);
    expect(getExchangeRate('GBP', 'USD', '2024-01-01')).toBe(1.27);
  });
});
