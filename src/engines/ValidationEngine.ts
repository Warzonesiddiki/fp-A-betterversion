// =============================================================================
// VALIDATION ENGINE — Financial Data Validation
// Pure TypeScript, deterministic, testable, zero external dependencies
// Uses SafeMathParser for formula evaluation — NO eval(), NO new Function()
// =============================================================================

import { safeMathParser } from './SafeMathParser';

// --- Type Definitions ---

export type ValidationRuleType =
  | 'balance'
  | 'range'
  | 'growth'
  | 'cross'
  | 'completeness'
  | 'formula';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface CellRef {
  cube: string;
  row: string;
  col: string;
  measure: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  type: ValidationRuleType;
  config: ValidationRuleConfig;
  severity: ValidationSeverity;
  isActive: boolean;
}

export type ValidationRuleConfig =
  | BalanceCheckConfig
  | RangeCheckConfig
  | GrowthCheckConfig
  | CrossCheckConfig
  | CompletenessCheckConfig
  | FormulaCheckConfig;

export interface BalanceCheckConfig {
  type: 'balance';
  debitAccounts: string[];
  creditAccounts: string[];
  cube: string;
  period: string;
  measure: string;
}

export interface RangeCheckConfig {
  type: 'range';
  cube: string;
  accounts: string[];
  periods: string[];
  measure: string;
  min: number;
  max: number;
}

export interface GrowthCheckConfig {
  type: 'growth';
  cube: string;
  account: string;
  periods: string[];
  measure: string;
  maxGrowthPct: number;
}

export interface CrossCheckConfig {
  type: 'cross';
  cube: string;
  numeratorAccount: string;
  denominatorAccount: string;
  periods: string[];
  measure: string;
  expectedRatio: number;
  tolerancePct: number;
}

export interface CompletenessCheckConfig {
  type: 'completeness';
  cube: string;
  accounts: string[];
  periods: string[];
  measure: string;
}

export interface FormulaCheckConfig {
  type: 'formula';
  cube: string;
  periods: string[];
  formula: string;
  variables: Record<string, CellRef>;
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  message: string;
  severity: ValidationSeverity;
  affectedCells: CellRef[];
  timestamp: number;
}

export interface ValidationReport {
  results: ValidationResult[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  passed: boolean;
  timestamp: number;
}

/**
 * CellData is a nested map: cube -> row -> col -> measure -> value
 * Example: data['GL']['2024-Q1']['1000']['debit'] = 50000
 */
export type CellData = Record<string, Record<string, Record<string, Record<string, number>>>>;

// --- Engine ---

export class ValidationEngine {
  /**
   * Validate a single rule against the provided cell data.
   */
  static validateRule(rule: ValidationRule, data: CellData): ValidationResult {
    if (!rule.isActive) {
      return {
        ruleId: rule.id,
        passed: true,
        message: `Rule "${rule.name}" is inactive — skipped`,
        severity: rule.severity,
        affectedCells: [],
        timestamp: Date.now(),
      };
    }

    switch (rule.type) {
      case 'balance':
        return this.validateBalance(rule, data);
      case 'range':
        return this.validateRange(rule, data);
      case 'growth':
        return this.validateGrowth(rule, data);
      case 'cross':
        return this.validateCross(rule, data);
      case 'completeness':
        return this.validateCompleteness(rule, data);
      case 'formula':
        return this.validateFormula(rule, data);
      default:
        return {
          ruleId: rule.id,
          passed: false,
          message: `Unknown rule type: ${(rule as ValidationRule).type}`,
          severity: rule.severity,
          affectedCells: [],
          timestamp: Date.now(),
        };
    }
  }

  /**
   * Validate multiple rules and produce a consolidated report.
   */
  static validate(rules: ValidationRule[], data: CellData): ValidationReport {
    const results = rules.map((rule) => this.validateRule(rule, data));
    return this.buildReport(results);
  }

  /**
   * Build a ValidationReport from a list of results.
   */
  static buildReport(results: ValidationResult[]): ValidationReport {
    const errorCount = results.filter((r) => !r.passed && r.severity === 'error').length;
    const warningCount = results.filter((r) => !r.passed && r.severity === 'warning').length;
    const infoCount = results.filter((r) => !r.passed && r.severity === 'info').length;

    return {
      results,
      errorCount,
      warningCount,
      infoCount,
      passed: errorCount === 0,
      timestamp: Date.now(),
    };
  }

  // ---------------------------------------------------------------------------
  // Individual rule validators
  // ---------------------------------------------------------------------------

