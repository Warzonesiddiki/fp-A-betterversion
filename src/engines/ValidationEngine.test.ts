import { describe, it, expect } from 'vitest';
import {
  ValidationEngine,
  type ValidationRule,
  type ValidationRuleType,
  type CellData,
  type ValidationResult,
  type BalanceCheckConfig,
  type RangeCheckConfig,
  type GrowthCheckConfig,
  type CrossCheckConfig,
  type CompletenessCheckConfig,
  type FormulaCheckConfig,
} from './ValidationEngine';

// =============================================================================
// Test Helpers
// =============================================================================

function makeCellData(
  entries: Array<{
    cube: string;
    row: string;
    col: string;
    measure: string;
    value: number;
  }>
): CellData {
  const data: CellData = {};
  for (const e of entries) {
    if (!data[e.cube]) data[e.cube] = {};
    if (!data![e.cube]![e.row]) data![e.cube]![e.row] = {};
    if (!data![e.cube]![e.row!][e.col]) data![e.cube]![e.row!][e.col] = {};
    data![e.cube]![e.row!]![e.col!]![e.measure!] = e.value;
  }
  return data;
}

function makeRule(
  overrides: Partial<ValidationRule> & { config: ValidationRule['config'] }
): ValidationRule {
  return {
    id: overrides.id ?? 'r1',
    name: overrides.name ?? 'Test Rule',
    type: overrides.type ?? overrides.config.type,
    config: overrides.config,
    severity: overrides.severity ?? 'error',
    isActive: overrides.isActive ?? true,
  };
}

// =============================================================================
// Sample data
// =============================================================================

const balancedData: CellData = makeCellData([
  { cube: 'GL', row: '2024-Q1', col: '1000', measure: 'debit', value: 50000 },
  { cube: 'GL', row: '2024-Q1', col: '1001', measure: 'debit', value: 30000 },
  { cube: 'GL', row: '2024-Q1', col: '2000', measure: 'credit', value: 40000 },
  { cube: 'GL', row: '2024-Q1', col: '2001', measure: 'credit', value: 40000 },
]);

const unbalancedData: CellData = makeCellData([
  { cube: 'GL', row: '2024-Q1', col: '1000', measure: 'amount', value: 50000 },
  { cube: 'GL', row: '2024-Q1', col: '1001', measure: 'amount', value: 30000 },
  { cube: 'GL', row: '2024-Q1', col: '2000', measure: 'amount', value: 40000 },
  { cube: 'GL', row: '2024-Q1', col: '2001', measure: 'amount', value: 35000 },
]);

const growthData: CellData = makeCellData([
  { cube: 'REV', row: '2023-Q1', col: 'revenue', measure: 'actual', value: 100000 },
  { cube: 'REV', row: '2023-Q2', col: 'revenue', measure: 'actual', value: 120000 },
  { cube: 'REV', row: '2023-Q3', col: 'revenue', measure: 'actual', value: 200000 },
  { cube: 'REV', row: '2023-Q4', col: 'revenue', measure: 'actual', value: 50000 },
]);

// =============================================================================
// BALANCE CHECK
// =============================================================================

