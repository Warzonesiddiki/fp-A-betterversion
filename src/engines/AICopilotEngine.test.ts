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
  });
});
