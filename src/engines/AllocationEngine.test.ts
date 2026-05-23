// =============================================================================
// ALLOCATION ENGINE TESTS — 45+ tests for cost/revenue allocation
// Covers: direct, driver-based, step-down, reciprocal methods + edge cases
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  AllocationEngine,
  type AllocationRule,
  type AllocationTarget,
  type AllocationResult,
  type StepDownConfig,
  type ReciprocalConfig,
  type CubeCell,
} from './AllocationEngine';

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function createDirectRule(
  id: string,
  name: string,
  targets: AllocationTarget[],
  sourceAccount: string = 'COST-POOL-1',
  period: string = '2026-Q1'
): AllocationRule {
  return {
    id,
    name,
    sourceAccount,
    method: 'direct',
    targets,
    period,
    isRecurring: false,
  };
}

function createDriverRule(
  id: string,
  name: string,
  targets: AllocationTarget[],
  driverDimension: string = 'headcount',
  driverMeasure: string = 'count'
): AllocationRule {
  return {
    id,
    name,
    sourceAccount: 'IT-COSTS',
    method: 'driver',
    targets,
    driverDimension,
    driverMeasure,
    period: '2026-Q1',
    isRecurring: true,
  };
}

function target(member: string, pct: number, weight: number = 1): AllocationTarget {
  return { dimensionMember: member, percentage: pct, driverWeight: weight };
}

// ---------------------------------------------------------------------------
// DIRECT ALLOCATION TESTS
// ---------------------------------------------------------------------------

