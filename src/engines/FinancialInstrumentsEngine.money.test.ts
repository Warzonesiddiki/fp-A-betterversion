import { describe, it, expect } from 'vitest';
import { FinancialInstrumentsEngine } from './FinancialInstrumentsEngine';

describe('FinancialInstrumentsEngine (money migration)', () => {
  it('bondPrice returns exact cents', () => {
    const price = FinancialInstrumentsEngine.bondPrice(1000, 0.05, 0.05, 10, 2);
    expect(price).toBe(1000.0); // par bond
  });

  it('accruedInterest returns exact cents', () => {
    const ai = FinancialInstrumentsEngine.accruedInterest(1000, 0.06, 90, 180, 2);
    expect(ai).toBe(15.0);
  });

  it('loanPayment returns exact cents', () => {
    const pmt = FinancialInstrumentsEngine.loanPayment(100000, 0.06, 360);
    expect(pmt).toBe(599.55);
  });

  it('loanAmortization first period interest and principal are exact cents', () => {
    const schedule = FinancialInstrumentsEngine.loanAmortization(100000, 0.06, 360);
    expect(schedule[0].interest).toBe(500.0);
    expect(schedule[0].principal).toBe(99.55);
    expect(schedule[0].balance).toBe(99900.45);
  });

  it('expectedLoss returns exact cents', () => {
    const el = FinancialInstrumentsEngine.expectedLoss(0.02, 0.6, 1000000);
    expect(el).toBe(12000.0);
  });
});
