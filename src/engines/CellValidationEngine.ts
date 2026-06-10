/**
 * Cell Validation Engine — Validate cell values against rules
 */

export type ValidationRuleParams = {
  min: { value: number };
  max: { value: number };
  range: { min: number; max: number };
  allowed: { values: unknown[] };
  formula: { expression: string };
  crossRef: { ref: string };
  required: Record<string, never>;
  pattern: { regex: string };
};

export type ValidationRuleType = keyof ValidationRuleParams;

export type ValidationRule<T extends ValidationRuleType = ValidationRuleType> = {
  id: string;
  cellRef: string;
  type: T;
  params: ValidationRuleParams[T];
  message: string;
  severity: 'error' | 'warning' | 'info';
  blockSave: boolean;
};

export interface ValidationResult {
  cellRef: string;
  valid: boolean;
  errors: Array<{ ruleId: string; message: string; severity: string }>;
}

export class CellValidationEngine {
  private static rules = new Map<string, ValidationRule[]>();
  private static errors = new Map<string, ValidationResult>();

  static addRule(rule: ValidationRule): void {
    const existing = this.rules.get(rule.cellRef) ?? [];
    existing.push(rule);
    this.rules.set(rule.cellRef, existing);
  }

  static removeRule(ruleId: string): void {
    for (const [cellRef, rules] of this.rules) {
      this.rules.set(
        cellRef,
        rules.filter((r) => r.id !== ruleId)
      );
    }
  }

  static validate(cellRef: string, value: unknown): ValidationResult {
    const rules = this.rules.get(cellRef) ?? [];
    const errors: ValidationResult['errors'] = [];

    for (const rule of rules) {
      const valid = this.checkRule(rule, value);
      if (!valid) {
        errors.push({ ruleId: rule.id, message: rule.message, severity: rule.severity });
      }
    }

    const result: ValidationResult = {
      cellRef,
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };

    if (errors.length > 0) {
      this.errors.set(cellRef, result);
    } else {
      this.errors.delete(cellRef);
    }

    return result;
  }

  static validateAll(cells: Record<string, unknown>): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();
    for (const [cellRef, value] of Object.entries(cells)) {
      const result = this.validate(cellRef, value);
      if (result.errors.length > 0) results.set(cellRef, result);
    }
    return results;
  }

  static hasBlockingErrors(): boolean {
    for (const result of this.errors.values()) {
      for (const error of result.errors) {
        if (error.severity === 'error') return true;
      }
    }
    return false;
  }

  static getErrors(cellRef?: string): ValidationResult[] {
    if (cellRef) {
      const result = this.errors.get(cellRef);
      return result ? [result] : [];
    }
    return Array.from(this.errors.values());
  }

  static clearErrors(cellRef?: string): void {
    if (cellRef) {
      this.errors.delete(cellRef);
    } else {
      this.errors.clear();
    }
  }

  private static checkRule(rule: ValidationRule, value: unknown): boolean {
    const numValue = Number(value);
    switch (rule.type) {
      case 'min':
        return isNaN(numValue) || numValue >= (rule.params as ValidationRuleParams['min']).value;
      case 'max':
        return isNaN(numValue) || numValue <= (rule.params as ValidationRuleParams['max']).value;
      case 'range': {
        const params = rule.params as ValidationRuleParams['range'];
        return isNaN(numValue) || (numValue >= params.min && numValue <= params.max);
      }
      case 'allowed':
        return (rule.params as ValidationRuleParams['allowed']).values.includes(value);
      case 'required':
        return value !== null && value !== undefined && value !== '';
      case 'pattern':
        return new RegExp((rule.params as ValidationRuleParams['pattern']).regex).test(
          String(value)
        );
      default:
        return true;
    }
  }
}
