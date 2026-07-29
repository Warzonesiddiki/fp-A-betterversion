import { describe, it, expect, beforeEach } from 'vitest';
import { useFxRateStore, fxRateSelectors } from './fxRateStore';
import { actAs } from '@/test/rbacFixtures';

describe('fxRateStore', () => {
  beforeEach(() => {
    actAs('Admin');
    useFxRateStore.setState({ rates: [] });
  });

  it('should have initial empty state after reset', () => {
    expect(useFxRateStore.getState().rates).toEqual([]);
  });

  it('should set rates', () => {
    const rates = [
      { id: 'r1', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, effectiveDate: '2026-01-01' },
    ];
    useFxRateStore.getState().setRates(rates);
    expect(useFxRateStore.getState().rates).toEqual(rates);
  });

  it('should add a rate', () => {
    useFxRateStore.getState().addRate({
      id: 'r2',
      fromCurrency: 'USD',
      toCurrency: 'GBP',
      rate: 0.79,
      effectiveDate: '2026-01-01',
    });
    expect(useFxRateStore.getState().rates).toHaveLength(1);
    expect(useFxRateStore!.getState().rates[0]!.fromCurrency).toBe('USD');
  });

  it('should update a rate', () => {
    useFxRateStore.getState().addRate({
      id: 'r3',
      fromCurrency: 'EUR',
      toCurrency: 'JPY',
      rate: 155.0,
      effectiveDate: '2026-01-01',
    });
    useFxRateStore.getState().updateRate('r3', { rate: 158.5 });
    expect(useFxRateStore!.getState().rates[0]!.rate).toBe(158.5);
  });

  it('should not update non-existent rate', () => {
    useFxRateStore.getState().addRate({
      id: 'r4',
      fromCurrency: 'USD',
      toCurrency: 'CAD',
      rate: 1.36,
      effectiveDate: '2026-01-01',
    });
    useFxRateStore.getState().updateRate('nonexistent', { rate: 999 });
    expect(useFxRateStore!.getState().rates[0]!.rate).toBe(1.36);
  });

  it('should delete a rate', () => {
    useFxRateStore.getState().addRate({
      id: 'r5',
      fromCurrency: 'USD',
      toCurrency: 'CHF',
      rate: 0.88,
      effectiveDate: '2026-01-01',
    });
    useFxRateStore.getState().deleteRate('r5');
    expect(useFxRateStore.getState().rates).toHaveLength(0);
  });

  it('should select rates', () => {
    const rates = [
      { id: 'r1', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, effectiveDate: '2026-01-01' },
    ];
    useFxRateStore.setState({ rates });
    expect(fxRateSelectors.rates(useFxRateStore.getState())).toEqual(rates);
  });

  it('should select rate count', () => {
    useFxRateStore.setState({
      rates: [
        {
          id: 'r1',
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.92,
          effectiveDate: '2026-01-01',
        },
        {
          id: 'r2',
          fromCurrency: 'USD',
          toCurrency: 'GBP',
          rate: 0.79,
          effectiveDate: '2026-01-01',
        },
      ],
    });
    expect(fxRateSelectors.rateCount(useFxRateStore.getState())).toBe(2);
  });

  it('should select hasRates', () => {
    expect(fxRateSelectors.hasRates(useFxRateStore.getState())).toBe(false);
    useFxRateStore.setState({
      rates: [
        {
          id: 'r1',
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.92,
          effectiveDate: '2026-01-01',
        },
      ],
    });
    expect(fxRateSelectors.hasRates(useFxRateStore.getState())).toBe(true);
  });

  it('should find rate by currency pair', () => {
    useFxRateStore.setState({
      rates: [
        {
          id: 'r1',
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.92,
          effectiveDate: '2026-01-01',
        },
        {
          id: 'r2',
          fromCurrency: 'GBP',
          toCurrency: 'USD',
          rate: 1.27,
          effectiveDate: '2026-01-01',
        },
      ],
    });
    const find = fxRateSelectors.findRate('USD', 'EUR');
    const result = find(useFxRateStore.getState());
    expect(result).not.toBeNull();
    expect(result!.rate).toBe(0.92);
  });

  it('should return null for non-existent currency pair', () => {
    const find = fxRateSelectors.findRate('XYZ', 'ABC');
    const result = find(useFxRateStore.getState());
    expect(result).toBeNull();
  });
});