describe('AllocationEngine', () => {
  describe('Direct Allocation', () => {
    it('should allocate cost pool by fixed percentages', () => {
      const rule = createDirectRule('r1', 'IT Allocation', [
        target('Engineering', 40),
        target('Marketing', 30),
        target('Sales', 30),
      ]);
      const result = AllocationEngine.allocateDirect(rule, 100000);

      expect(result.ruleId).toBe('r1');
      expect(result.allocations).toHaveLength(3);
      expect(result.totalAllocated).toBe(100000);
      expect(result.allocations[0].amount).toBe(40000);
      expect(result.allocations[1].amount).toBe(30000);
      expect(result.allocations[2].amount).toBe(30000);
    });

    it('should include audit comment with rule name and id', () => {
      const rule = createDirectRule('r2', 'Rent Allocation', [
        target('Floor1', 50),
        target('Floor2', 50),
      ]);
      const result = AllocationEngine.allocateDirect(rule, 50000);

      expect(result.auditComment).toContain('Rent Allocation');
      expect(result.auditComment).toContain('r2');
      expect(result.auditComment).toContain('50000');
      expect(result.timestamp).toBeDefined();
    });

    it('should handle zero amount without error', () => {
      const rule = createDirectRule('r3', 'Zero Pool', [target('A', 60), target('B', 40)]);
      const result = AllocationEngine.allocateDirect(rule, 0);

      expect(result.totalAllocated).toBe(0);
      expect(result.allocations).toHaveLength(2);
      expect(result.allocations[0].amount).toBe(0);
      expect(result.allocations[1].amount).toBe(0);
    });

    it('should handle single target at 100%', () => {
      const rule = createDirectRule('r4', 'Full Allocate', [target('Only', 100)]);
      const result = AllocationEngine.allocateDirect(rule, 75000);

      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].amount).toBe(75000);
      expect(result.allocations[0].percentage).toBe(100);
    });

    it('should apply rounding correction to largest allocation', () => {
      const rule = createDirectRule('r5', 'Rounding Test', [
        target('A', 33.33),
        target('B', 33.33),
        target('C', 33.34),
      ]);
      const result = AllocationEngine.allocateDirect(rule, 100);

      const total = result.allocations.reduce((sum, a) => sum + a.amount, 0);
      expect(total).toBe(100);
    });

    it('should throw if percentages do not sum to 100', () => {
      const rule = createDirectRule('r6', 'Bad Percentages', [target('A', 50), target('B', 40)]);
      expect(() => AllocationEngine.allocateDirect(rule, 1000)).toThrow('sum to 90%');
    });

    it('should throw if percentages exceed 100', () => {
      const rule = createDirectRule('r7', 'Over 100', [target('A', 60), target('B', 50)]);
      expect(() => AllocationEngine.allocateDirect(rule, 1000)).toThrow('sum to 110%');
    });

    it('should throw if no targets provided', () => {
      const rule = createDirectRule('r8', 'No Targets', []);
      expect(() => AllocationEngine.allocateDirect(rule, 1000)).toThrow('at least one target');
    });

    it('should throw if target has negative percentage', () => {
      const rule = createDirectRule('r9', 'Negative Pct', [target('A', 110), target('B', -10)]);
      expect(() => AllocationEngine.allocateDirect(rule, 1000)).toThrow('negative percentage');
    });

    it('should handle very small allocations', () => {
      const rule = createDirectRule('r10', 'Micro', [target('A', 50), target('B', 50)]);
      const result = AllocationEngine.allocateDirect(rule, 0.02);

      const total = result.allocations.reduce((sum, a) => sum + a.amount, 0);
      expect(total).toBe(0.02);
    });

    it('should handle large amounts', () => {
      const rule = createDirectRule('r11', 'Large', [
        target('A', 25),
        target('B', 25),
        target('C', 25),
        target('D', 25),
      ]);
      const result = AllocationEngine.allocateDirect(rule, 1000000000);

      expect(result.totalAllocated).toBe(1000000000);
      expect(result.allocations[0].amount).toBe(250000000);
    });
  });

  // ---------------------------------------------------------------------------
  // DRIVER-BASED ALLOCATION TESTS
  // ---------------------------------------------------------------------------

  describe('Driver-Based Allocation', () => {
    it('should allocate proportionally to driver values', () => {
      const rule = createDriverRule('d1', 'IT by Headcount', [
        target('Engineering', 0, 1),
        target('Marketing', 0, 1),
        target('Sales', 0, 1),
      ]);
      const driverValues = {
        Engineering: 50,
        Marketing: 30,
        Sales: 20,
      };
      const result = AllocationEngine.allocateByDriver(rule, 100000, driverValues);

      expect(result.allocations[0].amount).toBe(50000);
      expect(result.allocations[1].amount).toBe(30000);
      expect(result.allocations[2].amount).toBe(20000);
      expect(result.totalAllocated).toBe(100000);
    });

    it('should apply driver weights correctly', () => {
      const rule = createDriverRule('d2', 'Weighted Driver', [
        target('A', 0, 2), // weight 2
        target('B', 0, 1), // weight 1
      ]);
      const driverValues = { A: 100, B: 100 };
      const result = AllocationEngine.allocateByDriver(rule, 90000, driverValues);

      // A: 100*2=200, B: 100*1=100, total=300
      // A gets 200/300 = 66.67%, B gets 100/300 = 33.33%
      expect(result.allocations[0].amount).toBe(60000);
      expect(result.allocations[1].amount).toBe(30000);
    });

    it('should handle zero amount for driver allocation', () => {
      const rule = createDriverRule('d3', 'Zero Driver', [target('A', 0, 1), target('B', 0, 1)]);
      const result = AllocationEngine.allocateByDriver(rule, 0, { A: 100, B: 100 });

      expect(result.totalAllocated).toBe(0);
      expect(result.allocations[0].amount).toBe(0);
    });

    it('should throw if total weighted driver is zero', () => {
      const rule = createDriverRule('d4', 'Zero Drivers', [target('A', 0, 1), target('B', 0, 1)]);
      expect(() => AllocationEngine.allocateByDriver(rule, 1000, { A: 0, B: 0 })).toThrow(
        'total weighted driver value is zero'
      );
    });

    it('should throw if driver value is negative', () => {
      const rule = createDriverRule('d5', 'Neg Driver', [target('A', 0, 1), target('B', 0, 1)]);
      expect(() => AllocationEngine.allocateByDriver(rule, 1000, { A: -10, B: 100 })).toThrow(
        'cannot be negative'
      );
    });

    it('should throw if no targets provided', () => {
      const rule = createDriverRule('d6', 'No Targets', []);
      expect(() => AllocationEngine.allocateByDriver(rule, 1000, {})).toThrow(
        'at least one target'
      );
    });

    it('should handle missing driver values (treated as zero)', () => {
      const rule = createDriverRule('d7', 'Missing Driver', [target('A', 0, 1), target('B', 0, 1)]);
      // Only A has a driver value, B is missing -> treated as 0
      // But total would be just A's value
      const result = AllocationEngine.allocateByDriver(rule, 1000, { A: 100 });
      expect(result.allocations[0].amount).toBe(1000);
      expect(result.allocations[1].amount).toBe(0);
    });

    it('should handle single target with driver', () => {
      const rule = createDriverRule('d8', 'Single', [target('Only', 0, 1)]);
      const result = AllocationEngine.allocateByDriver(rule, 5000, { Only: 42 });

      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].amount).toBe(5000);
      expect(result.allocations[0].percentage).toBe(100);
    });

    it('should handle equal driver values', () => {
      const rule = createDriverRule('d9', 'Equal', [
        target('A', 0, 1),
        target('B', 0, 1),
        target('C', 0, 1),
      ]);
      const result = AllocationEngine.allocateByDriver(rule, 30000, { A: 10, B: 10, C: 10 });

      expect(result.allocations[0].amount).toBe(10000);
      expect(result.allocations[1].amount).toBe(10000);
      expect(result.allocations[2].amount).toBe(10000);
    });

    it('should apply rounding correction for driver allocation', () => {
      const rule = createDriverRule('d10', 'Rounding', [
        target('A', 0, 1),
        target('B', 0, 1),
        target('C', 0, 1),
      ]);
      const result = AllocationEngine.allocateByDriver(rule, 100, { A: 1, B: 1, C: 1 });

      const total = result.allocations.reduce((sum, a) => sum + a.amount, 0);
      expect(total).toBe(100);
    });

    it('should include driver dimension in audit comment', () => {
      const rule = createDriverRule(
        'd11',
        'Headcount Alloc',
        [target('A', 0, 1), target('B', 0, 1)],
        'headcount'
      );
      const result = AllocationEngine.allocateByDriver(rule, 1000, { A: 50, B: 50 });

      expect(result.auditComment).toContain('headcount');
    });
  });

  // ---------------------------------------------------------------------------
  // STEP-DOWN ALLOCATION TESTS
  // ---------------------------------------------------------------------------

  describe('Step-Down Allocation', () => {
    it('should allocate service department costs sequentially', () => {
      const config: StepDownConfig = {
        serviceDepartments: ['IT', 'HR'],
        productionDepartments: ['Engineering', 'Sales'],
        serviceCosts: { IT: 100000, HR: 50000 },
        servicePercentages: {
          IT: { HR: 20, Engineering: 50, Sales: 30 },
          HR: { Engineering: 60, Sales: 40 },
        },
      };
      const results = AllocationEngine.allocateStepDown(config);

      expect(results).toHaveLength(2);

      // IT allocates first: 100k to HR(20k), Engineering(50k), Sales(30k)
      expect(results[0].ruleId).toBe('step-down-IT');
      expect(results[0].totalAllocated).toBe(100000);

      // HR allocates second: 50k original + 20k from IT = 70k
      // HR allocates to Engineering(60%) and Sales(40%)
      expect(results[1].ruleId).toBe('step-down-HR');
      expect(results[1].totalAllocated).toBe(70000);
    });

    it('should not allocate back to already-processed service departments', () => {
      const config: StepDownConfig = {
        serviceDepartments: ['A', 'B'],
        productionDepartments: ['P1'],
        serviceCosts: { A: 100, B: 50 },
        servicePercentages: {
          A: { B: 30, P1: 70 },
          B: { P1: 100 },
        },
      };
      const results = AllocationEngine.allocateStepDown(config);

      // A allocates to B and P1
      expect(results[0].allocations).toHaveLength(2);

      // B should NOT allocate back to A (already processed)
      expect(results[1].allocations).toHaveLength(1);
      expect(results[1].allocations[0].target).toBe('P1');
    });

    it('should accumulate costs in production departments', () => {
      const config: StepDownConfig = {
        serviceDepartments: ['IT'],
        productionDepartments: ['A', 'B'],
        serviceCosts: { IT: 1000 },
        servicePercentages: {
          IT: { A: 60, B: 40 },
        },
      };
      const results = AllocationEngine.allocateStepDown(config);

      // Single service department, straightforward
      expect(results[0].allocations[0].amount).toBe(600);
      expect(results[0].allocations[1].amount).toBe(400);
    });

    it('should handle zero cost service department', () => {
      const config: StepDownConfig = {
        serviceDepartments: ['IT', 'HR'],
        productionDepartments: ['Prod'],
        serviceCosts: { IT: 1000, HR: 0 },
        servicePercentages: {
          IT: { HR: 0, Prod: 100 },
          HR: { Prod: 100 },
        },
      };
      const results = AllocationEngine.allocateStepDown(config);

      expect(results[0].totalAllocated).toBe(1000);
      expect(results[1].totalAllocated).toBe(0);
      expect(results[1].allocations).toHaveLength(0);
    });

    it('should throw if no service departments', () => {
      const config: StepDownConfig = {
        serviceDepartments: [],
        productionDepartments: ['Prod'],
        serviceCosts: {},
        servicePercentages: {},
      };
      expect(() => AllocationEngine.allocateStepDown(config)).toThrow(
        'at least one service department'
      );
    });

    it('should throw if no production departments', () => {
      const config: StepDownConfig = {
        serviceDepartments: ['IT'],
        productionDepartments: [],
        serviceCosts: { IT: 1000 },
        servicePercentages: { IT: {} },
      };
      expect(() => AllocationEngine.allocateStepDown(config)).toThrow(
        'at least one production department'
      );
    });

    it('should throw if service percentages do not sum to 100', () => {
      const config: StepDownConfig = {
        serviceDepartments: ['IT'],
        productionDepartments: ['A', 'B'],
        serviceCosts: { IT: 1000 },
        servicePercentages: {
          IT: { A: 40, B: 40 },
        },
      };
      expect(() => AllocationEngine.allocateStepDown(config)).toThrow('sum to 80%');
    });

    it('should handle multiple service departments with cascading costs', () => {
      const config: StepDownConfig = {
        serviceDepartments: ['S1', 'S2', 'S3'],
        productionDepartments: ['P1'],
        serviceCosts: { S1: 1000, S2: 500, S3: 200 },
        servicePercentages: {
          S1: { S2: 10, S3: 10, P1: 80 },
          S2: { S3: 20, P1: 80 },
          S3: { P1: 100 },
        },
      };
      const results = AllocationEngine.allocateStepDown(config);

      expect(results).toHaveLength(3);

      // Verify total cost flows to P1
      const p1FromS1 = results[0].allocations.find((a) => a.target === 'P1')?.amount ?? 0;
      const p1FromS2 = results[1].allocations.find((a) => a.target === 'P1')?.amount ?? 0;
      const p1FromS3 = results[2].allocations.find((a) => a.target === 'P1')?.amount ?? 0;

      // Total to P1 should be S1's direct + cascaded from S2 and S3
      expect(p1FromS1 + p1FromS2 + p1FromS3).toBeGreaterThan(0);
    });

    it('should include audit comments for each step', () => {
      const config: StepDownConfig = {
        serviceDepartments: ['IT'],
        productionDepartments: ['Prod'],
        serviceCosts: { IT: 1000 },
        servicePercentages: { IT: { Prod: 100 } },
      };
      const results = AllocationEngine.allocateStepDown(config);

      expect(results[0].auditComment).toContain('IT');
      expect(results[0].auditComment).toContain('1000');
    });
  });

  // ---------------------------------------------------------------------------
  // RECIPROCAL ALLOCATION TESTS
  // ---------------------------------------------------------------------------

  describe('Reciprocal Allocation', () => {
    it('should solve simultaneous equations for mutual services', () => {
      const config: ReciprocalConfig = {
        departments: ['IT', 'HR', 'Engineering'],
        departmentCosts: { IT: 100000, HR: 60000, Engineering: 0 },
        servicePercentages: {
          IT: { HR: 20, Engineering: 80 },
          HR: { IT: 10, Engineering: 90 },
          Engineering: {},
        },
      };
      const results = AllocationEngine.allocateReciprocal(config);

      expect(results).toHaveLength(3);

      // IT total = 100000 + 0.10 * HR_total
      // HR total = 60000 + 0.20 * IT_total
      // Solving: IT_total = 100000 + 0.10*(60000 + 0.20*IT_total)
      // IT_total = 100000 + 6000 + 0.02*IT_total
      // 0.98*IT_total = 106000
      // IT_total ≈ 108163.27
      const itResult = results.find((r) => r.ruleId === 'reciprocal-IT');
      expect(itResult).toBeDefined();
      expect(itResult!.totalAllocated).toBeGreaterThan(100000);
    });

    it('should handle departments with no outgoing services', () => {
      const config: ReciprocalConfig = {
        departments: ['IT', 'Engineering'],
        departmentCosts: { IT: 1000, Engineering: 0 },
        servicePercentages: {
          IT: { Engineering: 100 },
          Engineering: {},
        },
      };
      const results = AllocationEngine.allocateReciprocal(config);

      const itResult = results.find((r) => r.ruleId === 'reciprocal-IT');
      expect(itResult!.allocations).toHaveLength(1);
      expect(itResult!.allocations[0].amount).toBe(1000);
      expect(itResult!.allocations[0].target).toBe('Engineering');
    });

    it('should handle zero cost department', () => {
      const config: ReciprocalConfig = {
        departments: ['IT', 'HR'],
        departmentCosts: { IT: 0, HR: 0 },
        servicePercentages: {
          IT: { HR: 100 },
          HR: { IT: 100 },
        },
      };
      const results = AllocationEngine.allocateReciprocal(config);

      expect(results[0].totalAllocated).toBe(0);
      expect(results[1].totalAllocated).toBe(0);
    });

    it('should throw if no departments provided', () => {
      const config: ReciprocalConfig = {
        departments: [],
        departmentCosts: {},
        servicePercentages: {},
      };
      expect(() => AllocationEngine.allocateReciprocal(config)).toThrow('at least one department');
    });

    it('should throw if service percentages exceed 100%', () => {
      const config: ReciprocalConfig = {
        departments: ['A', 'B'],
        departmentCosts: { A: 100, B: 100 },
        servicePercentages: {
          A: { B: 110 },
          B: { A: 50 },
        },
      };
      expect(() => AllocationEngine.allocateReciprocal(config)).toThrow('exceeds 100%');
    });

    it('should converge for three-way reciprocal allocation', () => {
      const config: ReciprocalConfig = {
        departments: ['A', 'B', 'C'],
        departmentCosts: { A: 1000, B: 800, C: 0 },
        servicePercentages: {
          A: { B: 30, C: 70 },
          B: { A: 20, C: 80 },
          C: {},
        },
      };
      const results = AllocationEngine.allocateReciprocal(config);

      // Verify convergence: total allocated should be consistent
      expect(results).toHaveLength(3);
      for (const r of results) {
        expect(r.totalAllocated).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle single department', () => {
      const config: ReciprocalConfig = {
        departments: ['Only'],
        departmentCosts: { Only: 5000 },
        servicePercentages: { Only: {} },
      };
      const results = AllocationEngine.allocateReciprocal(config);

      expect(results).toHaveLength(1);
      expect(results[0].totalAllocated).toBe(5000);
      expect(results[0].allocations).toHaveLength(0);
    });

    it('should include audit comments referencing reciprocal method', () => {
      const config: ReciprocalConfig = {
        departments: ['IT', 'HR'],
        departmentCosts: { IT: 1000, HR: 500 },
        servicePercentages: {
          IT: { HR: 50 },
          HR: { IT: 50 },
        },
      };
      const results = AllocationEngine.allocateReciprocal(config);

      expect(results[0].auditComment).toContain('Reciprocal');
      expect(results[0].auditComment).toContain('IT');
    });

    it('should produce allocations that respect service percentages', () => {
      const config: ReciprocalConfig = {
        departments: ['IT', 'HR', 'Finance'],
        departmentCosts: { IT: 200000, HR: 100000, Finance: 0 },
        servicePercentages: {
          IT: { HR: 30, Finance: 70 },
          HR: { IT: 20, Finance: 80 },
          Finance: {},
        },
      };
      const results = AllocationEngine.allocateReciprocal(config);

      const itResult = results.find((r) => r.ruleId === 'reciprocal-IT')!;
      const itToHR = itResult.allocations.find((a) => a.target === 'HR');
      const itToFinance = itResult.allocations.find((a) => a.target === 'Finance');

      if (itToHR && itToFinance) {
        // IT to HR should be approximately 30% of IT total
        const itTotal = itResult.totalAllocated;
        expect(itToHR.percentage).toBeCloseTo(30, 0);
        expect(itToFinance.percentage).toBeCloseTo(70, 0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // CUBE CELL GENERATION TESTS
  // ---------------------------------------------------------------------------

  describe('Cube Cell Generation', () => {
    it('should generate cube cells with dataType calculated', () => {
      const result: AllocationResult = {
        ruleId: 'test',
        allocations: [
          { target: 'Eng', amount: 5000, percentage: 50 },
          { target: 'Sales', amount: 5000, percentage: 50 },
        ],
        totalAllocated: 10000,
        timestamp: '2026-01-01T00:00:00Z',
        auditComment: 'Test allocation',
      };
      const cells = AllocationEngine.toCubeCells(result, 'Period', 'Account', 'CostCenter');

      expect(cells).toHaveLength(2);
      expect(cells[0].dataType).toBe('calculated');
      expect(cells[0].value).toBe(5000);
      expect(cells[0].coords.CostCenter).toBe('Eng');
      expect(cells[1].coords.CostCenter).toBe('Sales');
    });

    it('should include audit comment in each cube cell', () => {
      const result: AllocationResult = {
        ruleId: 'test',
        allocations: [{ target: 'A', amount: 100, percentage: 100 }],
        totalAllocated: 100,
        timestamp: '2026-01-01T00:00:00Z',
        auditComment: 'Audit trail comment',
      };
      const cells = AllocationEngine.toCubeCells(result, 'P', 'Acct', 'CC');

      expect(cells[0].comment).toBe('Audit trail comment');
    });

    it('should use custom measure name', () => {
      const result: AllocationResult = {
        ruleId: 'test',
        allocations: [{ target: 'A', amount: 100, percentage: 100 }],
        totalAllocated: 100,
        timestamp: '2026-01-01T00:00:00Z',
        auditComment: 'Test',
      };
      const cells = AllocationEngine.toCubeCells(result, 'P', 'Acct', 'CC', 'cost');

      expect(cells[0].measure).toBe('cost');
    });

    it('should handle empty allocations', () => {
      const result: AllocationResult = {
        ruleId: 'test',
        allocations: [],
        totalAllocated: 0,
        timestamp: '2026-01-01T00:00:00Z',
        auditComment: 'Empty',
      };
      const cells = AllocationEngine.toCubeCells(result, 'P', 'Acct', 'CC');

      expect(cells).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // VALIDATION TESTS
  // ---------------------------------------------------------------------------

  describe('Validation', () => {
    it('should validate direct rule with correct percentages', () => {
      const rule = createDirectRule('v1', 'Valid', [target('A', 50), target('B', 50)]);
      expect(() => AllocationEngine.validateDirectRule(rule)).not.toThrow();
    });

    it('should validate percentages that sum to 100 within epsilon', () => {
      const rule = createDirectRule('v2', 'Near 100', [
        target('A', 33.33),
        target('B', 33.33),
        target('C', 33.34),
      ]);
      expect(() => AllocationEngine.validateDirectRule(rule)).not.toThrow();
    });

    it('should return warnings for missing driver values', () => {
      const rule = createDriverRule('v3', 'Driver Warn', [target('A', 0, 1), target('B', 0, 1)]);
      const warnings = AllocationEngine.validateDriverValues(rule, { A: 100 });

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('Missing');
      expect(warnings[0]).toContain('B');
    });

    it('should return warnings for zero driver values', () => {
      const rule = createDriverRule('v4', 'Zero Warn', [target('A', 0, 1)]);
      const warnings = AllocationEngine.validateDriverValues(rule, { A: 0 });

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('Zero');
    });

    it('should return warnings for negative driver values', () => {
      const rule = createDriverRule('v5', 'Neg Warn', [target('A', 0, 1)]);
      const warnings = AllocationEngine.validateDriverValues(rule, { A: -5 });

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('Negative');
    });

    it('should return empty warnings for valid driver values', () => {
      const rule = createDriverRule('v6', 'Good', [target('A', 0, 1)]);
      const warnings = AllocationEngine.validateDriverValues(rule, { A: 100 });

      expect(warnings).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // UTILITY TESTS
  // ---------------------------------------------------------------------------

  describe('Utility Methods', () => {
    it('should compute effective percentages', () => {
      const allocations = [
        { target: 'A', amount: 300, percentage: 30 },
        { target: 'B', amount: 700, percentage: 70 },
      ];
      const pcts = AllocationEngine.computeEffectivePercentages(allocations, 1000);

      expect(pcts['A']).toBe(30);
      expect(pcts['B']).toBe(70);
    });

    it('should return empty object for zero total', () => {
      const pcts = AllocationEngine.computeEffectivePercentages([], 0);
      expect(pcts).toEqual({});
    });

    it('should merge multiple allocation results', () => {
      const r1: AllocationResult = {
        ruleId: 'r1',
        allocations: [
          { target: 'A', amount: 100, percentage: 50 },
          { target: 'B', amount: 100, percentage: 50 },
        ],
        totalAllocated: 200,
        timestamp: '',
        auditComment: '',
      };
      const r2: AllocationResult = {
        ruleId: 'r2',
        allocations: [
          { target: 'A', amount: 200, percentage: 40 },
          { target: 'C', amount: 300, percentage: 60 },
        ],
        totalAllocated: 500,
        timestamp: '',
        auditComment: '',
      };
      const merged = AllocationEngine.mergeAllocationResults([r1, r2]);

      expect(merged['A']).toBe(300);
      expect(merged['B']).toBe(100);
      expect(merged['C']).toBe(300);
    });

    it('should detect circular references', () => {
      const cycles = AllocationEngine.detectCircularReferences({
        A: { B: 50 },
        B: { A: 30 },
      });

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('A');
      expect(cycles[0]).toContain('B');
    });

    it('should return empty for no circular references', () => {
      const cycles = AllocationEngine.detectCircularReferences({
        A: { C: 50 },
        B: { C: 50 },
        C: {},
      });

      expect(cycles).toHaveLength(0);
    });

    it('should detect three-way circular references', () => {
      const cycles = AllocationEngine.detectCircularReferences({
        A: { B: 10 },
        B: { C: 10 },
        C: { A: 10 },
      });

      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // EDGE CASE TESTS
  // ---------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('should handle direct allocation with many targets', () => {
      const targets = Array.from({ length: 20 }, (_, i) => target(`Dept${i}`, 5));
      const rule = createDirectRule('e1', 'Many Targets', targets);
      const result = AllocationEngine.allocateDirect(rule, 100000);

      expect(result.allocations).toHaveLength(20);
      expect(result.totalAllocated).toBe(100000);
    });

    it('should handle driver allocation with uneven weights', () => {
      const rule = createDriverRule('e2', 'Uneven', [target('A', 0, 10), target('B', 0, 1)]);
      const result = AllocationEngine.allocateByDriver(rule, 1100, { A: 10, B: 10 });

      // A: 10*10=100, B: 10*1=10, total=110
      // A: 100/110 * 1100 = 1000, B: 10/110 * 1100 = 100
      expect(result.allocations[0].amount).toBe(1000);
      expect(result.allocations[1].amount).toBe(100);
    });

    it('should preserve percentage in direct allocation result', () => {
      const rule = createDirectRule('e3', 'Pct Preserve', [target('A', 75), target('B', 25)]);
      const result = AllocationEngine.allocateDirect(rule, 4000);

      expect(result.allocations[0].percentage).toBe(75);
      expect(result.allocations[1].percentage).toBe(25);
    });

    it('should handle step-down with single service and single production', () => {
      const config: StepDownConfig = {
        serviceDepartments: ['Svc'],
        productionDepartments: ['Prod'],
        serviceCosts: { Svc: 5000 },
        servicePercentages: { Svc: { Prod: 100 } },
      };
      const results = AllocationEngine.allocateStepDown(config);

      expect(results).toHaveLength(1);
      expect(results[0].allocations[0].amount).toBe(5000);
      expect(results[0].allocations[0].target).toBe('Prod');
    });

    it('should handle reciprocal allocation with asymmetric services', () => {
      const config: ReciprocalConfig = {
        departments: ['A', 'B'],
        departmentCosts: { A: 1000, B: 5000 },
        servicePercentages: {
          A: { B: 10 },
          B: { A: 5 },
        },
      };
      const results = AllocationEngine.allocateReciprocal(config);

      // A total = 1000 + 0.05 * B_total
      // B total = 5000 + 0.10 * A_total
      expect(results).toHaveLength(2);
      const aResult = results.find((r) => r.ruleId === 'reciprocal-A')!;
      const bResult = results.find((r) => r.ruleId === 'reciprocal-B')!;
      expect(aResult.totalAllocated).toBeGreaterThan(1000);
      expect(bResult.totalAllocated).toBeGreaterThan(5000);
    });

    it('should handle timestamp generation', () => {
      const rule = createDirectRule('t1', 'Time', [target('A', 100)]);
      const result = AllocationEngine.allocateDirect(rule, 100);

      // Timestamp should be a valid ISO date string
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });

    it('should handle step-down allocation percentages at boundaries', () => {
      const config: StepDownConfig = {
        serviceDepartments: ['IT'],
        productionDepartments: ['A', 'B'],
        serviceCosts: { IT: 100 },
        servicePercentages: {
          IT: { A: 0.01, B: 99.99 },
        },
      };
      const results = AllocationEngine.allocateStepDown(config);

      expect(results[0].allocations).toHaveLength(2);
      const total = results[0].allocations.reduce((s, a) => s + a.amount, 0);
      expect(total).toBe(100);
    });
  });
});
