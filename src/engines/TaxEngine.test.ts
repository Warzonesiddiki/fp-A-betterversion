import { describe, it, expect } from 'vitest';
import { TaxEngine } from './TaxEngine';
import type { TaxProvisionInput } from './TaxEngine';

describe('TaxEngine', () => {
  describe('calculateCurrentTax', () => {
    it('should calculate current tax on positive income', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.calculateCurrentTax(input);
      expect(result.currentTaxExpense).toBe(21000);
      expect(result.taxableIncome).toBe(100000);
    });

    it('should include permanent differences in taxable income', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [{ description: 'Non-deductible fines', amount: 5000 }],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.calculateCurrentTax(input);
      expect(result.taxableIncome).toBe(105000);
      expect(result.currentTaxExpense).toBe(22050);
    });

    it('should apply tax credits to reduce current tax', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [{ description: 'R&D credit', amount: 5000 }],
      };
      const result = TaxEngine.calculateCurrentTax(input);
      expect(result.currentTaxExpense).toBe(16000);
    });

    it('should return 0 tax for zero income', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 0,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.calculateCurrentTax(input);
      expect(result.currentTaxExpense).toBe(0);
      expect(result.taxableIncome).toBe(0);
    });

    it('should return 0 tax for negative income', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: -50000,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.calculateCurrentTax(input);
      expect(result.currentTaxExpense).toBe(0);
      expect(result.taxableIncome).toBe(-50000);
    });

    it('should handle large permanent differences', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 50000,
        permanentDifferences: [{ description: 'Large addback', amount: 200000 }],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.calculateCurrentTax(input);
      expect(result.taxableIncome).toBe(250000);
      expect(result.currentTaxExpense).toBe(52500);
    });

    it('should not let tax go below 0 with large credits', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 10000,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [{ description: 'Huge credit', amount: 50000 }],
      };
      const result = TaxEngine.calculateCurrentTax(input);
      expect(result.currentTaxExpense).toBe(0);
    });

    it('should handle negative permanent differences', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [{ description: 'Tax-exempt income', amount: -10000 }],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.calculateCurrentTax(input);
      expect(result.taxableIncome).toBe(90000);
      expect(result.currentTaxExpense).toBe(18900);
    });
  });

  describe('calculateDeferredTax', () => {
    it('should calculate deferred tax liability from taxable temporary differences', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [
          { description: 'Depreciation', amount: -10000, reversalPeriod: '2025' },
        ],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.calculateDeferredTax(input);
      expect(result.deferredTaxLiability).toBe(2100);
      expect(result.deferredTaxAsset).toBe(0);
      expect(result.deferredTaxExpense).toBe(2100);
    });

    it('should calculate deferred tax asset from deductible temporary differences', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [
          { description: 'Warranty provision', amount: 5000, reversalPeriod: '2025' },
        ],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.calculateDeferredTax(input);
      expect(result.deferredTaxAsset).toBe(1050);
      expect(result.deferredTaxLiability).toBe(0);
      expect(result.deferredTaxExpense).toBe(-1050);
    });

    it('should handle multiple temporary differences', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [
          { description: 'Warranty', amount: 5000, reversalPeriod: '2025' },
          { description: 'Depreciation', amount: -3000, reversalPeriod: '2026' },
        ],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.calculateDeferredTax(input);
      expect(result.deferredTaxAsset).toBe(1050);
      expect(result.deferredTaxLiability).toBe(630);
      expect(result.deferredTaxExpense).toBe(-420);
    });

    it('should return zeros when no temporary differences', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.calculateDeferredTax(input);
      expect(result.deferredTaxAsset).toBe(0);
      expect(result.deferredTaxLiability).toBe(0);
      expect(result.deferredTaxExpense).toBe(0);
    });

    it('should handle zero tax rate', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [{ description: 'Warranty', amount: 5000, reversalPeriod: '2025' }],
        taxRate: 0,
        taxCredits: [],
      };
      const result = TaxEngine.calculateDeferredTax(input);
      expect(result.deferredTaxAsset).toBe(0);
      expect(result.deferredTaxExpense).toBe(0);
    });
  });

  describe('calculateEffectiveRate', () => {
    it('should return totalTaxExpense / pretaxIncome', () => {
      const result = TaxEngine.calculateEffectiveRate(100000, 21000);
      expect(result).toBe(0.21);
    });

    it('should return 0 for zero pretax income', () => {
      const result = TaxEngine.calculateEffectiveRate(0, 0);
      expect(result).toBe(0);
    });

    it('should return benefit rate for negative pretax income', () => {
      const result = TaxEngine.calculateEffectiveRate(-50000, -10500);
      expect(result).toBe(0.21);
    });

    it('should handle rate > 1 with low income and high tax', () => {
      const result = TaxEngine.calculateEffectiveRate(1000, 500);
      expect(result).toBe(0.5);
    });
  });

  describe('computeProvision', () => {
    it('should compute full provision for basic case', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.computeProvision(input);
      expect(result.currentTaxExpense).toBe(21000);
      expect(result.deferredTaxExpense).toBe(0);
      expect(result.totalTaxExpense).toBe(21000);
      expect(result.effectiveTaxRate).toBe(0.21);
      expect(result.taxableIncome).toBe(100000);
    });

    it('should compute provision with differences and credits', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 200000,
        permanentDifferences: [{ description: 'Meals disallowed', amount: 10000 }],
        temporaryDifferences: [{ description: 'Warranty', amount: 8000, reversalPeriod: '2025' }],
        taxRate: 0.25,
        taxCredits: [{ description: 'R&D credit', amount: 3000 }],
      };
      const result = TaxEngine.computeProvision(input);
      expect(result.taxableIncome).toBe(218000);
      expect(result.currentTaxExpense).toBe(51500);
      expect(result.deferredTaxAsset).toBe(2000);
      expect(result.deferredTaxLiability).toBe(0);
      expect(result.deferredTaxExpense).toBe(-2000);
      expect(result.totalTaxExpense).toBe(49500);
      expect(result.effectiveTaxRate).toBe(49500 / 200000);
    });

    it('should handle zero everything', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 0,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0,
        taxCredits: [],
      };
      const result = TaxEngine.computeProvision(input);
      expect(result.currentTaxExpense).toBe(0);
      expect(result.deferredTaxExpense).toBe(0);
      expect(result.totalTaxExpense).toBe(0);
      expect(result.effectiveTaxRate).toBe(0);
      expect(result.taxableIncome).toBe(0);
    });

    it('should handle loss case with deferred tax benefit', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: -50000,
        permanentDifferences: [],
        temporaryDifferences: [{ description: 'Accrual', amount: 10000, reversalPeriod: '2026' }],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.computeProvision(input);
      expect(result.currentTaxExpense).toBe(0);
      expect(result.deferredTaxAsset).toBe(2100);
      expect(result.deferredTaxExpense).toBe(-2100);
      expect(result.totalTaxExpense).toBe(-2100);
      expect(result.effectiveTaxRate).toBe(0.042);
    });

    it('should apply loss carryforward to reduce taxable income', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 80000,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
        lossCarryforward: 30000,
      };
      const result = TaxEngine.computeProvision(input);
      expect(result.taxableIncome).toBe(50000);
      expect(result.currentTaxExpense).toBe(10500);
      expect(result.lossCarryforwardRemaining).toBe(0);
    });

    it('should carry forward excess loss', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 20000,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
        lossCarryforward: 50000,
      };
      const result = TaxEngine.computeProvision(input);
      expect(result.taxableIncome).toBe(0);
      expect(result.currentTaxExpense).toBe(0);
      expect(result.lossCarryforwardRemaining).toBe(30000);
    });

    it('should apply valuation allowance to DTA', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [{ description: 'Warranty', amount: 10000, reversalPeriod: '2025' }],
        taxRate: 0.21,
        taxCredits: [],
        valuationAllowanceRate: 0.5,
      };
      const result = TaxEngine.computeProvision(input);
      expect(result.deferredTaxAsset).toBe(2100);
      expect(result.valuationAllowance).toBe(1050);
      expect(result.netDeferredTaxAsset).toBe(1050);
    });

    it('should handle jurisdiction identifier', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
        jurisdiction: 'US-Federal',
      };
      const result = TaxEngine.computeProvision(input);
      expect(result.jurisdiction).toBe('US-Federal');
    });

    it('should default jurisdiction to default', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 100000,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.computeProvision(input);
      expect(result.jurisdiction).toBe('default');
    });

    it('should round financial values to 2 decimal places', () => {
      const input: TaxProvisionInput = {
        pretaxIncome: 33333,
        permanentDifferences: [],
        temporaryDifferences: [],
        taxRate: 0.21,
        taxCredits: [],
      };
      const result = TaxEngine.computeProvision(input);
      expect(result.currentTaxExpense).toBe(6999.93);
      expect(result.effectiveTaxRate).toBe(0.21);
    });
  });
});
