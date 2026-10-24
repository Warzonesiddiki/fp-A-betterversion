import { describe, it, expect } from 'vitest';
import { TaxEngine } from './TaxEngine';
import type { TaxProvisionInput } from './TaxEngine';

/**
 * GOVERNANCE EVIDENCE for cap:tax.engine
 *
 * The TaxEngine computes tax provisions (ASC 740 / IAS 12) including current
 * tax, deferred tax (DTA/DTL), effective tax rate, and full provision
 * computation. The governance dimension here is CALCULATION ACCURACY —
 * tax provisions feed every income statement. All amounts must flow through
 * the decimal.js money primitive (cent-rounded, ROUND_HALF_UP). Errors in
 * tax calculation propagate to reported net income.
 *
 * Tested dimensions:
 * 1. Current tax calculation
 * 2. Deferred tax calculation (DTA/DTL)
 * 3. Effective tax rate
 * 4. Full provision computation
 * 5. Loss carryforward
 * 6. Money primitive safety
 * 7. Determinism
 */

function makeInput(overrides: Partial<TaxProvisionInput> = {}): TaxProvisionInput {
  return {
    pretaxIncome: 100000,
    permanentDifferences: [],
    temporaryDifferences: [],
    taxRate: 0.25,
    taxCredits: [],
    ...overrides,
  };
}

