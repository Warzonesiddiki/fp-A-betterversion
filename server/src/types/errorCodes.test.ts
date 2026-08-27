import { describe, expect, it } from 'vitest';
import {
  AppError,
  ERROR_CODES,
  ERROR_CODE_REGISTRY,
  errorCodeDefinition,
  errors,
} from './errorCodes.js';

describe('stable error-code registry (W0.4)', () => {
  it('has unique codes', () => {
    const ids = ERROR_CODES.map((d) => d.code);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('codes follow the FP-NNNN format and are sorted ascending', () => {
    for (const d of ERROR_CODES) {
      expect(d.code).toMatch(/^FP-\d{4}$/);
    }
    const nums = ERROR_CODES.map((d) => Number(d.code.slice(3)));
    expect([...nums].sort((a, b) => a - b)).toEqual(nums);
  });

  it('httpStatus is a valid 4xx/5xx and consistent per code', () => {
    for (const d of ERROR_CODES) {
      expect(d.httpStatus).toBeGreaterThanOrEqual(400);
      expect(d.httpStatus).toBeLessThan(600);
    }
  });

  it('registry lookup matches definitions', () => {
    expect(ERROR_CODE_REGISTRY['FP-0200'].category).toBe('tenancy');
    expect(ERROR_CODE_REGISTRY['FP-0300'].description).toContain('Three-statement gate');
  });

  it('AppError carries code, status and structured payload', () => {
    const err = new AppError('FP-0201');
    expect(err.httpStatus).toBe(403);
    expect(err.category).toBe('tenancy');
    expect(err.toPayload({ table: 'gl_entries' })).toEqual({
      error: {
        code: 'FP-0201',
        message: err.message,
        details: { table: 'gl_entries' },
      },
    });
  });

  it('AppError defaults message to the registry description', () => {
    expect(new AppError('FP-0900').message).toBe(errorCodeDefinition('FP-0900').description);
  });

  it('convenience constructors produce correct payloads', () => {
    const payload = errors.crossTenantAccess();
    expect(payload.error.code).toBe('FP-0200');
    expect(errors.balanceBreak().error.code).toBe('FP-0300');
    expect(errors.notFound().httpStatus).toBe(404);
  });
});
