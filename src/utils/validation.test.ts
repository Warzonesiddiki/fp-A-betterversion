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
} from './validation';

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

describe('isNonEmptyString', () => {
  it('should return true for non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true);
    expect(isNonEmptyString('a')).toBe(true);
    expect(isNonEmptyString(' spaces ')).toBe(true);
  });

  it('should return false for empty or whitespace strings', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('   ')).toBe(false);
    expect(isNonEmptyString('\t')).toBe(false);
    expect(isNonEmptyString('\n')).toBe(false);
  });

  it('should return false for non-string types', () => {
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(0)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString(true)).toBe(false);
    expect(isNonEmptyString([])).toBe(false);
    expect(isNonEmptyString({})).toBe(false);
    expect(isNonEmptyString(NaN)).toBe(false);
  });
});

describe('isFiniteNumber', () => {
  it('should return true for finite numbers', () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(1)).toBe(true);
    expect(isFiniteNumber(-1)).toBe(true);
    expect(isFiniteNumber(3.14)).toBe(true);
    expect(isFiniteNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it('should return false for non-finite numbers', () => {
    expect(isFiniteNumber(NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(-Infinity)).toBe(false);
  });

  it('should return false for non-number types', () => {
    expect(isFiniteNumber(null)).toBe(false);
    expect(isFiniteNumber(undefined)).toBe(false);
    expect(isFiniteNumber('123')).toBe(false);
    expect(isFiniteNumber(true)).toBe(false);
    expect(isFiniteNumber({})).toBe(false);
  });
});

describe('isPositiveNumber', () => {
  it('should return true for positive numbers', () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(0.001)).toBe(true);
    expect(isPositiveNumber(999999)).toBe(true);
  });

  it('should return false for zero and negative', () => {
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-1)).toBe(false);
  });

  it('should return false for NaN and Infinity', () => {
    expect(isPositiveNumber(NaN)).toBe(false);
    expect(isPositiveNumber(Infinity)).toBe(false);
  });
});

describe('isNonNegativeNumber', () => {
  it('should return true for zero and positive', () => {
    expect(isNonNegativeNumber(0)).toBe(true);
    expect(isNonNegativeNumber(1)).toBe(true);
  });

  it('should return false for negative', () => {
    expect(isNonNegativeNumber(-1)).toBe(false);
  });
});

describe('isPercentage', () => {
  it('should return true for 0-100', () => {
    expect(isPercentage(0)).toBe(true);
    expect(isPercentage(50)).toBe(true);
    expect(isPercentage(100)).toBe(true);
  });

  it('should return false for out of range', () => {
    expect(isPercentage(-1)).toBe(false);
    expect(isPercentage(101)).toBe(false);
  });

  it('should return false for NaN', () => {
    expect(isPercentage(NaN)).toBe(false);
  });
});

describe('isValidDate', () => {
  it('should return true for valid date strings', () => {
    expect(isValidDate('2024-01-01')).toBe(true);
    expect(isValidDate('2024-06-15T12:00:00Z')).toBe(true);
    expect(isValidDate('Jan 1, 2024')).toBe(true);
  });

  it('should return false for invalid date strings', () => {
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('2024-13-01')).toBe(false);
  });

  it('should return false for non-string types', () => {
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
    expect(isValidDate(123)).toBe(false);
    expect(isValidDate(new Date())).toBe(false);
  });
});

describe('isValidCurrency', () => {
  it('should return true for valid 3-letter codes', () => {
    expect(isValidCurrency('USD')).toBe(true);
    expect(isValidCurrency('EUR')).toBe(true);
    expect(isValidCurrency('GBP')).toBe(true);
    expect(isValidCurrency('JPY')).toBe(true);
  });

  it('should return false for invalid formats', () => {
    expect(isValidCurrency('usd')).toBe(false); // lowercase
    expect(isValidCurrency('US')).toBe(false); // too short
    expect(isValidCurrency('USDX')).toBe(false); // too long
    expect(isValidCurrency('123')).toBe(false); // digits
    expect(isValidCurrency('')).toBe(false);
  });

  it('should return false for non-string types', () => {
    expect(isValidCurrency(null)).toBe(false);
    expect(isValidCurrency(undefined)).toBe(false);
    expect(isValidCurrency(123)).toBe(false);
  });
});

