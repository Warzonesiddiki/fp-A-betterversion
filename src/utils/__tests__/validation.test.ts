import { describe, it, expect } from 'vitest';
import {
  isNonEmptyString,
  isFiniteNumber,
  isPositiveNumber,
  isNonNegativeNumber,
  isPercentage,
  isValidDate,
  isValidCurrency,
  isValidAccountCode,
  isValidPeriod,
  isNonEmptyArray,
  createValidationResult,
  addError,
  addWarning,
  validateFinancialNumber,
  validatePercentage,
  validateOwnershipPercentage,
  validateDateRange,
  validateEntity,
  validateGLEntry,
  validateAllocationRule,
  validateOwnershipStructure,
  validateScenarioDriver,
  validateBudget,
  validateForecast,
  validateMonteCarloConfig,
  validateBatch,
  validateRequired,
  validateNonEmptyArray,
} from '../validation';

describe('validation', () => {
  describe('type guards', () => {
    it('isNonEmptyString', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('  ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
    });

    it('isFiniteNumber', () => {
      expect(isFiniteNumber(42)).toBe(true);
      expect(isFiniteNumber(Infinity)).toBe(false);
      expect(isFiniteNumber(NaN)).toBe(false);
      expect(isFiniteNumber('42')).toBe(false);
    });

    it('isPositiveNumber', () => {
      expect(isPositiveNumber(10)).toBe(true);
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
    });

    it('isNonNegativeNumber', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(10)).toBe(true);
      expect(isNonNegativeNumber(-1)).toBe(false);
    });

    it('isPercentage', () => {
      expect(isPercentage(50)).toBe(true);
      expect(isPercentage(0)).toBe(true);
      expect(isPercentage(100)).toBe(true);
      expect(isPercentage(150)).toBe(false);
      expect(isPercentage(-1)).toBe(false);
    });

    it('isValidDate', () => {
      expect(isValidDate('2026-01-15')).toBe(true);
      expect(isValidDate('not-a-date')).toBe(false);
      expect(isValidDate(123)).toBe(false);
    });

    it('isValidCurrency', () => {
      expect(isValidCurrency('USD')).toBe(true);
      expect(isValidCurrency('eur')).toBe(false);
      expect(isValidCurrency('US')).toBe(false);
    });

    it('isValidAccountCode', () => {
      expect(isValidAccountCode('ACC-001')).toBe(true);
      expect(isValidAccountCode('')).toBe(false);
      expect(isValidAccountCode('A'.repeat(25))).toBe(false);
    });

    it('isValidPeriod', () => {
      expect(isValidPeriod('2026')).toBe(true);
      expect(isValidPeriod('2026-Q1')).toBe(true);
      expect(isValidPeriod('2026-01')).toBe(true);
      expect(isValidPeriod('invalid')).toBe(false);
    });

    it('isNonEmptyArray', () => {
      expect(isNonEmptyArray([1])).toBe(true);
      expect(isNonEmptyArray([])).toBe(false);
      expect(isNonEmptyArray(null)).toBe(false);
    });
  });

  describe('ValidationResult helpers', () => {
    it('createValidationResult returns valid', () => {
      const r = createValidationResult();
      expect(r.valid).toBe(true);
      expect(r.errors).toEqual([]);
      expect(r.warnings).toEqual([]);
    });

    it('addError marks invalid and adds message', () => {
      const r = createValidationResult();
      addError(r, 'test error');
      expect(r.valid).toBe(false);
      expect(r.errors).toEqual(['test error']);
    });

    it('addWarning adds warning', () => {
      const r = createValidationResult();
      addWarning(r, 'test warning');
      expect(r.valid).toBe(true);
      expect(r.warnings).toEqual(['test warning']);
    });
  });

  describe('validateFinancialNumber', () => {
    it('validates number', () => {
      expect(validateFinancialNumber(100, 'value').valid).toBe(true);
    });

    it('rejects non-numbers', () => {
      expect(validateFinancialNumber('abc', 'value').valid).toBe(false);
    });

    it('rejects zero when not allowed', () => {
      expect(validateFinancialNumber(0, 'value', { allowZero: false }).valid).toBe(false);
    });

    it('rejects negative when not allowed', () => {
      expect(validateFinancialNumber(-5, 'value', { allowNegative: false }).valid).toBe(false);
    });

    it('enforces min/max bounds', () => {
      expect(validateFinancialNumber(200, 'value', { min: 0, max: 100 }).valid).toBe(false);
    });
  });

  describe('validatePercentage', () => {
    it('validates valid percentage', () => {
      expect(validatePercentage(50).valid).toBe(true);
    });

    it('rejects out of range', () => {
      expect(validatePercentage(150).valid).toBe(false);
    });
  });

  describe('validateOwnershipPercentage', () => {
    it('validates valid percentage', () => {
      expect(validateOwnershipPercentage(75).valid).toBe(true);
    });

    it('rejects out of range', () => {
      expect(validateOwnershipPercentage(101).valid).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    it('validates valid range', () => {
      expect(validateDateRange('2026-01-01', '2026-12-31').valid).toBe(true);
    });

    it('rejects inverted dates', () => {
      expect(validateDateRange('2026-12-31', '2026-01-01').valid).toBe(false);
    });

    it('rejects invalid dates', () => {
      expect(validateDateRange('bad', '2026-01-01').valid).toBe(false);
    });
  });

  describe('validateEntity', () => {
    it('validates valid entity', () => {
      const r = validateEntity({
        entityId: 'ent-1',
        entityName: 'Test Entity',
        currency: 'USD',
        entries: [],
      });
      expect(r.valid).toBe(true);
    });

    it('rejects invalid entity', () => {
      expect(validateEntity(null).valid).toBe(false);
      expect(validateEntity({}).valid).toBe(false);
    });
  });

  describe('validateGLEntry', () => {
    it('validates valid GL entry', () => {
      const r = validateGLEntry({ accountCode: 'ACC-001', debit: 100, credit: 0 });
      expect(r.valid).toBe(true);
    });

    it('rejects entry with both negative', () => {
      const r = validateGLEntry({ accountCode: 'ACC-001', debit: -100, credit: -50 });
      expect(r.valid).toBe(false);
    });
  });

  describe('validateAllocationRule', () => {
    it('validates valid allocation rule', () => {
      const r = validateAllocationRule({
        id: 'rule-1',
        name: 'Test Rule',
        sourceAccount: 'ACC-001',
        targets: [{ percentage: 60 }, { percentage: 40 }],
      });
      expect(r.valid).toBe(true);
    });

    it('rejects percentages not summing to 100', () => {
      const r = validateAllocationRule({
        id: 'rule-1',
        name: 'Test Rule',
        sourceAccount: 'ACC-001',
        targets: [{ percentage: 50 }],
      });
      expect(r.valid).toBe(false);
    });
  });

  describe('validateOwnershipStructure', () => {
    it('validates valid structure', () => {
      const r = validateOwnershipStructure({
        parentId: 'parent-1',
        childId: 'child-1',
        ownershipPct: 75,
        method: 'full',
      });
      expect(r.valid).toBe(true);
    });

    it('rejects same parent and child', () => {
      const r = validateOwnershipStructure({
        parentId: 'same',
        childId: 'same',
        ownershipPct: 100,
        method: 'full',
      });
      expect(r.valid).toBe(false);
    });
  });

  describe('validateScenarioDriver', () => {
    it('validates valid driver', () => {
      const r = validateScenarioDriver({
        id: 'driver-1',
        name: 'Revenue Growth',
        type: 'revenue',
        impactType: 'percentage',
        value: 10,
      });
      expect(r.valid).toBe(true);
    });

    it('rejects invalid type', () => {
      const r = validateScenarioDriver({
        id: 'driver-1',
        name: 'Test',
        type: 'invalid',
        impactType: 'percentage',
        value: 10,
      });
      expect(r.valid).toBe(false);
    });
  });

  describe('validateBudget', () => {
    it('validates valid budget', () => {
      expect(validateBudget({ name: 'Budget 2026' }).valid).toBe(true);
    });

    it('rejects long name', () => {
      expect(validateBudget({ name: 'A'.repeat(201) }).valid).toBe(false);
    });
  });

  describe('validateForecast', () => {
    it('validates valid forecast', () => {
      expect(validateForecast({ name: 'Forecast Q1' }).valid).toBe(true);
    });
  });

  describe('validateMonteCarloConfig', () => {
    it('validates valid config', () => {
      expect(validateMonteCarloConfig({ iterations: 10000 }).valid).toBe(true);
    });

    it('warns on many iterations', () => {
      const r = validateMonteCarloConfig({ iterations: 2000000 });
      expect(r.valid).toBe(true);
      expect(r.warnings).toHaveLength(1);
    });
  });

  describe('validateBatch', () => {
    it('aggregates results', () => {
      const r = validateBatch([
        createValidationResult(),
        validateFinancialNumber(-1, 'val', { allowNegative: false }),
      ]);
      expect(r.valid).toBe(false);
      expect(r.errors).toHaveLength(1);
    });
  });

  describe('validateRequired', () => {
    it('accepts present value', () => {
      expect(validateRequired('hello', 'name').valid).toBe(true);
    });

    it('rejects null', () => {
      expect(validateRequired(null, 'name').valid).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validateRequired('', 'name').valid).toBe(false);
    });
  });

  describe('validateNonEmptyArray', () => {
    it('validates non-empty array', () => {
      expect(validateNonEmptyArray([1], 'items').valid).toBe(true);
    });

    it('rejects empty array', () => {
      expect(validateNonEmptyArray([], 'items').valid).toBe(false);
    });

    it('rejects non-array', () => {
      expect(validateNonEmptyArray(null, 'items').valid).toBe(false);
    });
  });
});
