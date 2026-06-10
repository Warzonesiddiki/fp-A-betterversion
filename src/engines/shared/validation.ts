export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  const errors: string[] = [];
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!Number.isFinite(value)) {
    errors.push(`${fieldName} must be a finite number`);
  } else if (value < min || value > max) {
    errors.push(`${fieldName} must be between ${min} and ${max}`);
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validatePositive(value: number, fieldName: string): ValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(value) || value <= 0) {
    errors.push(`${fieldName} must be a positive number`);
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function validateNonNegative(value: number, fieldName: string): ValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(value) || value < 0) {
    errors.push(`${fieldName} must be a non-negative number`);
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function validateOneOf<T>(value: T, allowed: T[], fieldName: string): ValidationResult {
  const errors: string[] = [];
  if (!allowed.includes(value)) {
    errors.push(`${fieldName} must be one of: ${allowed.join(', ')}`);
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function validateArrayLength(
  array: unknown[],
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];
  const length = array?.length ?? 0;
  if (length < min) {
    errors.push(`${fieldName} must have at least ${min} items`);
  }
  if (length > max) {
    errors.push(`${fieldName} must have at most ${max} items`);
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function combineValidation(...results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap((r) => r.errors);
  const warnings = results.flatMap((r) => r.warnings);
  return { valid: errors.length === 0, errors, warnings };
}
