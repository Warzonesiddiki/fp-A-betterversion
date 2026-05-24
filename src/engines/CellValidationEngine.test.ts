/**
 * Tests for CellValidationEngine
 * Covers: addRule, removeRule, validate, getErrors, clearErrors
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CellValidationEngine, type ValidationRule } from './CellValidationEngine';

describe('CellValidationEngine', () => {
  beforeEach(() => {
    CellValidationEngine.clearErrors();
  });

  const numericRule: ValidationRule = {
    id: 'numeric-rule',
    cellRef: 'A1',
    type: 'range',
    params: { min: 0, max: 100 },
    message: 'Must be between 0 and 100',
    severity: 'error',
    blockSave: true,
  };

  const listRule: ValidationRule = {
    id: 'list-rule',
    cellRef: 'B2',
    type: 'allowed',
    params: { values: ['USD', 'EUR', 'GBP'] },
    message: 'Must be a valid currency',
    severity: 'error',
    blockSave: true,
  };

  const requiredRule: ValidationRule = {
    id: 'required-rule',
    cellRef: 'C3',
    type: 'required',
    params: {},
    message: 'Field is required',
    severity: 'error',
    blockSave: true,
  };

  describe('addRule and validate', () => {
    it('should add range validation rule', () => {
      CellValidationEngine.addRule(numericRule);
      const result = CellValidationEngine.validate('A1', 50);
      expect(result.valid).toBe(true);
    });

    it('should fail range validation out of range', () => {
      CellValidationEngine.addRule(numericRule);
      const result = CellValidationEngine.validate('A1', 150);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate allowed list rule', () => {
      CellValidationEngine.addRule(listRule);
      const result = CellValidationEngine.validate('B2', 'USD');
      expect(result.valid).toBe(true);

      const invalidResult = CellValidationEngine.validate('B2', 'INVALID');
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate required rule', () => {
      CellValidationEngine.addRule(requiredRule);
      const result = CellValidationEngine.validate('C3', null);
      expect(result.valid).toBe(false);
    });

    it('should validate multiple rules on same cell', () => {
      const multiRequiredRule: ValidationRule = {
        id: 'multi-required',
        cellRef: 'A1',
        type: 'required',
        params: {},
        message: 'Field is required',
        severity: 'error',
        blockSave: true,
      };
      CellValidationEngine.addRule(numericRule);
      CellValidationEngine.addRule(multiRequiredRule);

      const validResult = CellValidationEngine.validate('A1', 50);
      expect(validResult.valid).toBe(true);

      const nullResult = CellValidationEngine.validate('A1', null);
      expect(nullResult.valid).toBe(false);
    });
  });

  describe('removeRule', () => {
    it('should remove a specific rule', () => {
      CellValidationEngine.addRule(numericRule);
      const requiredOnA1: ValidationRule = {
        ...requiredRule,
        id: 'required-on-a1',
        cellRef: 'A1',
      };
      CellValidationEngine.addRule(requiredOnA1);
      CellValidationEngine.removeRule('numeric-rule');
      const result = CellValidationEngine.validate('A1', 150);
      expect(result.valid).toBe(true);
    });
  });

  describe('getErrors', () => {
    it('should return accumulated errors', () => {
      CellValidationEngine.addRule(numericRule);
      CellValidationEngine.validate('A1', 150);
      CellValidationEngine.validate('A1', 200);
      const errors = CellValidationEngine.getErrors('A1');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('clearErrors', () => {
    it('should clear errors for a cell', () => {
      CellValidationEngine.addRule(numericRule);
      CellValidationEngine.validate('A1', 150);
      CellValidationEngine.clearErrors('A1');
      expect(CellValidationEngine.getErrors('A1')).toHaveLength(0);
    });
  });
});