describe('isValidAccountCode', () => {
  it('should return true for valid codes', () => {
    expect(isValidAccountCode('A1')).toBe(true);
    expect(isValidAccountCode('REVENUE-001')).toBe(true);
    expect(isValidAccountCode('abc')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isValidAccountCode('')).toBe(false);
  });

  it('should return false for codes longer than 20 chars', () => {
    expect(isValidAccountCode('A'.repeat(21))).toBe(false);
  });

  it('should return false for special characters', () => {
    expect(isValidAccountCode('account@1')).toBe(false);
    expect(isValidAccountCode('account 1')).toBe(false);
  });
});

describe('isValidPeriod', () => {
  it('should return true for YYYY format', () => {
    expect(isValidPeriod('2024')).toBe(true);
  });

  it('should return true for YYYY-QN format', () => {
    expect(isValidPeriod('2024-Q1')).toBe(true);
    expect(isValidPeriod('2024-Q4')).toBe(true);
  });

  it('should return true for YYYY-MM format', () => {
    expect(isValidPeriod('2024-01')).toBe(true);
    expect(isValidPeriod('2024-12')).toBe(true);
  });

  it('should return true for YYYY-WNN format', () => {
    expect(isValidPeriod('2024-W01')).toBe(true);
    expect(isValidPeriod('2024-W52')).toBe(true);
  });

  it('should return false for invalid formats', () => {
    expect(isValidPeriod('24')).toBe(false);
    expect(isValidPeriod('2024-Q5')).toBe(false);
    expect(isValidPeriod('abc')).toBe(false);
  });

  it('should accept YYYY-MM format (does not validate month range)', () => {
    // The regex allows any 2-digit number after YYYY-
    expect(isValidPeriod('2024-13')).toBe(true);
    expect(isValidPeriod('2024-00')).toBe(true);
  });
});