describe('ValidationEngine', () => {
  describe('balance check', () => {
    it('should pass when debits equal credits', () => {
      const rule = makeRule({
        id: 'bal-1',
        config: {
          type: 'balance',
          debitAccounts: ['1000', '1001'],
          creditAccounts: ['2000', '2001'],
          cube: 'GL',
          period: '2024-Q1',
          measure: 'debit',
        } satisfies BalanceCheckConfig,
      });

      // Credit values use 'debit' measure here just to match the config
      // In real data, you'd use a unified measure or separate configs
      const data: CellData = makeCellData([
        { cube: 'GL', row: '2024-Q1', col: '1000', measure: 'debit', value: 50000 },
        { cube: 'GL', row: '2024-Q1', col: '1001', measure: 'debit', value: 30000 },
        { cube: 'GL', row: '2024-Q1', col: '2000', measure: 'debit', value: 40000 },
        { cube: 'GL', row: '2024-Q1', col: '2001', measure: 'debit', value: 40000 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(true);
      expect(result.ruleId).toBe('bal-1');
    });

    it('should fail when debits do not equal credits', () => {
      const rule = makeRule({
        id: 'bal-2',
        config: {
          type: 'balance',
          debitAccounts: ['1000', '1001'],
          creditAccounts: ['2000', '2001'],
          cube: 'GL',
          period: '2024-Q1',
          measure: 'amount',
        } satisfies BalanceCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, unbalancedData);
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.message).toContain('Out of balance');
    });

    it('should fail when cube does not exist', () => {
      const rule = makeRule({
        id: 'bal-3',
        config: {
          type: 'balance',
          debitAccounts: ['1000'],
          creditAccounts: ['2000'],
          cube: 'NONEXISTENT',
          period: '2024-Q1',
          measure: 'amount',
        } satisfies BalanceCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, balancedData);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should fail when period does not exist', () => {
      const rule = makeRule({
        id: 'bal-4',
        config: {
          type: 'balance',
          debitAccounts: ['1000'],
          creditAccounts: ['2000'],
          cube: 'GL',
          period: '2099-Q1',
          measure: 'amount',
        } satisfies BalanceCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, balancedData);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle zero balances as balanced', () => {
      const rule = makeRule({
        id: 'bal-5',
        config: {
          type: 'balance',
          debitAccounts: ['1000'],
          creditAccounts: ['2000'],
          cube: 'GL',
          period: '2024-Q1',
          measure: 'amount',
        } satisfies BalanceCheckConfig,
      });

      const data: CellData = makeCellData([
        { cube: 'GL', row: '2024-Q1', col: '1000', measure: 'amount', value: 0 },
        { cube: 'GL', row: '2024-Q1', col: '2000', measure: 'amount', value: 0 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(true);
    });
  });

  // ===========================================================================
  // RANGE CHECK
  // ===========================================================================

  describe('range check', () => {
    const rangeRule = makeRule({
      id: 'range-1',
      config: {
        type: 'range',
        cube: 'BUDGET',
        accounts: ['opex', 'cogs'],
        periods: ['2024-Q1', '2024-Q2'],
        measure: 'actual',
        min: 0,
        max: 100000,
      } satisfies RangeCheckConfig,
    });

    it('should pass when all values are within range', () => {
      const data = makeCellData([
        { cube: 'BUDGET', row: '2024-Q1', col: 'opex', measure: 'actual', value: 50000 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'cogs', measure: 'actual', value: 30000 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'opex', measure: 'actual', value: 60000 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'cogs', measure: 'actual', value: 40000 },
      ]);

      const result = ValidationEngine.validateRule(rangeRule, data);
      expect(result.passed).toBe(true);
    });

    it('should fail when a value exceeds the maximum', () => {
      const data = makeCellData([
        { cube: 'BUDGET', row: '2024-Q1', col: 'opex', measure: 'actual', value: 150000 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'cogs', measure: 'actual', value: 30000 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'opex', measure: 'actual', value: 60000 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'cogs', measure: 'actual', value: 40000 },
      ]);

      const result = ValidationEngine.validateRule(rangeRule, data);
      expect(result.passed).toBe(false);
      expect(result.affectedCells).toHaveLength(1);
      expect(result!.affectedCells[0]!.col).toBe('opex');
    });

    it('should fail when a value is below the minimum', () => {
      const data = makeCellData([
        { cube: 'BUDGET', row: '2024-Q1', col: 'opex', measure: 'actual', value: -5000 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'cogs', measure: 'actual', value: 30000 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'opex', measure: 'actual', value: 60000 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'cogs', measure: 'actual', value: 40000 },
      ]);

      const result = ValidationEngine.validateRule(rangeRule, data);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('out of range');
    });

    it('should handle boundary values (exact min and max)', () => {
      const data = makeCellData([
        { cube: 'BUDGET', row: '2024-Q1', col: 'opex', measure: 'actual', value: 0 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'cogs', measure: 'actual', value: 100000 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'opex', measure: 'actual', value: 0 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'cogs', measure: 'actual', value: 100000 },
      ]);

      const result = ValidationEngine.validateRule(rangeRule, data);
      expect(result.passed).toBe(true);
    });

    it('should detect multiple violations', () => {
      const data = makeCellData([
        { cube: 'BUDGET', row: '2024-Q1', col: 'opex', measure: 'actual', value: 200000 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'cogs', measure: 'actual', value: -1000 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'opex', measure: 'actual', value: 200000 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'cogs', measure: 'actual', value: -1000 },
      ]);

      const result = ValidationEngine.validateRule(rangeRule, data);
      expect(result.passed).toBe(false);
      expect(result.affectedCells.length).toBe(4);
    });
  });

  // ===========================================================================
  // GROWTH CHECK
  // ===========================================================================

  describe('growth check', () => {
    it('should pass when growth is within threshold', () => {
      const rule = makeRule({
        id: 'growth-1',
        config: {
          type: 'growth',
          cube: 'REV',
          account: 'revenue',
          periods: ['2023-Q1', '2023-Q2'],
          measure: 'actual',
          maxGrowthPct: 50,
        } satisfies GrowthCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, growthData);
      expect(result.passed).toBe(true);
      expect(result.message).toContain('within threshold');
    });

    it('should fail when growth exceeds threshold', () => {
      const rule = makeRule({
        id: 'growth-2',
        config: {
          type: 'growth',
          cube: 'REV',
          account: 'revenue',
          periods: ['2023-Q2', '2023-Q3'],
          measure: 'actual',
          maxGrowthPct: 50,
        } satisfies GrowthCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, growthData);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('exceed growth threshold');
    });

    it('should handle negative growth (decline)', () => {
      const rule = makeRule({
        id: 'growth-3',
        config: {
          type: 'growth',
          cube: 'REV',
          account: 'revenue',
          periods: ['2023-Q3', '2023-Q4'],
          measure: 'actual',
          maxGrowthPct: 50,
        } satisfies GrowthCheckConfig,
      });

      // 200000 -> 50000 is -75% growth
      const result = ValidationEngine.validateRule(rule, growthData);
      expect(result.passed).toBe(false);
      expect(result.affectedCells).toHaveLength(1);
    });

    it('should fail when previous value is zero and current is nonzero', () => {
      const rule = makeRule({
        id: 'growth-4',
        config: {
          type: 'growth',
          cube: 'REV',
          account: 'newAcct',
          periods: ['2023-Q1', '2023-Q2'],
          measure: 'actual',
          maxGrowthPct: 100,
        } satisfies GrowthCheckConfig,
      });

      const data = makeCellData([
        { cube: 'REV', row: '2023-Q1', col: 'newAcct', measure: 'actual', value: 0 },
        { cube: 'REV', row: '2023-Q2', col: 'newAcct', measure: 'actual', value: 50000 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('infinite growth');
    });

    it('should pass when both previous and current are zero', () => {
      const rule = makeRule({
        id: 'growth-5',
        config: {
          type: 'growth',
          cube: 'REV',
          account: 'newAcct',
          periods: ['2023-Q1', '2023-Q2'],
          measure: 'actual',
          maxGrowthPct: 100,
        } satisfies GrowthCheckConfig,
      });

      const data = makeCellData([
        { cube: 'REV', row: '2023-Q1', col: 'newAcct', measure: 'actual', value: 0 },
        { cube: 'REV', row: '2023-Q2', col: 'newAcct', measure: 'actual', value: 0 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(true);
    });

    it('should fail when fewer than 2 periods are provided', () => {
      const rule = makeRule({
        id: 'growth-6',
        config: {
          type: 'growth',
          cube: 'REV',
          account: 'revenue',
          periods: ['2023-Q1'],
          measure: 'actual',
          maxGrowthPct: 50,
        } satisfies GrowthCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, growthData);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('at least 2 periods');
    });

    it('should validate multiple consecutive periods', () => {
      const rule = makeRule({
        id: 'growth-7',
        config: {
          type: 'growth',
          cube: 'REV',
          account: 'revenue',
          periods: ['2023-Q1', '2023-Q2', '2023-Q3', '2023-Q4'],
          measure: 'actual',
          maxGrowthPct: 50,
        } satisfies GrowthCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, growthData);
      // Q1->Q2: 20%, Q2->Q3: 66.7%, Q3->Q4: -75%
      expect(result.passed).toBe(false);
      expect(result.affectedCells.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===========================================================================
  // CROSS CHECK
  // ===========================================================================

  describe('cross check', () => {
    const crossData = makeCellData([
      { cube: 'FIN', row: '2024-Q1', col: 'pretax_income', measure: 'actual', value: 200000 },
      { cube: 'FIN', row: '2024-Q1', col: 'tax_provision', measure: 'actual', value: 50000 },
      { cube: 'FIN', row: '2024-Q2', col: 'pretax_income', measure: 'actual', value: 300000 },
      { cube: 'FIN', row: '2024-Q2', col: 'tax_provision', measure: 'actual', value: 75000 },
    ]);

    it('should pass when ratio is within tolerance', () => {
      const rule = makeRule({
        id: 'cross-1',
        config: {
          type: 'cross',
          cube: 'FIN',
          numeratorAccount: 'tax_provision',
          denominatorAccount: 'pretax_income',
          periods: ['2024-Q1', '2024-Q2'],
          measure: 'actual',
          expectedRatio: 0.25,
          tolerancePct: 5,
        } satisfies CrossCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, crossData);
      expect(result.passed).toBe(true);
      expect(result.message).toContain('Cross-check passed');
    });

    it('should fail when ratio exceeds tolerance', () => {
      const rule = makeRule({
        id: 'cross-2',
        config: {
          type: 'cross',
          cube: 'FIN',
          numeratorAccount: 'tax_provision',
          denominatorAccount: 'pretax_income',
          periods: ['2024-Q1'],
          measure: 'actual',
          expectedRatio: 0.35, // 25% actual vs 35% expected => diff > 5%
          tolerancePct: 5,
        } satisfies CrossCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, crossData);
      expect(result.passed).toBe(false);
      expect(result.affectedCells.length).toBe(2); // numerator + denominator
    });

    it('should fail when denominator is zero and numerator is nonzero', () => {
      const rule = makeRule({
        id: 'cross-3',
        config: {
          type: 'cross',
          cube: 'FIN',
          numeratorAccount: 'tax_provision',
          denominatorAccount: 'pretax_income',
          periods: ['2024-Q1'],
          measure: 'actual',
          expectedRatio: 0.25,
          tolerancePct: 5,
        } satisfies CrossCheckConfig,
      });

      const data = makeCellData([
        { cube: 'FIN', row: '2024-Q1', col: 'pretax_income', measure: 'actual', value: 0 },
        { cube: 'FIN', row: '2024-Q1', col: 'tax_provision', measure: 'actual', value: 10000 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('denominator is zero');
    });

    it('should pass when both numerator and denominator are zero', () => {
      const rule = makeRule({
        id: 'cross-4',
        config: {
          type: 'cross',
          cube: 'FIN',
          numeratorAccount: 'tax_provision',
          denominatorAccount: 'pretax_income',
          periods: ['2024-Q1'],
          measure: 'actual',
          expectedRatio: 0.25,
          tolerancePct: 5,
        } satisfies CrossCheckConfig,
      });

      const data = makeCellData([
        { cube: 'FIN', row: '2024-Q1', col: 'pretax_income', measure: 'actual', value: 0 },
        { cube: 'FIN', row: '2024-Q1', col: 'tax_provision', measure: 'actual', value: 0 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(true);
    });
  });

  // ===========================================================================
  // COMPLETENESS CHECK
  // ===========================================================================

  describe('completeness check', () => {
    it('should pass when all accounts have values for all periods', () => {
      const rule = makeRule({
        id: 'comp-1',
        config: {
          type: 'completeness',
          cube: 'BUDGET',
          accounts: ['revenue', 'cogs', 'opex'],
          periods: ['2024-Q1', '2024-Q2'],
          measure: 'actual',
        } satisfies CompletenessCheckConfig,
      });

      const data = makeCellData([
        { cube: 'BUDGET', row: '2024-Q1', col: 'revenue', measure: 'actual', value: 100 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'cogs', measure: 'actual', value: 50 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'opex', measure: 'actual', value: 30 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'revenue', measure: 'actual', value: 110 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'cogs', measure: 'actual', value: 55 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'opex', measure: 'actual', value: 35 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(true);
    });

    it('should fail when an account is missing for a period', () => {
      const rule = makeRule({
        id: 'comp-2',
        config: {
          type: 'completeness',
          cube: 'BUDGET',
          accounts: ['revenue', 'cogs', 'opex'],
          periods: ['2024-Q1', '2024-Q2'],
          measure: 'actual',
        } satisfies CompletenessCheckConfig,
      });

      const data = makeCellData([
        { cube: 'BUDGET', row: '2024-Q1', col: 'revenue', measure: 'actual', value: 100 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'cogs', measure: 'actual', value: 50 },
        // opex missing for Q1
        { cube: 'BUDGET', row: '2024-Q2', col: 'revenue', measure: 'actual', value: 110 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'cogs', measure: 'actual', value: 55 },
        { cube: 'BUDGET', row: '2024-Q2', col: 'opex', measure: 'actual', value: 35 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(false);
      expect(result.affectedCells).toHaveLength(1);
      expect(result!.affectedCells[0]!.col).toBe('opex');
      expect(result!.affectedCells[0]!.row).toBe('2024-Q1');
    });

    it('should fail when an entire period is missing', () => {
      const rule = makeRule({
        id: 'comp-3',
        config: {
          type: 'completeness',
          cube: 'BUDGET',
          accounts: ['revenue', 'cogs'],
          periods: ['2024-Q1', '2024-Q2'],
          measure: 'actual',
        } satisfies CompletenessCheckConfig,
      });

      const data = makeCellData([
        { cube: 'BUDGET', row: '2024-Q1', col: 'revenue', measure: 'actual', value: 100 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'cogs', measure: 'actual', value: 50 },
        // Entire Q2 missing
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(false);
      expect(result.affectedCells).toHaveLength(2); // revenue + cogs for Q2
    });

    it('should count all missing cells across multiple periods', () => {
      const rule = makeRule({
        id: 'comp-4',
        config: {
          type: 'completeness',
          cube: 'BUDGET',
          accounts: ['revenue', 'cogs', 'opex'],
          periods: ['2024-Q1', '2024-Q2', '2024-Q3'],
          measure: 'actual',
        } satisfies CompletenessCheckConfig,
      });

      const data = makeCellData([]); // completely empty

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(false);
      expect(result.affectedCells).toHaveLength(9); // 3 accounts x 3 periods
    });
  });

  // ===========================================================================
  // FORMULA CHECK
  // ===========================================================================

  describe('formula check', () => {
    it('should pass when formula evaluates to true', () => {
      const rule = makeRule({
        id: 'formula-1',
        config: {
          type: 'formula',
          cube: 'FIN',
          periods: ['2024-Q1'],
          formula: 'revenue - cogs - opex >= 0',
          variables: {
            revenue: { cube: 'FIN', row: '__PERIOD__', col: 'revenue', measure: 'actual' },
            cogs: { cube: 'FIN', row: '__PERIOD__', col: 'cogs', measure: 'actual' },
            opex: { cube: 'FIN', row: '__PERIOD__', col: 'opex', measure: 'actual' },
          },
        } satisfies FormulaCheckConfig,
      });

      const data = makeCellData([
        { cube: 'FIN', row: '2024-Q1', col: 'revenue', measure: 'actual', value: 200000 },
        { cube: 'FIN', row: '2024-Q1', col: 'cogs', measure: 'actual', value: 80000 },
        { cube: 'FIN', row: '2024-Q1', col: 'opex', measure: 'actual', value: 60000 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(true);
    });

    it('should fail when formula evaluates to false', () => {
      const rule = makeRule({
        id: 'formula-2',
        config: {
          type: 'formula',
          cube: 'FIN',
          periods: ['2024-Q1'],
          formula: 'revenue - cogs - opex >= 0',
          variables: {
            revenue: { cube: 'FIN', row: '__PERIOD__', col: 'revenue', measure: 'actual' },
            cogs: { cube: 'FIN', row: '__PERIOD__', col: 'cogs', measure: 'actual' },
            opex: { cube: 'FIN', row: '__PERIOD__', col: 'opex', measure: 'actual' },
          },
        } satisfies FormulaCheckConfig,
      });

      const data = makeCellData([
        { cube: 'FIN', row: '2024-Q1', col: 'revenue', measure: 'actual', value: 100000 },
        { cube: 'FIN', row: '2024-Q1', col: 'cogs', measure: 'actual', value: 80000 },
        { cube: 'FIN', row: '2024-Q1', col: 'opex', measure: 'actual', value: 60000 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('failed');
    });

    it('should use __PERIOD__ placeholder to substitute period values', () => {
      const rule = makeRule({
        id: 'formula-3',
        config: {
          type: 'formula',
          cube: 'FIN',
          periods: ['2024-Q1', '2024-Q2'],
          formula: 'revenue > 0',
          variables: {
            revenue: { cube: 'FIN', row: '__PERIOD__', col: 'revenue', measure: 'actual' },
          },
        } satisfies FormulaCheckConfig,
      });

      const data = makeCellData([
        { cube: 'FIN', row: '2024-Q1', col: 'revenue', measure: 'actual', value: 100 },
        { cube: 'FIN', row: '2024-Q2', col: 'revenue', measure: 'actual', value: 200 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(true);
    });

    it('should fail for specific period when formula is false', () => {
      const rule = makeRule({
        id: 'formula-4',
        config: {
          type: 'formula',
          cube: 'FIN',
          periods: ['2024-Q1', '2024-Q2'],
          formula: 'revenue > 150',
          variables: {
            revenue: { cube: 'FIN', row: '__PERIOD__', col: 'revenue', measure: 'actual' },
          },
        } satisfies FormulaCheckConfig,
      });

      const data = makeCellData([
        { cube: 'FIN', row: '2024-Q1', col: 'revenue', measure: 'actual', value: 100 },
        { cube: 'FIN', row: '2024-Q2', col: 'revenue', measure: 'actual', value: 200 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(false);
      expect(result.affectedCells.length).toBe(1);
    });

    it('should support multiplication and division in formulas', () => {
      const rule = makeRule({
        id: 'formula-5',
        config: {
          type: 'formula',
          cube: 'FIN',
          periods: ['2024-Q1'],
          formula: 'tax / pretax <= 0.30',
          variables: {
            tax: { cube: 'FIN', row: '__PERIOD__', col: 'tax', measure: 'actual' },
            pretax: { cube: 'FIN', row: '__PERIOD__', col: 'pretax', measure: 'actual' },
          },
        } satisfies FormulaCheckConfig,
      });

      const data = makeCellData([
        { cube: 'FIN', row: '2024-Q1', col: 'tax', measure: 'actual', value: 50000 },
        { cube: 'FIN', row: '2024-Q1', col: 'pretax', measure: 'actual', value: 200000 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(true);
    });
  });

  // ===========================================================================
  // INACTIVE RULES
  // ===========================================================================

  describe('inactive rules', () => {
    it('should skip inactive rules and return passed=true', () => {
      const rule = makeRule({
        id: 'inactive-1',
        isActive: false,
        config: {
          type: 'range',
          cube: 'ANY',
          accounts: ['acct'],
          periods: ['p1'],
          measure: 'val',
          min: 0,
          max: 100,
        } satisfies RangeCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, {});
      expect(result.passed).toBe(true);
      expect(result.message).toContain('inactive');
    });
  });

  // ===========================================================================
  // BATCH VALIDATION
  // ===========================================================================

  describe('batch validation', () => {
    it('should validate multiple rules and produce a report', () => {
      const rules: ValidationRule[] = [
        makeRule({
          id: 'r-balance',
          name: 'GL Balance',
          severity: 'error',
          config: {
            type: 'balance',
            debitAccounts: ['1000'],
            creditAccounts: ['2000'],
            cube: 'GL',
            period: '2024-Q1',
            measure: 'amount',
          } satisfies BalanceCheckConfig,
        }),
        makeRule({
          id: 'r-range',
          name: 'OpEx Range',
          severity: 'warning',
          config: {
            type: 'range',
            cube: 'BUDGET',
            accounts: ['opex'],
            periods: ['2024-Q1'],
            measure: 'actual',
            min: 0,
            max: 50000,
          } satisfies RangeCheckConfig,
        }),
        makeRule({
          id: 'r-completeness',
          name: 'Budget Complete',
          severity: 'info',
          config: {
            type: 'completeness',
            cube: 'BUDGET',
            accounts: ['revenue', 'opex'],
            periods: ['2024-Q1'],
            measure: 'actual',
          } satisfies CompletenessCheckConfig,
        }),
      ];

      const data = makeCellData([
        { cube: 'GL', row: '2024-Q1', col: '1000', measure: 'amount', value: 50000 },
        { cube: 'GL', row: '2024-Q1', col: '2000', measure: 'amount', value: 50000 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'opex', measure: 'actual', value: 30000 },
        { cube: 'BUDGET', row: '2024-Q1', col: 'revenue', measure: 'actual', value: 100000 },
      ]);

      const report = ValidationEngine.validate(rules, data);
      expect(report.results).toHaveLength(3);
      expect(report.passed).toBe(true);
      expect(report.errorCount).toBe(0);
      expect(report.warningCount).toBe(0);
      expect(report.infoCount).toBe(0);
    });

    it('should count errors, warnings, and info correctly', () => {
      const rules: ValidationRule[] = [
        makeRule({
          id: 'e1',
          severity: 'error',
          config: {
            type: 'range',
            cube: 'X',
            accounts: ['a'],
            periods: ['p'],
            measure: 'v',
            min: 0,
            max: 10,
          } satisfies RangeCheckConfig,
        }),
        makeRule({
          id: 'w1',
          severity: 'warning',
          config: {
            type: 'range',
            cube: 'X',
            accounts: ['a'],
            periods: ['p'],
            measure: 'v',
            min: 0,
            max: 10,
          } satisfies RangeCheckConfig,
        }),
        makeRule({
          id: 'i1',
          severity: 'info',
          config: {
            type: 'completeness',
            cube: 'X',
            accounts: ['a'],
            periods: ['p'],
            measure: 'v',
          } satisfies CompletenessCheckConfig,
        }),
      ];

      // All rules fail because data is empty
      const report = ValidationEngine.validate(rules, {});
      expect(report.errorCount).toBe(1);
      expect(report.warningCount).toBe(1);
      expect(report.infoCount).toBe(1);
      expect(report.passed).toBe(false); // at least one error
    });

    it('should handle empty rule list', () => {
      const report = ValidationEngine.validate([], {});
      expect(report.results).toHaveLength(0);
      expect(report.passed).toBe(true);
      expect(report.errorCount).toBe(0);
    });

    it('should handle mixed active/inactive rules', () => {
      const rules: ValidationRule[] = [
        makeRule({
          id: 'active',
          isActive: true,
          config: {
            type: 'completeness',
            cube: 'X',
            accounts: ['a'],
            periods: ['p'],
            measure: 'v',
          } satisfies CompletenessCheckConfig,
        }),
        makeRule({
          id: 'inactive',
          isActive: false,
          config: {
            type: 'completeness',
            cube: 'X',
            accounts: ['a'],
            periods: ['p'],
            measure: 'v',
          } satisfies CompletenessCheckConfig,
        }),
      ];

      const report = ValidationEngine.validate(rules, {});
      expect(report.results).toHaveLength(2);
      expect(report!.results[0]!.passed).toBe(false); // active fails
      expect(report!.results[1]!.passed).toBe(true); // inactive skipped
    });
  });

  // ===========================================================================
  // buildReport
  // ===========================================================================

  describe('buildReport', () => {
    it('should compute correct counts from results', () => {
      const results: ValidationResult[] = [
        {
          ruleId: 'a',
          passed: false,
          message: '',
          severity: 'error',
          affectedCells: [],
          timestamp: 0,
        },
        {
          ruleId: 'b',
          passed: false,
          message: '',
          severity: 'error',
          affectedCells: [],
          timestamp: 0,
        },
        {
          ruleId: 'c',
          passed: false,
          message: '',
          severity: 'warning',
          affectedCells: [],
          timestamp: 0,
        },
        {
          ruleId: 'd',
          passed: true,
          message: '',
          severity: 'info',
          affectedCells: [],
          timestamp: 0,
        },
      ];

      const report = ValidationEngine.buildReport(results);
      expect(report.errorCount).toBe(2);
      expect(report.warningCount).toBe(1);
      expect(report.infoCount).toBe(0); // passed, so not counted
      expect(report.passed).toBe(false);
    });

    it('should report passed=true when no errors', () => {
      const results: ValidationResult[] = [
        {
          ruleId: 'a',
          passed: false,
          message: '',
          severity: 'warning',
          affectedCells: [],
          timestamp: 0,
        },
        {
          ruleId: 'b',
          passed: true,
          message: '',
          severity: 'info',
          affectedCells: [],
          timestamp: 0,
        },
      ];

      const report = ValidationEngine.buildReport(results);
      expect(report.passed).toBe(true);
    });
  });

  // ===========================================================================
  // Utility methods
  // ===========================================================================

  describe('getCellValue', () => {
    it('should return the value when cell exists', () => {
      const data = makeCellData([
        { cube: 'GL', row: '2024-Q1', col: '1000', measure: 'debit', value: 50000 },
      ]);

      const val = ValidationEngine.getCellValue(data, 'GL', '2024-Q1', '1000', 'debit');
      expect(val).toBe(50000);
    });

    it('should return undefined when cell does not exist', () => {
      const val = ValidationEngine.getCellValue({}, 'GL', '2024-Q1', '1000', 'debit');
      expect(val).toBeUndefined();
    });

    it('should return undefined for partial path matches', () => {
      const data = makeCellData([
        { cube: 'GL', row: '2024-Q1', col: '1000', measure: 'debit', value: 50000 },
      ]);

      expect(ValidationEngine.getCellValue(data, 'GL', '2024-Q1', '9999', 'debit')).toBeUndefined();
      expect(ValidationEngine.getCellValue(data, 'GL', '2099-Q1', '1000', 'debit')).toBeUndefined();
    });
  });

  describe('cellExists', () => {
    it('should return true when cell exists', () => {
      const data = makeCellData([
        { cube: 'GL', row: '2024-Q1', col: '1000', measure: 'debit', value: 50000 },
      ]);

      expect(ValidationEngine.cellExists(data, 'GL', '2024-Q1', '1000', 'debit')).toBe(true);
    });

    it('should return false when cell does not exist', () => {
      expect(ValidationEngine.cellExists({}, 'GL', '2024-Q1', '1000', 'debit')).toBe(false);
    });
  });

  // ===========================================================================
  // evaluateSimpleFormula
  // ===========================================================================

  describe('evaluateSimpleFormula', () => {
    it('should evaluate simple comparison', () => {
      expect(ValidationEngine.evaluateSimpleFormula('a > b', { a: 10, b: 5 })).toBe(true);
      expect(ValidationEngine.evaluateSimpleFormula('a > b', { a: 3, b: 5 })).toBe(false);
    });

    it('should evaluate arithmetic expressions', () => {
      expect(ValidationEngine.evaluateSimpleFormula('a + b == 15', { a: 10, b: 5 })).toBe(true);
      expect(ValidationEngine.evaluateSimpleFormula('a * 2 > b', { a: 10, b: 15 })).toBe(true);
    });

    it('should handle division', () => {
      expect(
        ValidationEngine.evaluateSimpleFormula('a / b <= 0.5', {
          a: 50,
          b: 200,
        })
      ).toBe(true);
    });

    it('should return false for invalid expressions', () => {
      expect(ValidationEngine.evaluateSimpleFormula('invalid!!!', { a: 1 })).toBe(false);
    });

    it('should handle >= and <= operators', () => {
      expect(ValidationEngine.evaluateSimpleFormula('a >= 10', { a: 10 })).toBe(true);
      expect(ValidationEngine.evaluateSimpleFormula('a <= 10', { a: 10 })).toBe(true);
      expect(ValidationEngine.evaluateSimpleFormula('a >= 10', { a: 9 })).toBe(false);
    });

    it('should handle parentheses', () => {
      expect(
        ValidationEngine.evaluateSimpleFormula('(a + b) * c == 30', {
          a: 2,
          b: 3,
          c: 6,
        })
      ).toBe(true);
    });
  });

  // ===========================================================================
  // Edge cases
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle unknown rule type gracefully', () => {
      const rule = {
        id: 'bad',
        name: 'Bad',
        type: 'unknown_type' as ValidationRuleType,
        config: { type: 'unknown_type' } as unknown as ValidationRule['config'],
        severity: 'error' as const,
        isActive: true,
      };

      const result = ValidationEngine.validateRule(rule, {});
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Unknown rule type');
    });

    it('should handle missing cube data in range check', () => {
      const rule = makeRule({
        id: 'missing-cube',
        config: {
          type: 'range',
          cube: 'MISSING',
          accounts: ['a'],
          periods: ['p'],
          measure: 'v',
          min: 0,
          max: 100,
        } satisfies RangeCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, {});
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle missing cube data in growth check', () => {
      const rule = makeRule({
        id: 'missing-growth',
        config: {
          type: 'growth',
          cube: 'MISSING',
          account: 'a',
          periods: ['p1', 'p2'],
          measure: 'v',
          maxGrowthPct: 50,
        } satisfies GrowthCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, {});
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle missing cube data in cross check', () => {
      const rule = makeRule({
        id: 'missing-cross',
        config: {
          type: 'cross',
          cube: 'MISSING',
          numeratorAccount: 'a',
          denominatorAccount: 'b',
          periods: ['p'],
          measure: 'v',
          expectedRatio: 0.25,
          tolerancePct: 5,
        } satisfies CrossCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, {});
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle missing cube data in completeness check', () => {
      const rule = makeRule({
        id: 'missing-comp',
        config: {
          type: 'completeness',
          cube: 'MISSING',
          accounts: ['a'],
          periods: ['p'],
          measure: 'v',
        } satisfies CompletenessCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, {});
      expect(result.passed).toBe(false);
      expect(result.affectedCells).toHaveLength(1);
      expect(result!.affectedCells[0]!.row).toBe('p');
      expect(result!.affectedCells[0]!.col).toBe('a');
    });

    it('should handle zero tolerance in cross check', () => {
      const rule = makeRule({
        id: 'zero-tol',
        config: {
          type: 'cross',
          cube: 'FIN',
          numeratorAccount: 'tax',
          denominatorAccount: 'income',
          periods: ['2024-Q1'],
          measure: 'actual',
          expectedRatio: 0.25,
          tolerancePct: 0,
        } satisfies CrossCheckConfig,
      });

      const data = makeCellData([
        { cube: 'FIN', row: '2024-Q1', col: 'income', measure: 'actual', value: 200000 },
        { cube: 'FIN', row: '2024-Q1', col: 'tax', measure: 'actual', value: 50000 },
      ]);

      const result = ValidationEngine.validateRule(rule, data);
      expect(result.passed).toBe(true); // 50000/200000 = 0.25 exactly
    });

    it('should include timestamp in results', () => {
      const rule = makeRule({
        id: 'ts',
        config: {
          type: 'completeness',
          cube: 'X',
          accounts: ['a'],
          periods: ['p'],
          measure: 'v',
        } satisfies CompletenessCheckConfig,
      });

      const result = ValidationEngine.validateRule(rule, {});
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should include timestamp in report', () => {
      const report = ValidationEngine.validate([], {});
      expect(report.timestamp).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Performance test
  // ===========================================================================

  describe('performance', () => {
    it('should validate 1000 cells in under 10ms', () => {
      // Generate 1000 cells across 100 accounts x 10 periods
      const entries: Array<{
        cube: string;
        row: string;
        col: string;
        measure: string;
        value: number;
      }> = [];

      for (let a = 0; a < 100; a++) {
        for (let p = 0; p < 10; p++) {
          entries.push({
            cube: 'PERF',
            row: `period-${p}`,
            col: `account-${a}`,
            measure: 'actual',
            value: Math.random() * 1000,
          });
        }
      }

      const data = makeCellData(entries);

      // Create rules that touch all cells
      const rules: ValidationRule[] = [
        makeRule({
          id: 'perf-range',
          config: {
            type: 'range',
            cube: 'PERF',
            accounts: Array.from({ length: 100 }, (_, i) => `account-${i}`),
            periods: Array.from({ length: 10 }, (_, i) => `period-${i}`),
            measure: 'actual',
            min: 0,
            max: 1000,
          } satisfies RangeCheckConfig,
        }),
        makeRule({
          id: 'perf-complete',
          config: {
            type: 'completeness',
            cube: 'PERF',
            accounts: Array.from({ length: 100 }, (_, i) => `account-${i}`),
            periods: Array.from({ length: 10 }, (_, i) => `period-${i}`),
            measure: 'actual',
          } satisfies CompletenessCheckConfig,
        }),
      ];

      const start = performance.now();
      const report = ValidationEngine.validate(rules, data);
      const elapsed = performance.now() - start;

      expect(report.results).toHaveLength(2);
      expect(elapsed).toBeLessThan(10);
    });
  });
});
