// =============================================================================
// VALIDATION UTILITIES — Input Validation for FinPlan Pro
// Pure TypeScript, deterministic, zero external dependencies
// =============================================================================

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

export function isPercentage(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 100;
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export function isValidCurrency(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[A-Z]{3}$/.test(value);
}

export function isValidAccountCode(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[A-Z0-9-]+$/i.test(value) && value.length >= 1 && value.length <= 20;
}

export function isValidPeriod(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  // Match YYYY, YYYY-QN, YYYY-MM, YYYY-WNN formats
  return /^\d{4}(-Q[1-4])?(-\d{2})?(-W\d{2})?$/.test(value);
}

export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

// ---------------------------------------------------------------------------
// Financial Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function createValidationResult(): ValidationResult {
  return { valid: true, errors: [], warnings: [] };
}

export function addError(result: ValidationResult, message: string): void {
  result.valid = false;
  result.errors.push(message);
}

export function addWarning(result: ValidationResult, message: string): void {
  result.warnings.push(message);
}

// ---------------------------------------------------------------------------
// Financial Number Validation
// ---------------------------------------------------------------------------

export function validateFinancialNumber(
  value: unknown,
  fieldName: string,
  options: {
    allowZero?: boolean;
    allowNegative?: boolean;
    min?: number;
    max?: number;
  } = {}
): ValidationResult {
  const result = createValidationResult();
  const { allowZero = true, allowNegative = true, min, max } = options;

  if (!isFiniteNumber(value)) {
    addError(result, `${fieldName} must be a finite number, got ${String(value)}`);
    return result;
  }

  if (!allowZero && value === 0) {
    addError(result, `${fieldName} cannot be zero`);
  }

  if (!allowNegative && value < 0) {
    addError(result, `${fieldName} cannot be negative, got ${value}`);
  }

  if (min !== undefined && value < min) {
    addError(result, `${fieldName} must be >= ${min}, got ${value}`);
  }

  if (max !== undefined && value > max) {
    addError(result, `${fieldName} must be <= ${max}, got ${value}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Percentage Validation
// ---------------------------------------------------------------------------

export function validatePercentage(
  value: unknown,
  fieldName: string = 'percentage'
): ValidationResult {
  const result = createValidationResult();

  if (!isFiniteNumber(value)) {
    addError(result, `${fieldName} must be a finite number, got ${String(value)}`);
    return result;
  }

  if (value < 0 || value > 100) {
    addError(result, `${fieldName} must be between 0 and 100, got ${value}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Ownership Percentage Validation
// ---------------------------------------------------------------------------

export function validateOwnershipPercentage(
  value: unknown,
  fieldName: string = 'ownershipPct'
): ValidationResult {
  const result = createValidationResult();

  if (!isFiniteNumber(value)) {
    addError(result, `${fieldName} must be a finite number, got ${String(value)}`);
    return result;
  }

  if (value < 0 || value > 100) {
    addError(result, `${fieldName} must be between 0 and 100%, got ${value}%`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Date Validation
// ---------------------------------------------------------------------------

export function validateDateRange(
  startDate: unknown,
  endDate: unknown,
  fieldName: string = 'date range'
): ValidationResult {
  const result = createValidationResult();

  if (!isValidDate(startDate)) {
    addError(result, `${fieldName}: invalid start date`);
  }

  if (!isValidDate(endDate)) {
    addError(result, `${fieldName}: invalid end date`);
  }

  if (isValidDate(startDate) && isValidDate(endDate)) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (start > end) {
      addError(result, `${fieldName}: start date must be before end date`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Entity Validation
// ---------------------------------------------------------------------------

export function validateEntity(entity: unknown): ValidationResult {
  const result = createValidationResult();

  if (typeof entity !== 'object' || entity === null) {
    addError(result, 'Entity must be an object');
    return result;
  }

  const e = entity as Record<string, unknown>;

  if (!isNonEmptyString(e.entityId)) {
    addError(result, 'entityId must be a non-empty string');
  }

  if (!isNonEmptyString(e.entityName)) {
    addError(result, 'entityName must be a non-empty string');
  }

  if (!isValidCurrency(e.currency)) {
    addError(result, 'currency must be a valid 3-letter currency code (e.g., USD, EUR)');
  }

  if (!Array.isArray(e.entries)) {
    addError(result, 'entries must be an array');
  }

  return result;
}

// ---------------------------------------------------------------------------
// GL Entry Validation
// ---------------------------------------------------------------------------

export function validateGLEntry(entry: unknown): ValidationResult {
  const result = createValidationResult();

  if (typeof entry !== 'object' || entry === null) {
    addError(result, 'GL entry must be an object');
    return result;
  }

  const e = entry as Record<string, unknown>;

  if (!isNonEmptyString(e.accountCode)) {
    addError(result, 'accountCode must be a non-empty string');
  }

  if (!isFiniteNumber(e.debit)) {
    addError(result, 'debit must be a finite number');
  }

  if (!isFiniteNumber(e.credit)) {
    addError(result, 'credit must be a finite number');
  }

  if (isFiniteNumber(e.debit) && isFiniteNumber(e.credit)) {
    if (e.debit < 0 && e.credit < 0) {
      addError(result, 'debit and credit cannot both be negative');
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Allocation Rule Validation
// ---------------------------------------------------------------------------

export function validateAllocationRule(rule: unknown): ValidationResult {
  const result = createValidationResult();

  if (typeof rule !== 'object' || rule === null) {
    addError(result, 'Allocation rule must be an object');
    return result;
  }

  const r = rule as Record<string, unknown>;

  if (!isNonEmptyString(r.id)) {
    addError(result, 'Rule id must be a non-empty string');
  }

  if (!isNonEmptyString(r.name)) {
    addError(result, 'Rule name must be a non-empty string');
  }

  if (!isNonEmptyString(r.sourceAccount)) {
    addError(result, 'sourceAccount must be a non-empty string');
  }

  if (!Array.isArray(r.targets) || r.targets.length === 0) {
    addError(result, 'At least one allocation target is required');
  }

  if (Array.isArray(r.targets) && r.targets.length > 0) {
    const totalPct = r.targets.reduce((sum: number, t: unknown) => {
      if (typeof t !== 'object' || t === null) return sum;
      const target = t as Record<string, unknown>;
      return sum + (isFiniteNumber(target.percentage) ? target.percentage : 0);
    }, 0);

    if (Math.abs(totalPct - 100) > 0.01) {
      addError(result, `Target percentages must sum to 100%, got ${totalPct.toFixed(2)}%`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Consolidation Validation
// ---------------------------------------------------------------------------

export function validateOwnershipStructure(structure: unknown): ValidationResult {
  const result = createValidationResult();

  if (typeof structure !== 'object' || structure === null) {
    addError(result, 'Ownership structure must be an object');
    return result;
  }

  const s = structure as Record<string, unknown>;

  if (!isNonEmptyString(s.parentId)) {
    addError(result, 'parentId must be a non-empty string');
  }

  if (!isNonEmptyString(s.childId)) {
    addError(result, 'childId must be a non-empty string');
  }

  if (s.parentId === s.childId) {
    addError(result, 'parentId and childId cannot be the same');
  }

  const ownershipResult = validateOwnershipPercentage(s.ownershipPct);
  if (!ownershipResult.valid) {
    result.valid = false;
    result.errors.push(...ownershipResult.errors);
  }

  const validMethods = ['full', 'equity', 'cost'];
  if (!validMethods.includes(s.method as string)) {
    addError(result, `method must be one of: ${validMethods.join(', ')}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Scenario Driver Validation
// ---------------------------------------------------------------------------

export function validateScenarioDriver(driver: unknown): ValidationResult {
  const result = createValidationResult();

  if (typeof driver !== 'object' || driver === null) {
    addError(result, 'Scenario driver must be an object');
    return result;
  }

  const d = driver as Record<string, unknown>;

  if (!isNonEmptyString(d.id)) {
    addError(result, 'Driver id must be a non-empty string');
  }

  if (!isNonEmptyString(d.name)) {
    addError(result, 'Driver name must be a non-empty string');
  }

  const validTypes = ['revenue', 'expense', 'headcount', 'margin'];
  if (!validTypes.includes(d.type as string)) {
    addError(result, `Driver type must be one of: ${validTypes.join(', ')}`);
  }

  const validImpactTypes = ['percentage', 'absolute'];
  if (!validImpactTypes.includes(d.impactType as string)) {
    addError(result, `Impact type must be one of: ${validImpactTypes.join(', ')}`);
  }

  if (!isFiniteNumber(d.value)) {
    addError(result, 'Driver value must be a finite number');
  }

  return result;
}

// ---------------------------------------------------------------------------
// Budget Validation
// ---------------------------------------------------------------------------

export function validateBudget(budget: unknown): ValidationResult {
  const result = createValidationResult();

  if (typeof budget !== 'object' || budget === null) {
    addError(result, 'Budget must be an object');
    return result;
  }

  const b = budget as Record<string, unknown>;

  if (!isNonEmptyString(b.name)) {
    addError(result, 'Budget name must be a non-empty string');
  }

  if (isNonEmptyString(b.name) && b.name.length > 200) {
    addError(result, 'Budget name must be 200 characters or less');
  }

  return result;
}

// ---------------------------------------------------------------------------
// Forecast Validation
// ---------------------------------------------------------------------------

export function validateForecast(forecast: unknown): ValidationResult {
  const result = createValidationResult();

  if (typeof forecast !== 'object' || forecast === null) {
    addError(result, 'Forecast must be an object');
    return result;
  }

  const f = forecast as Record<string, unknown>;

  if (!isNonEmptyString(f.name)) {
    addError(result, 'Forecast name must be a non-empty string');
  }

  return result;
}

// ---------------------------------------------------------------------------
// Monte Carlo Validation
// ---------------------------------------------------------------------------

export function validateMonteCarloConfig(config: unknown): ValidationResult {
  const result = createValidationResult();

  if (typeof config !== 'object' || config === null) {
    addError(result, 'Monte Carlo config must be an object');
    return result;
  }

  const c = config as Record<string, unknown>;

  if (!isPositiveNumber(c.iterations)) {
    addError(result, 'iterations must be a positive number');
  }

  if (isFiniteNumber(c.iterations) && c.iterations > 1000000) {
    addWarning(result, 'iterations > 1,000,000 may be slow');
  }

  return result;
}

// ---------------------------------------------------------------------------
// Batch Validation
// ---------------------------------------------------------------------------

export function validateBatch(validations: ValidationResult[]): ValidationResult {
  const result = createValidationResult();

  for (const v of validations) {
    if (!v.valid) {
      result.valid = false;
      result.errors.push(...v.errors);
    }
    result.warnings.push(...v.warnings);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Required Field Check
// ---------------------------------------------------------------------------

export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): ValidationResult {
  const result = createValidationResult();

  if (value === null || value === undefined) {
    addError(result, `${fieldName} is required`);
    return result;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    addError(result, `${fieldName} cannot be empty`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Array Validation
// ---------------------------------------------------------------------------

export function validateNonEmptyArray(value: unknown, fieldName: string): ValidationResult {
  const result = createValidationResult();

  if (!Array.isArray(value)) {
    addError(result, `${fieldName} must be an array`);
    return result;
  }

  if (value.length === 0) {
    addError(result, `${fieldName} cannot be empty`);
  }

  return result;
}