describe('isNonEmptyArray', () => {
  it('should return true for non-empty arrays', () => {
    expect(isNonEmptyArray([1])).toBe(true);
    expect(isNonEmptyArray([1, 2, 3])).toBe(true);
  });

  it('should return false for empty array', () => {
    expect(isNonEmptyArray([])).toBe(false);
  });

  it('should return false for non-arrays', () => {
    expect(isNonEmptyArray(null)).toBe(false);
    expect(isNonEmptyArray(undefined)).toBe(false);
    expect(isNonEmptyArray('string')).toBe(false);
    expect(isNonEmptyArray(123)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ValidationResult helpers
// ---------------------------------------------------------------------------

describe('createValidationResult', () => {
  it('should create a valid result with empty arrays', () => {
    const result = createValidationResult();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});

describe('addError', () => {
  it('should add error and set valid to false', () => {
    const result = createValidationResult();
    addError(result, 'Something broke');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Something broke');
  });

  it('should accumulate multiple errors', () => {
    const result = createValidationResult();
    addError(result, 'Error 1');
    addError(result, 'Error 2');

    expect(result.errors).toHaveLength(2);
  });
});

describe('addWarning', () => {
  it('should add warning without changing valid', () => {
    const result = createValidationResult();
    addWarning(result, 'Heads up');

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Heads up');
  });
});

// ---------------------------------------------------------------------------
// Financial Validation
// ---------------------------------------------------------------------------

describe('validateFinancialNumber', () => {
  it('should pass for valid numbers', () => {
    const result = validateFinancialNumber(100, 'amount');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail for non-finite numbers', () => {
    expect(validateFinancialNumber(NaN, 'amount').valid).toBe(false);
    expect(validateFinancialNumber(Infinity, 'amount').valid).toBe(false);
    expect(validateFinancialNumber('abc' as any, 'amount').valid).toBe(false);
  });

  it('should fail when zero is not allowed', () => {
    const result = validateFinancialNumber(0, 'amount', { allowZero: false });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('cannot be zero');
  });

  it('should fail when negative is not allowed', () => {
    const result = validateFinancialNumber(-5, 'amount', { allowNegative: false });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('cannot be negative');
  });

  it('should fail when below min', () => {
    const result = validateFinancialNumber(5, 'amount', { min: 10 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('>= 10');
  });

  it('should fail when above max', () => {
    const result = validateFinancialNumber(100, 'amount', { max: 50 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('<= 50');
  });

  it('should pass for zero when allowed', () => {
    const result = validateFinancialNumber(0, 'amount', { allowZero: true });
    expect(result.valid).toBe(true);
  });

  it('should pass for negative when allowed', () => {
    const result = validateFinancialNumber(-5, 'amount', { allowNegative: true });
    expect(result.valid).toBe(true);
  });
});

describe('validatePercentage', () => {
  it('should pass for valid percentages', () => {
    expect(validatePercentage(0).valid).toBe(true);
    expect(validatePercentage(50).valid).toBe(true);
    expect(validatePercentage(100).valid).toBe(true);
  });

  it('should fail for out-of-range values', () => {
    expect(validatePercentage(-1).valid).toBe(false);
    expect(validatePercentage(101).valid).toBe(false);
  });

  it('should fail for non-finite values', () => {
    expect(validatePercentage(NaN).valid).toBe(false);
    expect(validatePercentage(Infinity).valid).toBe(false);
    expect(validatePercentage('abc' as any).valid).toBe(false);
  });

  it('should use custom field name', () => {
    const result = validatePercentage(150, 'taxRate');
    expect(result.errors[0]).toContain('taxRate');
  });
});

describe('validateOwnershipPercentage', () => {
  it('should pass for valid values', () => {
    expect(validateOwnershipPercentage(0).valid).toBe(true);
    expect(validateOwnershipPercentage(100).valid).toBe(true);
    expect(validateOwnershipPercentage(50.5).valid).toBe(true);
  });

  it('should fail for out-of-range', () => {
    expect(validateOwnershipPercentage(-1).valid).toBe(false);
    expect(validateOwnershipPercentage(101).valid).toBe(false);
  });

  it('should fail for non-numbers', () => {
    expect(validateOwnershipPercentage('half' as any).valid).toBe(false);
  });
});

describe('validateDateRange', () => {
  it('should pass for valid range', () => {
    const result = validateDateRange('2024-01-01', '2024-12-31');
    expect(result.valid).toBe(true);
  });

  it('should fail for invalid start date', () => {
    const result = validateDateRange('invalid', '2024-12-31');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('start date');
  });

  it('should fail for invalid end date', () => {
    const result = validateDateRange('2024-01-01', 'invalid');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('end date');
  });

  it('should fail when start is after end', () => {
    const result = validateDateRange('2024-12-31', '2024-01-01');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('start date must be before end date');
  });

  it('should allow same start and end date', () => {
    const result = validateDateRange('2024-06-15', '2024-06-15');
    expect(result.valid).toBe(true);
  });
});

describe('validateEntity', () => {
  it('should pass for valid entity', () => {
    const entity = {
      entityId: 'e1',
      entityName: 'Acme Corp',
      currency: 'USD',
      entries: [],
    };
    expect(validateEntity(entity).valid).toBe(true);
  });

  it('should fail for null', () => {
    expect(validateEntity(null).valid).toBe(false);
  });

  it('should fail for non-object', () => {
    expect(validateEntity('string').valid).toBe(false);
  });

  it('should fail for missing fields', () => {
    const result = validateEntity({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should fail for invalid currency', () => {
    const entity = {
      entityId: 'e1',
      entityName: 'Acme',
      currency: 'invalid',
      entries: [],
    };
    const result = validateEntity(entity);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('currency'))).toBe(true);
  });
});

describe('validateGLEntry', () => {
  it('should pass for valid entry', () => {
    const entry = { accountCode: 'REV-001', debit: 100, credit: 0 };
    expect(validateGLEntry(entry).valid).toBe(true);
  });

  it('should fail for null', () => {
    expect(validateGLEntry(null).valid).toBe(false);
  });

  it('should fail for missing fields', () => {
    const result = validateGLEntry({});
    expect(result.valid).toBe(false);
  });

  it('should fail when both debit and credit are negative', () => {
    const entry = { accountCode: 'X', debit: -10, credit: -5 };
    const result = validateGLEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('both be negative'))).toBe(true);
  });
});

describe('validateAllocationRule', () => {
  it('should pass for valid rule', () => {
    const rule = {
      id: 'r1',
      name: 'Test Rule',
      sourceAccount: 'OVR',
      targets: [
        { account: 'A', percentage: 60 },
        { account: 'B', percentage: 40 },
      ],
    };
    expect(validateAllocationRule(rule).valid).toBe(true);
  });

  it('should fail for null', () => {
    expect(validateAllocationRule(null).valid).toBe(false);
  });

  it('should fail for empty targets', () => {
    const rule = { id: 'r1', name: 'Test', sourceAccount: 'X', targets: [] };
    expect(validateAllocationRule(rule).valid).toBe(false);
  });

  it('should fail when percentages do not sum to 100', () => {
    const rule = {
      id: 'r1',
      name: 'Test',
      sourceAccount: 'X',
      targets: [
        { account: 'A', percentage: 30 },
        { account: 'B', percentage: 30 },
      ],
    };
    const result = validateAllocationRule(rule);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('sum to 100'))).toBe(true);
  });
});

describe('validateOwnershipStructure', () => {
  it('should pass for valid structure', () => {
    const structure = {
      parentId: 'p1',
      childId: 'c1',
      ownershipPct: 80,
      method: 'full',
    };
    expect(validateOwnershipStructure(structure).valid).toBe(true);
  });

  it('should fail when parentId equals childId', () => {
    const structure = {
      parentId: 'same',
      childId: 'same',
      ownershipPct: 100,
      method: 'full',
    };
    const result = validateOwnershipStructure(structure);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('cannot be the same'))).toBe(true);
  });

  it('should fail for invalid method', () => {
    const structure = {
      parentId: 'p1',
      childId: 'c1',
      ownershipPct: 50,
      method: 'invalid',
    };
    const result = validateOwnershipStructure(structure);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('method'))).toBe(true);
  });

  it('should accept all valid methods', () => {
    for (const method of ['full', 'equity', 'cost']) {
      const structure = { parentId: 'p1', childId: 'c1', ownershipPct: 50, method };
      const result = validateOwnershipStructure(structure);
      expect(result.errors.filter((e) => e.includes('method'))).toHaveLength(0);
    }
  });
});

describe('validateScenarioDriver', () => {
  it('should pass for valid driver', () => {
    const driver = {
      id: 'd1',
      name: 'Revenue Growth',
      type: 'revenue',
      impactType: 'percentage',
      value: 5,
    };
    expect(validateScenarioDriver(driver).valid).toBe(true);
  });

  it('should fail for invalid type', () => {
    const driver = { id: 'd1', name: 'Test', type: 'invalid', impactType: 'percentage', value: 5 };
    const result = validateScenarioDriver(driver);
    expect(result.valid).toBe(false);
  });

  it('should fail for invalid impactType', () => {
    const driver = { id: 'd1', name: 'Test', type: 'revenue', impactType: 'invalid', value: 5 };
    const result = validateScenarioDriver(driver);
    expect(result.valid).toBe(false);
  });

  it('should accept all valid types', () => {
    for (const type of ['revenue', 'expense', 'headcount', 'margin']) {
      const driver = { id: 'd1', name: 'Test', type, impactType: 'percentage', value: 5 };
      const result = validateScenarioDriver(driver);
      expect(result.errors.filter((e) => e.includes('Driver type'))).toHaveLength(0);
    }
  });
});

describe('validateBudget', () => {
  it('should pass for valid budget', () => {
    expect(validateBudget({ name: 'FY2024 Budget' }).valid).toBe(true);
  });

  it('should fail for null', () => {
    expect(validateBudget(null).valid).toBe(false);
  });

  it('should fail for empty name', () => {
    expect(validateBudget({ name: '' }).valid).toBe(false);
  });

  it('should fail for name over 200 chars', () => {
    expect(validateBudget({ name: 'A'.repeat(201) }).valid).toBe(false);
  });

  it('should pass for name at exactly 200 chars', () => {
    expect(validateBudget({ name: 'A'.repeat(200) }).valid).toBe(true);
  });
});

describe('validateForecast', () => {
  it('should pass for valid forecast', () => {
    expect(validateForecast({ name: 'Q1 Forecast' }).valid).toBe(true);
  });

  it('should fail for null', () => {
    expect(validateForecast(null).valid).toBe(false);
  });

  it('should fail for empty name', () => {
    expect(validateForecast({ name: '' }).valid).toBe(false);
  });
});

describe('validateMonteCarloConfig', () => {
  it('should pass for valid config', () => {
    expect(validateMonteCarloConfig({ iterations: 1000 }).valid).toBe(true);
  });

  it('should fail for null', () => {
    expect(validateMonteCarloConfig(null).valid).toBe(false);
  });

  it('should fail for non-positive iterations', () => {
    expect(validateMonteCarloConfig({ iterations: 0 }).valid).toBe(false);
    expect(validateMonteCarloConfig({ iterations: -1 }).valid).toBe(false);
  });

  it('should warn for iterations > 1,000,000', () => {
    const result = validateMonteCarloConfig({ iterations: 2000000 });
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('validateBatch', () => {
  it('should combine multiple valid results', () => {
    const result = validateBatch([createValidationResult(), createValidationResult()]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should combine errors from invalid results', () => {
    const r1 = createValidationResult();
    addError(r1, 'Error 1');
    const r2 = createValidationResult();
    addError(r2, 'Error 2');

    const result = validateBatch([r1, r2]);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('should combine warnings', () => {
    const r1 = createValidationResult();
    addWarning(r1, 'Warn 1');
    const r2 = createValidationResult();
    addWarning(r2, 'Warn 2');

    const result = validateBatch([r1, r2]);
    expect(result.warnings).toHaveLength(2);
  });

  it('should handle empty array', () => {
    const result = validateBatch([]);
    expect(result.valid).toBe(true);
  });
});

describe('validateRequired', () => {
  it('should pass for non-null values', () => {
    expect(validateRequired('hello', 'field').valid).toBe(true);
    expect(validateRequired(0, 'field').valid).toBe(true);
    expect(validateRequired(false, 'field').valid).toBe(true);
  });

  it('should fail for null', () => {
    const result = validateRequired(null, 'username');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('username');
    expect(result.errors[0]).toContain('required');
  });

  it('should fail for undefined', () => {
    expect(validateRequired(undefined, 'field').valid).toBe(false);
  });

  it('should fail for empty string', () => {
    const result = validateRequired('', 'email');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('empty');
  });

  it('should fail for whitespace-only string', () => {
    expect(validateRequired('   ', 'field').valid).toBe(false);
  });
});

describe('validateNonEmptyArray', () => {
  it('should pass for non-empty arrays', () => {
    expect(validateNonEmptyArray([1, 2, 3], 'items').valid).toBe(true);
  });

  it('should fail for empty array', () => {
    const result = validateNonEmptyArray([], 'items');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('empty');
  });

  it('should fail for non-arrays', () => {
    const result = validateNonEmptyArray('not array', 'items');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('must be an array');
  });
});
