import type { ExchangeRate } from '@/types';

export const mockExchangeRates: ExchangeRate[] = [
  // Jan 2024
  { id: 'fx-001', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, effectiveDate: '2024-01-01' },
  { id: 'fx-002', fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79, effectiveDate: '2024-01-01' },
  {
    id: 'fx-003',
    fromCurrency: 'USD',
    toCurrency: 'JPY',
    rate: 141.5,
    effectiveDate: '2024-01-01',
  },
  { id: 'fx-004', fromCurrency: 'USD', toCurrency: 'CAD', rate: 1.32, effectiveDate: '2024-01-01' },
  { id: 'fx-005', fromCurrency: 'USD', toCurrency: 'AUD', rate: 1.47, effectiveDate: '2024-01-01' },

  // Feb 2024
  { id: 'fx-006', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.93, effectiveDate: '2024-02-01' },
  { id: 'fx-007', fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.8, effectiveDate: '2024-02-01' },
  {
    id: 'fx-008',
    fromCurrency: 'USD',
    toCurrency: 'JPY',
    rate: 144.2,
    effectiveDate: '2024-02-01',
  },
  { id: 'fx-009', fromCurrency: 'USD', toCurrency: 'CAD', rate: 1.33, effectiveDate: '2024-02-01' },
  { id: 'fx-010', fromCurrency: 'USD', toCurrency: 'AUD', rate: 1.49, effectiveDate: '2024-02-01' },

  // Mar 2024
  { id: 'fx-011', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.91, effectiveDate: '2024-03-01' },
  { id: 'fx-012', fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.78, effectiveDate: '2024-03-01' },
  {
    id: 'fx-013',
    fromCurrency: 'USD',
    toCurrency: 'JPY',
    rate: 146.8,
    effectiveDate: '2024-03-01',
  },
  { id: 'fx-014', fromCurrency: 'USD', toCurrency: 'CAD', rate: 1.34, effectiveDate: '2024-03-01' },
  { id: 'fx-015', fromCurrency: 'USD', toCurrency: 'AUD', rate: 1.51, effectiveDate: '2024-03-01' },

  // Apr 2024
  { id: 'fx-016', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, effectiveDate: '2024-04-01' },
  { id: 'fx-017', fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79, effectiveDate: '2024-04-01' },
  {
    id: 'fx-018',
    fromCurrency: 'USD',
    toCurrency: 'JPY',
    rate: 151.2,
    effectiveDate: '2024-04-01',
  },
  { id: 'fx-019', fromCurrency: 'USD', toCurrency: 'CAD', rate: 1.35, effectiveDate: '2024-04-01' },
  { id: 'fx-020', fromCurrency: 'USD', toCurrency: 'AUD', rate: 1.53, effectiveDate: '2024-04-01' },

  // Inverse Cross Rates
  { id: 'fx-021', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.09, effectiveDate: '2024-01-01' },
  { id: 'fx-022', fromCurrency: 'GBP', toCurrency: 'USD', rate: 1.27, effectiveDate: '2024-01-01' },
  { id: 'fx-023', fromCurrency: 'EUR', toCurrency: 'GBP', rate: 0.86, effectiveDate: '2024-01-01' },
];

export function getExchangeRate(from: string, to: string, date: string): number {
  const rate = mockExchangeRates.find(
    (r) => r.fromCurrency === from && r.toCurrency === to && r.effectiveDate === date
  );
  return rate?.rate || 1.0;
}

export function convertCurrency(amount: number, from: string, to: string, date: string): number {
  if (from === to) return amount;
  const rate = getExchangeRate(from, to, date);
  return amount * rate;
}
