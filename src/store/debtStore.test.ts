import { describe, it, expect, beforeEach } from 'vitest';
import { useDebtStore } from './debtStore';
import type { DebtInstrumentInput } from './debtStore';
import { actAs } from '@/test/rbacFixtures';

const instrument = (overrides: Partial<DebtInstrumentInput> = {}): DebtInstrumentInput => ({
  id: 'D-TEST',
  name: 'Test Loan',
  lender: 'Test Bank',
  displayType: 'Term Loan',
  status: 'current',
  principal: 1000000,
  rate: 0.05,
  termMonths: 60,
  startDate: '2026-01-01',
  type: 'term_loan',
  paymentFrequency: 'monthly',
  amortizationType: 'fully_amortizing',
  ...overrides,
});

describe('debtStore (GAP-NEW-A)', () => {
  beforeEach(() => {
    actAs('Admin');
    useDebtStore.setState({ instruments: [] });
  });

  it('exposes a persisted, typed instruments array', () => {
    useDebtStore.getState().addInstrument(instrument({ id: 'A' }));
    expect(useDebtStore.getState().instruments).toHaveLength(1);
    expect(useDebtStore.getState().instruments[0]!.lender).toBe('Test Bank');
  });

  it('addInstrument appends', () => {
    useDebtStore.getState().addInstrument(instrument({ id: 'A' }));
    useDebtStore.getState().addInstrument(instrument({ id: 'B' }));
    expect(useDebtStore.getState().instruments.map((i) => i.id)).toEqual(['A', 'B']);
  });

  it('updateInstrument merges partial updates by id', () => {
    useDebtStore.getState().addInstrument(instrument({ id: 'A', rate: 0.05 }));
    useDebtStore.getState().updateInstrument('A', { rate: 0.0725 });
    expect(useDebtStore.getState().instruments[0]!.rate).toBe(0.0725);
  });

  it('removeInstrument deletes by id', () => {
    useDebtStore.getState().addInstrument(instrument({ id: 'A' }));
    useDebtStore.getState().addInstrument(instrument({ id: 'B' }));
    useDebtStore.getState().removeInstrument('A');
    expect(useDebtStore.getState().instruments.map((i) => i.id)).toEqual(['B']);
  });

  it('setInstruments replaces the portfolio (reachable empty state)', () => {
    useDebtStore.getState().addInstrument(instrument({ id: 'A' }));
    useDebtStore.getState().setInstruments([]);
    expect(useDebtStore.getState().instruments).toHaveLength(0);
  });
});
