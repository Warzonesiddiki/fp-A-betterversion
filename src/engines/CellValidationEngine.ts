/**
 * Cell Validation Engine — Validate cell values against rules
 */

export type ValidationRuleType =
  | 'min'
  | 'max'
  | 'range'
  | 'allowed'
  | 'formula'
  | 'crossRef'
  | 'required'
  | 'pattern';

export interface ValidationRule {
  id: string;
  cellRef: string;
  type: ValidationRuleType;
  params: Record<string, unknown>;
  message: string;
  severity: 'error' | 'warning' | 'info';
  blockSave: boolean;
}

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
        return isNaN(numValue) || numValue >= (rule.params.value as number);
      case 'max':
        return isNaN(numValue) || numValue <= (rule.params.value as number);
      case 'range':
        return (
          isNaN(numValue) ||
          (numValue >= (rule.params.min as number) && numValue <= (rule.params.max as number))
        );
      case 'allowed':
        return (rule.params.values as unknown[]).includes(value);
      case 'required':
        return value !== null && value !== undefined && value !== '';
      case 'pattern':
        return new RegExp(rule.params.regex as string).test(String(value));
      default:
        return true;
    }
  }
}
