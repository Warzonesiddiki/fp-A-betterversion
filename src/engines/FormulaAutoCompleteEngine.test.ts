import { describe, it, expect } from 'vitest';
import { FormulaAutoCompleteEngine } from './FormulaAutoCompleteEngine';

describe('FormulaAutoCompleteEngine', () => {
  describe('suggest', () => {
    it('should suggest SUM for SU', () => {
      const suggestions = FormulaAutoCompleteEngine.suggest('SU');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].text).toBe('SUM');
    });

    it('should suggest VLOOKUP for VL', () => {
      const suggestions = FormulaAutoCompleteEngine.suggest('VL');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].text).toBe('VLOOKUP');
    });

    it('should suggest IF for IF', () => {
      const suggestions = FormulaAutoCompleteEngine.suggest('IF');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].text).toBe('IF');
    });

    it('should return empty for non-matching prefix', () => {
      const suggestions = FormulaAutoCompleteEngine.suggest('ZZZZ');
      expect(suggestions).toHaveLength(0);
    });

    it('should return empty for empty input', () => {
      const suggestions = FormulaAutoCompleteEngine.suggest('');
      expect(suggestions).toHaveLength(0);
    });

    it('should include category in suggestion', () => {
      const suggestions = FormulaAutoCompleteEngine.suggest('SU');
      expect(suggestions[0].category).toBeDefined();
    });

    it('should include insertText in suggestion', () => {
      const suggestions = FormulaAutoCompleteEngine.suggest('SU');
      expect(suggestions[0].insertText).toBe('SUM(');
    });

    it('should include description in suggestion', () => {
      const suggestions = FormulaAutoCompleteEngine.suggest('SU');
      expect(suggestions[0].description).toBeDefined();
    });
  });

  describe('getFunctionHelp', () => {
    it('should return help for known function', () => {
      const help = FormulaAutoCompleteEngine.getFunctionHelp('SUM');
      expect(help).not.toBeNull();
      expect(help!.syntax).toBe('SUM(number1, [number2], ...)');
      expect(help!.description).toBe('Sum of values');
      expect(help!.category).toBe('Math');
    });

    it('should return null for unknown function', () => {
      const help = FormulaAutoCompleteEngine.getFunctionHelp('ZZZZ');
      expect(help).toBeNull();
    });

    it('should be case-insensitive', () => {
      const help = FormulaAutoCompleteEngine.getFunctionHelp('sum');
      expect(help).not.toBeNull();
    });
  });

  describe('detectErrors', () => {
    it('should return no errors for valid formula', () => {
      const errors = FormulaAutoCompleteEngine.detectErrors('SUM(A1:A10)');
      expect(errors).toHaveLength(0);
    });

    it('should detect missing closing parenthesis', () => {
      const errors = FormulaAutoCompleteEngine.detectErrors('SUM(A1:A10');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.toLowerCase().includes('parenthes'))).toBe(true);
    });

    it('should detect extra closing parenthesis', () => {
      const errors = FormulaAutoCompleteEngine.detectErrors('SUM(A1:A10))');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should return empty array for empty formula', () => {
      const errors = FormulaAutoCompleteEngine.detectErrors('');
      expect(errors).toHaveLength(0);
    });
  });
});
