/**
 * Tests for AICopilotEngine
 * Covers: suggestFormula, explainFormula, detectFormulaError, suggestAlternative
 */
import { describe, it, expect } from 'vitest';
import { AICopilotEngine } from './AICopilotEngine';

describe('AICopilotEngine', () => {
  describe('suggestFormula', () => {
    it('should suggest SUM formula', () => {
      const result = AICopilotEngine.suggestFormula('sum of revenue');
      expect(result.formula).toContain('SUM');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should suggest growth formula', () => {
      const result = AICopilotEngine.suggestFormula('calculate growth rate');
      expect(result.formula).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should suggest variance formula', () => {
      const result = AICopilotEngine.suggestFormula('variance between actual and budget');
      expect(result.formula).toBeDefined();
    });

    it('should return empty for unknown description', () => {
      const result = AICopilotEngine.suggestFormula('xyz unknown query');
      expect(result.confidence).toBe(0);
      expect(result.formula).toBe('');
    });

    it('should include alternatives', () => {
      const result = AICopilotEngine.suggestFormula('sum of values');
      expect(result.alternatives).toBeInstanceOf(Array);
    });

    // New pattern tests
    it('should suggest CAGR formula', () => {
      const result = AICopilotEngine.suggestFormula('compound annual growth rate');
      expect(result.formula).toContain('POWER');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should suggest IRR formula', () => {
      const result = AICopilotEngine.suggestFormula('internal rate of return');
      expect(result.formula).toContain('IRR');
    });

    it('should suggest NPV formula', () => {
      const result = AICopilotEngine.suggestFormula('net present value');
      expect(result.formula).toContain('NPV');
    });

    it('should suggest margin formula', () => {
      const result = AICopilotEngine.suggestFormula('gross margin percentage');
      expect(result.formula).toContain('revenue');
      expect(result.formula).toContain('cogs');
    });

    it('should suggest depreciation formula', () => {
      const result = AICopilotEngine.suggestFormula('straight-line depreciation');
      expect(result.formula).toContain('cost');
      expect(result.formula).toContain('useful_life');
    });

    it('should suggest headcount cost formula', () => {
      const result = AICopilotEngine.suggestFormula('total headcount cost');
      expect(result.formula).toContain('headcount');
      expect(result.formula).toContain('avg_salary');
    });

    it('should suggest YTD formula', () => {
      const result = AICopilotEngine.suggestFormula('year to date sum');
      expect(result.formula).toContain('SUM');
    });

    it('should suggest moving average formula', () => {
      const result = AICopilotEngine.suggestFormula('calculate moving average');
      expect(result.formula).toContain('AVERAGE');
      expect(result.formula).toContain('OFFSET');
    });

    it('should suggest ARR formula', () => {
      const result = AICopilotEngine.suggestFormula('annual recurring revenue');
      expect(result.formula).toContain('mrr');
      expect(result.formula).toContain('12');
    });

    it('should suggest LTV formula', () => {
      const result = AICopilotEngine.suggestFormula('customer lifetime value');
      expect(result.formula).toContain('churn_rate');
    });

    it('should suggest CAC formula', () => {
      const result = AICopilotEngine.suggestFormula('customer acquisition cost');
      expect(result.formula).toContain('sales_marketing');
      expect(result.formula).toContain('new_customers');
    });

    it('should suggest fully loaded cost formula', () => {
      const result = AICopilotEngine.suggestFormula('fully loaded employee cost');
      expect(result.formula).toContain('salary');
      expect(result.formula).toContain('benefit_rate');
    });

    it('should suggest WACC formula', () => {
      const result = AICopilotEngine.suggestFormula('weighted average cost of capital');
      expect(result.formula).toContain('equity_weight');
      expect(result.formula).toContain('cost_of_debt');
    });
  });

  describe('explainFormula', () => {
    it('should explain SUM formula', () => {
      const explanation = AICopilotEngine.explainFormula('SUM(A1:A10)');
      expect(explanation).toContain('Adds');
    });

    it('should explain AVERAGE formula', () => {
      const explanation = AICopilotEngine.explainFormula('AVERAGE(B1:B10)');
      expect(explanation).toContain('mean');
    });

    it('should explain IF formula', () => {
      const explanation = AICopilotEngine.explainFormula('IF(A1>10, "yes", "no")');
      expect(explanation).toContain('condition');
    });

    it('should explain NPV formula', () => {
      const explanation = AICopilotEngine.explainFormula('NPV(0.1, A1:A5)');
      expect(explanation).toContain('net present value');
    });

    it('should explain subtraction', () => {
      const explanation = AICopilotEngine.explainFormula('A1 - B1');
      expect(explanation).toContain('Subtraction');
    });

    it('should return generic for unknown formula', () => {
      const explanation = AICopilotEngine.explainFormula('CUSTOM(A1)');
      expect(explanation).toContain('Formula');
    });

    // New explanation tests
    it('should explain SUMIF formula', () => {
      const explanation = AICopilotEngine.explainFormula('SUMIF(A:A, ">100")');
      expect(explanation).toContain('single criteria');
    });

    it('should explain IRR formula', () => {
      const explanation = AICopilotEngine.explainFormula('IRR(A1:A5)');
      expect(explanation).toContain('internal rate of return');
    });

    it('should explain VLOOKUP formula', () => {
      const explanation = AICopilotEngine.explainFormula('VLOOKUP(A1, B:C, 2, FALSE)');
      expect(explanation).toContain('Looks up');
    });

    it('should explain XLOOKUP formula', () => {
      const explanation = AICopilotEngine.explainFormula('XLOOKUP(A1, B:B, C:C)');
      expect(explanation).toContain('Flexible lookup');
    });

    it('should explain MIN formula', () => {
      const explanation = AICopilotEngine.explainFormula('MIN(A1:A10)');
      expect(explanation).toContain('smallest');
    });

    it('should explain MAX formula', () => {
      const explanation = AICopilotEngine.explainFormula('MAX(A1:A10)');
      expect(explanation).toContain('largest');
    });

    it('should explain percentage change', () => {
      const explanation = AICopilotEngine.explainFormula('(A1 - B1) / B1');
      expect(explanation).toContain('percentage');
    });
  });

  describe('detectFormulaError', () => {
    it('should detect unmatched closing parenthesis', () => {
      const errors = AICopilotEngine.detectFormulaError('SUM(A1:A10))');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors![0]!.severity).toBe('error');
    });

    it('should detect unmatched opening parenthesis', () => {
      const errors = AICopilotEngine.detectFormulaError('SUM(A1:A10');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors![0]!.message).toContain('Unmatched opening');
    });

    it('should detect invalid operator sequences', () => {
      const errors = AICopilotEngine.detectFormulaError('A1 // B1');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors![0]!.severity).toBe('warning');
    });

    it('should return empty for valid formula', () => {
      const errors = AICopilotEngine.detectFormulaError('SUM(A1:A10)');
      expect(errors).toHaveLength(0);
    });
  });

  describe('suggestAlternative', () => {
    it('should suggest AVERAGE as alternative to SUM', () => {
      const alternatives = AICopilotEngine.suggestAlternative('SUM(A1:A10)');
      expect(alternatives).toContain('AVERAGE(A1:A10)');
    });

    it('should suggest IFS as alternative to IF', () => {
      const alternatives = AICopilotEngine.suggestAlternative('IF(A1>10, "yes", "no")');
      expect(alternatives).toContain('IFS(A1>10, "yes", "no")');
    });

    it('should suggest XLOOKUP as alternative to VLOOKUP', () => {
      const alternatives = AICopilotEngine.suggestAlternative('VLOOKUP(A1, B:C, 2, FALSE)');
      expect(alternatives).toContain('XLOOKUP(A1, B:C, 2, FALSE)');
    });

    it('should suggest SUMPRODUCT as alternative to SUM', () => {
      const alternatives = AICopilotEngine.suggestAlternative('SUM(A1:A10)');
      expect(alternatives.length).toBeGreaterThan(0);
    });
  });
});