  private static validateBalance(rule: ValidationRule, data: CellData): ValidationResult {
    const cfg = rule.config as BalanceCheckConfig;
    const cube = data[cfg.cube];
    const affectedCells: CellRef[] = [];

    if (!cube) {
      return this.fail(rule, `Cube "${cfg.cube}" not found in data`, []);
    }

    const periodData = cube[cfg.period];
    if (!periodData) {
      return this.fail(rule, `Period "${cfg.period}" not found in cube "${cfg.cube}"`, []);
    }

    let debitTotal = 0;
    let creditTotal = 0;

    for (const acct of cfg.debitAccounts) {
      const cell = periodData[acct];
      if (cell && cfg.measure in cell) {
        const val = cell[cfg.measure];
        debitTotal += val;
        if (val !== 0) {
          affectedCells.push({
            cube: cfg.cube,
            row: cfg.period,
            col: acct,
            measure: cfg.measure,
          });
        }
      }
    }

    for (const acct of cfg.creditAccounts) {
      const cell = periodData[acct];
      if (cell && cfg.measure in cell) {
        const val = cell[cfg.measure];
        creditTotal += val;
        if (val !== 0) {
          affectedCells.push({
            cube: cfg.cube,
            row: cfg.period,
            col: acct,
            measure: cfg.measure,
          });
        }
      }
    }

    const diff = Math.abs(debitTotal - creditTotal);
    const tolerance = 0.005; // half-cent tolerance for floating point
    const passed = diff <= tolerance;

    return {
      ruleId: rule.id,
      passed,
      message: passed
        ? `Balanced: debits (${debitTotal}) = credits (${creditTotal})`
        : `Out of balance by ${diff.toFixed(2)}: debits=${debitTotal.toFixed(2)}, credits=${creditTotal.toFixed(2)}`,
      severity: rule.severity,
      affectedCells,
      timestamp: Date.now(),
    };
  }

  private static validateRange(rule: ValidationRule, data: CellData): ValidationResult {
    const cfg = rule.config as RangeCheckConfig;
    const cube = data[cfg.cube];
    const affectedCells: CellRef[] = [];
    const violations: string[] = [];

    if (!cube) {
      return this.fail(rule, `Cube "${cfg.cube}" not found in data`, []);
    }

    for (const period of cfg.periods) {
      const periodData = cube[period];
      if (!periodData) continue;

      for (const acct of cfg.accounts) {
        const cell = periodData[acct];
        if (!cell || !(cfg.measure in cell)) continue;

        const val = cell[cfg.measure];
        if (val < cfg.min || val > cfg.max) {
          affectedCells.push({
            cube: cfg.cube,
            row: period,
            col: acct,
            measure: cfg.measure,
          });
          violations.push(`${acct}/${period} = ${val} (expected ${cfg.min}..${cfg.max})`);
        }
      }
    }

    const passed = affectedCells.length === 0;

    return {
      ruleId: rule.id,
      passed,
      message: passed
        ? `All values within range [${cfg.min}, ${cfg.max}]`
        : `${affectedCells.length} value(s) out of range: ${violations.slice(0, 5).join('; ')}${violations.length > 5 ? '...' : ''}`,
      severity: rule.severity,
      affectedCells,
      timestamp: Date.now(),
    };
  }

  private static validateGrowth(rule: ValidationRule, data: CellData): ValidationResult {
    const cfg = rule.config as GrowthCheckConfig;
    const cube = data[cfg.cube];
    const affectedCells: CellRef[] = [];
    const violations: string[] = [];

    if (!cube) {
      return this.fail(rule, `Cube "${cfg.cube}" not found in data`, []);
    }

    if (cfg.periods.length < 2) {
      return this.fail(rule, 'Growth check requires at least 2 periods', []);
    }

    for (let i = 1; i < cfg.periods.length; i++) {
      const prevPeriod = cfg.periods[i - 1];
      const currPeriod = cfg.periods[i];

      const prevCell = cube[prevPeriod]?.[cfg.account];
      const currCell = cube[currPeriod]?.[cfg.account];

      if (!prevCell || !(cfg.measure in prevCell) || !currCell || !(cfg.measure in currCell)) {
        continue;
      }

      const prevVal = prevCell[cfg.measure];
      const currVal = currCell[cfg.measure];

      if (prevVal === 0) {
        if (currVal !== 0) {
          affectedCells.push({
            cube: cfg.cube,
            row: currPeriod,
            col: cfg.account,
            measure: cfg.measure,
          });
          violations.push(
            `${cfg.account}/${currPeriod}: infinite growth (prev=0, curr=${currVal})`
          );
        }
        continue;
      }

      const growthPct = ((currVal - prevVal) / Math.abs(prevVal)) * 100;

      if (Math.abs(growthPct) > cfg.maxGrowthPct) {
        affectedCells.push({
          cube: cfg.cube,
          row: currPeriod,
          col: cfg.account,
          measure: cfg.measure,
        });
        violations.push(
          `${cfg.account}/${currPeriod}: ${growthPct.toFixed(1)}% (max ${cfg.maxGrowthPct}%)`
        );
      }
    }

    const passed = affectedCells.length === 0;

    return {
      ruleId: rule.id,
      passed,
      message: passed
        ? `Growth within threshold (${cfg.maxGrowthPct}%) for all periods`
        : `${affectedCells.length} period(s) exceed growth threshold: ${violations.slice(0, 5).join('; ')}${violations.length > 5 ? '...' : ''}`,
      severity: rule.severity,
      affectedCells,
      timestamp: Date.now(),
    };
  }

