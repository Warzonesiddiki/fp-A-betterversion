import { describe, it, expect } from 'vitest';
import { TaxEngine, type TaxProvisionInput } from './TaxEngine';

/**
 * Phase 8 gate (checklist row 16): provision validation —
 * current + deferred = total, every component hand-computed.
 */

const BASE: TaxProvisionInput = {
  pretaxIncome: 1000000,
  permanentDifferences: [{ description: 'Non-deductible fines', amount: 50000 }],
  temporaryDifferences: [
    { description: 'Accelerated tax depreciation', amount: -20000, reversalPeriod: '2027' },
  ],
  taxRate: 0.25,
  taxCredits: [{ description: 'R&D credit', amount: 10000 }],
};

describe('TaxEngine provision validation', () => {
  it('current + deferred = total, hand-computed', () => {
    const r = TaxEngine.computeProvision(BASE);
    // Taxable: 1,000,000 + 50,000 - 20,000 = 1,030,000
    expect(r.taxableIncome).toBe(1030000);
    // Current: 1,030,000 x 25% - 10,000 credits = 247,500
    expect(r.currentTaxExpense).toBe(247500);
    // Deferred: -20,000 x 25% -> DTL 5,000, expense 5,000
    expect(r.deferredTaxLiability).toBe(5000);
    expect(r.deferredTaxExpense).toBe(5000);
    expect(r.totalTaxExpense).toBe(252500);
    expect(r.currentTaxExpense + r.deferredTaxExpense).toBe(r.totalTaxExpense);
    expect(r.effectiveTaxRate).toBe(0.2525);
  });

  it('deductible differences create a DTA reduced by the valuation allowance', () => {
    const r = TaxEngine.computeProvision({
      ...BASE,
      temporaryDifferences: [
        { description: 'Warranty accrual', amount: 40000, reversalPeriod: '2027' },
      ],
      valuationAllowanceRate: 0.5,
    });
    expect(r.deferredTaxAsset).toBe(10000);
    expect(r.valuationAllowance).toBe(5000);
    expect(r.netDeferredTaxAsset).toBe(5000);
    expect(r.deferredTaxExpense).toBe(-5000); // benefit
    // Taxable 1,090,000 -> current 272,500 - 10,000 = 262,500
    expect(r.currentTaxExpense).toBe(262500);
    expect(r.totalTaxExpense).toBe(257500);
  });

  it('loss carryforwards offset taxable income and carry the remainder', () => {
    const r = TaxEngine.computeProvision({
      pretaxIncome: 100000,
      permanentDifferences: [],
      temporaryDifferences: [],
      taxRate: 0.25,
      taxCredits: [],
      lossCarryforward: 150000,
    });
    expect(r.taxableIncome).toBe(0);
    expect(r.currentTaxExpense).toBe(0);
    expect(r.lossCarryforwardRemaining).toBe(50000);
  });
});
