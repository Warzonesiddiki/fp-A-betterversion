/**
 * GAP-1 (F-0006) known-answer tests for TaxEngine's money migration.
 *
 * Tax provisioning (ASC 740 / IAS 12) figures — taxable income, carryforward
 * offsets, DTA/DTL, valuation allowance — are money. Each case is a FIXED
 * input -> EXACT expected decimal asserted with `toBe` (Object.is); the
 * pre-migration float literal is recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import { TaxEngine } from './TaxEngine';

const baseInput = () => ({
  pretaxIncome: 0,
  permanentDifferences: [] as { description: string; amount: number }[],
  temporaryDifferences: [] as {
    description: string;
    amount: number;
    reversalPeriod: string;
  }[],
  taxRate: 0.1,
  taxCredits: [] as { description: string; amount: number }[],
});

describe('TaxEngine — money known answers (GAP-1 / F-0006)', () => {
  it('sums taxable income exactly (float gave 0.6000000000000001)', () => {
    const result = TaxEngine.calculateCurrentTax({
      ...baseInput(),
      pretaxIncome: 0.1,
      permanentDifferences: [{ description: 'p', amount: 0.2 }],
      temporaryDifferences: [{ description: 't', amount: 0.3, reversalPeriod: '2027' }],
    });
    expect(result.taxableIncome).toBe(0.6);
  });

  it('offsets the loss carryforward exactly (float gave 0.19999999999999998)', () => {
    const result = TaxEngine.calculateCurrentTax({
      ...baseInput(),
      pretaxIncome: 0.3,
      lossCarryforward: 0.1,
    });
    expect(result.taxableIncome).toBe(0.2);
    expect(result.lossCarryforwardRemaining).toBe(0);
  });

  it('leaves the carryforward untouched when income is negative', () => {
    const result = TaxEngine.calculateCurrentTax({
      ...baseInput(),
      pretaxIncome: -50000,
      lossCarryforward: 20000,
    });
    expect(result.taxableIncome).toBe(-50000);
    expect(result.lossCarryforwardRemaining).toBe(20000);
    expect(result.currentTaxExpense).toBe(0);
  });

  it('rounds current tax expense to cents with credit offsets', () => {
    const result = TaxEngine.calculateCurrentTax({
      ...baseInput(),
      pretaxIncome: 100000,
      taxCredits: [{ description: 'c', amount: 5000 }],
    });
    // 100000 * 0.1 - 5000 = 5000
    expect(result.taxableIncome).toBe(100000);
    expect(result.currentTaxExpense).toBe(5000);
  });

  it('computes DTA/DTL with exact decimal multiplication', () => {
    const result = TaxEngine.calculateDeferredTax({
      ...baseInput(),
      temporaryDifferences: [
        { description: 'd1', amount: 100000, reversalPeriod: '2027' },
        { description: 'd2', amount: -60000, reversalPeriod: '2028' },
      ],
    });
    // DTA 10000, DTL 6000 -> expense = DTL - netDTA = -4000
    expect(result.deferredTaxAsset).toBe(10000);
    expect(result.deferredTaxLiability).toBe(6000);
    expect(result.deferredTaxExpense).toBe(-4000);
  });

  it('computes the valuation allowance and net DTA exactly', () => {
    const result = TaxEngine.calculateDeferredTax({
      ...baseInput(),
      temporaryDifferences: [{ description: 'd1', amount: 100000, reversalPeriod: '2027' }],
      valuationAllowanceRate: 0.5,
    });
    expect(result.deferredTaxAsset).toBe(10000);
    expect(result.valuationAllowance).toBe(5000);
    expect(result.netDeferredTaxAsset).toBe(5000);
    expect(result.deferredTaxExpense).toBe(-5000);
  });

  it('computes the effective tax rate at 4 decimal places', () => {
    expect(TaxEngine.calculateEffectiveRate(0, 0)).toBe(0);
    expect(TaxEngine.calculateEffectiveRate(100000, 21000)).toBe(0.21);
  });

  it('computes the full provision with exact totals', () => {
    const result = TaxEngine.computeProvision({
      ...baseInput(),
      pretaxIncome: 100000,
      temporaryDifferences: [{ description: 'd1', amount: -30000, reversalPeriod: '2027' }],
      taxRate: 0.3,
    });
    // taxable = 100000 + (-30000) = 70000; current 21000; DTL 9000;
    // total 30000; effective rate = 30000 / 100000 = 0.3
    expect(result.taxableIncome).toBe(70000);
    expect(result.currentTaxExpense).toBe(21000);
    expect(result.deferredTaxLiability).toBe(9000);
    expect(result.totalTaxExpense).toBe(30000);
    expect(result.effectiveTaxRate).toBe(0.3);
  });
});