  private static validateCross(rule: ValidationRule, data: CellData): ValidationResult {
    const cfg = rule.config as CrossCheckConfig;
    const cube = data[cfg.cube];
    const affectedCells: CellRef[] = [];
    const violations: string[] = [];

    if (!cube) {
      return this.fail(rule, `Cube "${cfg.cube}" not found in data`, []);
    }

    for (const period of cfg.periods) {
      const periodData = cube[period];
      if (!periodData) continue;

      const numCell = periodData[cfg.numeratorAccount];
      const denCell = periodData[cfg.denominatorAccount];

      if (!numCell || !(cfg.measure in numCell) || !denCell || !(cfg.measure in denCell)) {
        continue;
      }

      const numVal = numCell[cfg.measure];
      const denVal = denCell[cfg.measure];

      if (denVal === 0) {
        if (numVal !== 0) {
          affectedCells.push(
            {
              cube: cfg.cube,
              row: period,
              col: cfg.numeratorAccount,
              measure: cfg.measure,
            },
            {
              cube: cfg.cube,
              row: period,
              col: cfg.denominatorAccount,
              measure: cfg.measure,
            }
          );
          violations.push(`${period}: denominator is zero, numerator is ${numVal}`);
        }
        continue;
      }

      const actualRatio = numVal / denVal;
      const diffPct = Math.abs((actualRatio - cfg.expectedRatio) / cfg.expectedRatio) * 100;

      if (diffPct > cfg.tolerancePct) {
        affectedCells.push(
          {
            cube: cfg.cube,
            row: period,
            col: cfg.numeratorAccount,
            measure: cfg.measure,
          },
          {
            cube: cfg.cube,
            row: period,
            col: cfg.denominatorAccount,
            measure: cfg.measure,
          }
        );
        violations.push(
          `${period}: ratio=${(actualRatio * 100).toFixed(1)}%, expected=${(cfg.expectedRatio * 100).toFixed(1)}% (diff=${diffPct.toFixed(1)}%)`
        );
      }
    }

    const passed = affectedCells.length === 0;

    return {
      ruleId: rule.id,
      passed,
      message: passed
        ? `Cross-check passed: ratio within ${cfg.tolerancePct}% of ${(cfg.expectedRatio * 100).toFixed(1)}%`
        : `${violations.length} period(s) failed cross-check: ${violations.slice(0, 5).join('; ')}${violations.length > 5 ? '...' : ''}`,
      severity: rule.severity,
      affectedCells,
      timestamp: Date.now(),
    };
  }

  private static validateCompleteness(rule: ValidationRule, data: CellData): ValidationResult {
    const cfg = rule.config as CompletenessCheckConfig;
    const cube = data[cfg.cube];
    const affectedCells: CellRef[] = [];
    const missing: string[] = [];

    if (!cube) {
      // When cube is missing, enumerate all expected cells as affected
      for (const period of cfg.periods) {
        for (const acct of cfg.accounts) {
          affectedCells.push({
            cube: cfg.cube,
            row: period,
            col: acct,
            measure: cfg.measure,
          });
          missing.push(`${acct}/${period}: cube missing`);
        }
      }
      return this.fail(
        rule,
        `${affectedCells.length} missing value(s): ${missing.slice(0, 5).join('; ')}${missing.length > 5 ? '...' : ''}`,
        affectedCells
      );
    }

    for (const period of cfg.periods) {
      const periodData = cube[period];
      if (!periodData) {
        for (const acct of cfg.accounts) {
          affectedCells.push({
            cube: cfg.cube,
            row: period,
            col: acct,
            measure: cfg.measure,
          });
          missing.push(`${acct}/${period}: period missing`);
        }
        continue;
      }

      for (const acct of cfg.accounts) {
        const cell = periodData[acct];
        if (!cell || !(cfg.measure in cell)) {
          affectedCells.push({
            cube: cfg.cube,
            row: period,
            col: acct,
            measure: cfg.measure,
          });
          missing.push(`${acct}/${period}: no value`);
        }
      }
    }

    const passed = affectedCells.length === 0;

    return {
      ruleId: rule.id,
      passed,
      message: passed
        ? `All ${cfg.accounts.length} accounts present for ${cfg.periods.length} periods`
        : `${affectedCells.length} missing value(s): ${missing.slice(0, 5).join('; ')}${missing.length > 5 ? '...' : ''}`,
      severity: rule.severity,
      affectedCells,
      timestamp: Date.now(),
    };
  }