describe('TaxEngine — GOVERNANCE (tax.engine)', () => {
  describe('1. Current tax calculation', () => {
    it('calculateCurrentTax computes tax expense from pretax income and rate', () => {
      const result = TaxEngine.calculateCurrentTax(
        makeInput({ pretaxIncome: 100000, taxRate: 0.25 })
      );
      expect(result.currentTaxExpense).toBeCloseTo(25000, 2);
      expect(result.taxableIncome).toBeCloseTo(100000, 2);
    });

    it('calculateCurrentTax applies permanent differences', () => {
      const result = TaxEngine.calculateCurrentTax(
        makeInput({
          pretaxIncome: 100000,
          permanentDifferences: [{ description: 'Non-deductible expense', amount: 10000 }],
          taxRate: 0.25,
        })
      );
      // Taxable income = 100000 + 10000 = 110000
      expect(result.taxableIncome).toBeCloseTo(110000, 2);
      expect(result.currentTaxExpense).toBeCloseTo(27500, 2);
    });

    it('calculateCurrentTax applies tax credits', () => {
      const result = TaxEngine.calculateCurrentTax(
        makeInput({
          pretaxIncome: 100000,
          taxCredits: [{ description: 'R&D credit', amount: 5000 }],
          taxRate: 0.25,
        })
      );
      // Gross tax = 25000, after credit = 20000
      expect(result.currentTaxExpense).toBeCloseTo(20000, 2);
    });

    it('calculateCurrentTax handles zero pretax income', () => {
      const result = TaxEngine.calculateCurrentTax(makeInput({ pretaxIncome: 0, taxRate: 0.25 }));
      expect(result.currentTaxExpense).toBe(0);
    });

    it('calculateCurrentTax rejects non-finite pretax income', () => {
      expect(() => TaxEngine.calculateCurrentTax(makeInput({ pretaxIncome: NaN }))).toThrow();
      expect(() => TaxEngine.calculateCurrentTax(makeInput({ pretaxIncome: Infinity }))).toThrow();
    });
  });

  describe('2. Deferred tax calculation', () => {
    it('calculateDeferredTax computes DTA from temporary differences', () => {
      const result = TaxEngine.calculateDeferredTax(
        makeInput({
          temporaryDifferences: [
            { description: 'Warranty accrual', amount: 10000, reversalPeriod: '2027' },
          ],
          taxRate: 0.25,
        })
      );
      expect(result.deferredTaxAsset).toBeCloseTo(2500, 2);
      expect(result.deferredTaxLiability).toBeCloseTo(0, 2);
    });

    it('calculateDeferredTax computes DTL from negative temporary differences', () => {
      const result = TaxEngine.calculateDeferredTax(
        makeInput({
          temporaryDifferences: [
            { description: 'Depreciation difference', amount: -10000, reversalPeriod: '2027' },
          ],
          taxRate: 0.25,
        })
      );
      expect(result.deferredTaxLiability).toBeCloseTo(2500, 2);
      expect(result.deferredTaxAsset).toBeCloseTo(0, 2);
    });

    it('calculateDeferredTax applies valuation allowance', () => {
      const result = TaxEngine.calculateDeferredTax(
        makeInput({
          temporaryDifferences: [
            { description: 'Warranty', amount: 10000, reversalPeriod: '2027' },
          ],
          taxRate: 0.25,
          valuationAllowanceRate: 0.5,
        })
      );
      expect(result.valuationAllowance).toBeCloseTo(1250, 2);
      expect(result.netDeferredTaxAsset).toBeCloseTo(1250, 2);
    });
  });

  describe('3. Effective tax rate', () => {
    it('calculateEffectiveRate computes rate from pretax income and tax expense', () => {
      const rate = TaxEngine.calculateEffectiveRate(100000, 25000);
      expect(rate).toBeCloseTo(0.25, 4);
    });

    it('calculateEffectiveRate returns 0 for zero pretax income', () => {
      const rate = TaxEngine.calculateEffectiveRate(0, 25000);
      expect(rate).toBe(0);
    });

    it('calculateEffectiveRate handles negative pretax income (loss)', () => {
      const rate = TaxEngine.calculateEffectiveRate(-100000, -25000);
      expect(rate).toBeCloseTo(0.25, 4);
    });
  });

  describe('4. Full provision computation', () => {
    it('computeProvision combines current and deferred tax', () => {
      const result = TaxEngine.computeProvision(
        makeInput({
          pretaxIncome: 100000,
          temporaryDifferences: [
            { description: 'Warranty', amount: 10000, reversalPeriod: '2027' },
          ],
          taxRate: 0.25,
        })
      );
      // Taxable income = 100000 + 10000 = 110000, current tax = 27500
      expect(result.currentTaxExpense).toBeCloseTo(27500, 2);
      expect(result.deferredTaxExpense).toBeDefined();
      expect(result.totalTaxExpense).toBeDefined();
      expect(result.effectiveTaxRate).toBeDefined();
    });

    it('computeProvision returns jurisdiction', () => {
      const result = TaxEngine.computeProvision(makeInput({ jurisdiction: 'US-GAAP' }));
      expect(result.jurisdiction).toBe('US-GAAP');
    });
  });

  describe('5. Loss carryforward', () => {
    it('calculateCurrentTax applies loss carryforward', () => {
      const result = TaxEngine.calculateCurrentTax(
        makeInput({
          pretaxIncome: 100000,
          taxRate: 0.25,
          lossCarryforward: 30000,
        })
      );
      // Taxable income = 100000 - 30000 = 70000
      expect(result.taxableIncome).toBeCloseTo(70000, 2);
      expect(result.lossCarryforwardRemaining).toBeCloseTo(0, 2);
    });

    it('calculateCurrentTax partially uses loss carryforward', () => {
      const result = TaxEngine.calculateCurrentTax(
        makeInput({
          pretaxIncome: 100000,
          taxRate: 0.25,
          lossCarryforward: 150000,
        })
      );
      // Taxable income = 0 (fully offset)
      expect(result.taxableIncome).toBeCloseTo(0, 2);
      expect(result.lossCarryforwardRemaining).toBeCloseTo(50000, 2);
    });
  });

  describe('6. Money primitive safety', () => {
    it('calculateCurrentTax uses decimal arithmetic for large amounts', () => {
      const result = TaxEngine.calculateCurrentTax(
        makeInput({
          pretaxIncome: 999999999999.99,
          taxRate: 0.25,
        })
      );
      expect(result.currentTaxExpense).toBeCloseTo(249999999999.9975, 2);
    });

    it('calculateCurrentTax handles small fractional amounts', () => {
      const result = TaxEngine.calculateCurrentTax(
        makeInput({
          pretaxIncome: 0.01,
          taxRate: 0.25,
        })
      );
      expect(result.currentTaxExpense).toBeCloseTo(0, 2);
    });
  });

  describe('7. Determinism', () => {
    it('calculateCurrentTax is deterministic', () => {
      const r1 = TaxEngine.calculateCurrentTax(makeInput());
      const r2 = TaxEngine.calculateCurrentTax(makeInput());
      expect(r1).toEqual(r2);
    });

    it('computeProvision is deterministic', () => {
      const r1 = TaxEngine.computeProvision(makeInput());
      const r2 = TaxEngine.computeProvision(makeInput());
      expect(r1.totalTaxExpense).toBe(r2.totalTaxExpense);
      expect(r1.effectiveTaxRate).toBe(r2.effectiveTaxRate);
    });
  });
});