  private static validateFormula(rule: ValidationRule, data: CellData): ValidationResult {
    const cfg = rule.config as FormulaCheckConfig;
    const affectedCells: CellRef[] = [];
    const violations: string[] = [];

    for (const period of cfg.periods) {
      // Resolve variables for this period
      const resolvedVars: Record<string, number> = {};

      for (const [varName, cellRef] of Object.entries(cfg.variables)) {
        const cubeData = data[cellRef.cube];
        const periodKey = cellRef.row === '__PERIOD__' ? period : cellRef.row;
        const val = cubeData?.[periodKey]?.[cellRef.col]?.[cellRef.measure];
        if (val === undefined) {
          resolvedVars[varName] = 0;
        } else {
          resolvedVars[varName] = val;
        }
      }

      // Evaluate the formula
      const result = this.evaluateSimpleFormula(cfg.formula, resolvedVars);

      if (!result) {
        // Collect affected variable cells
        for (const cellRef of Object.values(cfg.variables)) {
          const periodKey = cellRef.row === '__PERIOD__' ? period : cellRef.row;
          affectedCells.push({
            cube: cellRef.cube,
            row: periodKey,
            col: cellRef.col,
            measure: cellRef.measure,
          });
        }
        const varSummary = Object.entries(resolvedVars)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        violations.push(`${period}: ${cfg.formula} => false (${varSummary})`);
      }
    }

    const passed = affectedCells.length === 0;

    return {
      ruleId: rule.id,
      passed,
      message: passed
        ? `Formula "${cfg.formula}" holds for all periods`
        : `Formula "${cfg.formula}" failed for ${violations.length} period(s): ${violations.slice(0, 5).join('; ')}${violations.length > 5 ? '...' : ''}`,
      severity: rule.severity,
      affectedCells,
      timestamp: Date.now(),
    };
  }

  // ---------------------------------------------------------------------------
  // Formula evaluator (simple arithmetic with comparisons)
  // ---------------------------------------------------------------------------

  /**
   * Evaluate a simple formula expression with variable substitution.
   * Supports: +, -, *, /, comparisons (>, <, >=, <=, ==, !=), parentheses.
   * Returns true if the expression evaluates to a truthy number.
   */
  static evaluateSimpleFormula(formula: string, variables: Record<string, number>): boolean {
    try {
      // Replace variable names with their numeric values
      let expr = formula;
      const sortedVars = Object.keys(variables).sort((a, b) => b.length - a.length);
      for (const varName of sortedVars) {
        const val = variables[varName];
        // Use word boundary matching to avoid partial replacements
        expr = expr.replace(new RegExp(`\\b${this.escapeRegex(varName)}\\b`, 'g'), String(val));
      }

      // Convert JS-style operators to SafeMathParser format:
      // SafeMathParser uses = for equality, <> for not-equal
      // JS uses == for equality, != for not-equal
      expr = expr
        .replace(/!=/g, '<>') // != to <>
        .replace(/==/g, '='); // == to =

      // Safe evaluation using SafeMathParser (no code injection possible)
      const result = safeMathParser.evaluate(expr);
      return typeof result === 'number' ? result !== 0 : Boolean(result);
    } catch {
      return false;
    }
  }

  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private static fail(
    rule: ValidationRule,
    message: string,
    affectedCells: CellRef[]
  ): ValidationResult {
    return {
      ruleId: rule.id,
      passed: false,
      message,
      severity: rule.severity,
      affectedCells,
      timestamp: Date.now(),
    };
  }

  /**
   * Get the value of a single cell from the data map.
   */
  static getCellValue(
    data: CellData,
    cube: string,
    row: string,
    col: string,
    measure: string
  ): number | undefined {
    return data[cube]?.[row]?.[col]?.[measure];
  }

  /**
   * Check if a cell exists in the data map.
   */
  static cellExists(
    data: CellData,
    cube: string,
    row: string,
    col: string,
    measure: string
  ): boolean {
    return (
      cube in data && row in data[cube] && col in data[cube][row] && measure in data[cube][row][col]
    );
  }
}
