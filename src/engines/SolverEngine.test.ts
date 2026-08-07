import { describe, it, expect } from 'vitest';
import { SolverEngine } from './SolverEngine';

describe('SolverEngine', () => {
  describe('solveLP', () => {
    it('should solve simple maximization problem', () => {
      const result = SolverEngine.solveLP({
        objective: { coefficients: [3, 5], direction: 'maximize' },
        constraints: [
          { coefficients: [1, 0], operator: '<=', rhs: 4 },
          { coefficients: [0, 1], operator: '<=', rhs: 6 },
          { coefficients: [1, 1], operator: '<=', rhs: 8 },
        ],
      });
      expect(result.feasible).toBe(true);
      expect(result.objectiveValue).toBeGreaterThan(0);
      expect(result.optimal).toBe(true);
    });

    it('should solve simple minimization problem', () => {
      const result = SolverEngine.solveLP({
        objective: { coefficients: [2, 3], direction: 'minimize' },
        constraints: [
          { coefficients: [1, 0], operator: '>=', rhs: 1 },
          { coefficients: [0, 1], operator: '>=', rhs: 1 },
        ],
      });
      expect(result.feasible).toBe(true);
    });

    it('should return feasible for in-range constraints', () => {
      const result = SolverEngine.solveLP({
        objective: { coefficients: [1, 1], direction: 'maximize' },
        constraints: [
          { coefficients: [1, 0], operator: '<=', rhs: 10 },
          { coefficients: [0, 1], operator: '<=', rhs: 10 },
        ],
      });
      expect(result.feasible).toBe(true);
    });

    it('should handle equality constraints', () => {
      const result = SolverEngine.solveLP({
        objective: { coefficients: [1, 0], direction: 'maximize' },
        constraints: [{ coefficients: [1, 1], operator: '=', rhs: 10 }],
      });
      expect(result.feasible).toBe(true);
    });

    it('should return variable values and iteration count', () => {
      const result = SolverEngine.solveLP({
        objective: { coefficients: [1, 1], direction: 'maximize' },
        constraints: [
          { coefficients: [1, 0], operator: '<=', rhs: 5 },
          { coefficients: [0, 1], operator: '<=', rhs: 3 },
        ],
      });
      expect(result.variableValues).toBeDefined();
      expect(result.variableValues.length).toBe(2);
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('detects infeasible/unbounded programs when leaving row is not found', () => {
      const result = SolverEngine.solveLP({
        objective: { coefficients: [1, 1], direction: 'maximize' },
        constraints: [{ coefficients: [-1, -1], operator: '<=', rhs: 10 }],
      });
      expect(result.feasible).toBe(false);
      expect(result.optimal).toBe(false);
    });
  });

  describe('allocateBudget', () => {
    it('allocates budget by minimums first and remaining by priority', () => {
      const items = [
        { name: 'Engineering', minAllocation: 1000, maxAllocation: 5000, priority: 10 },
        { name: 'Marketing', minAllocation: 500, maxAllocation: 3000, priority: 5 },
        { name: 'G&A', minAllocation: 200, maxAllocation: 1000, priority: 1 },
      ];

      const allocations = SolverEngine.allocateBudget(4000, items);

      expect(allocations).toHaveLength(3);
      const eng = allocations.find((a) => a.name === 'Engineering')!;
      const mkt = allocations.find((a) => a.name === 'Marketing')!;
      const ga = allocations.find((a) => a.name === 'G&A')!;

      // Min allocations = 1000 + 500 + 200 = 1700. Remaining = 2300.
      // Priority goes to Engineering (needs +4000 max -> gets remaining 2300 = 3300).
      expect(eng.allocation).toBe(3300);
      expect(mkt.allocation).toBe(500);
      expect(ga.allocation).toBe(200);
      expect(eng.percentage).toBeCloseTo((3300 / 4000) * 100, 2);
    });

    it('handles total budget of 0', () => {
      const allocations = SolverEngine.allocateBudget(0, [
        { name: 'Item1', minAllocation: 100, maxAllocation: 500, priority: 1 },
      ]);
      expect(allocations[0]!.allocation).toBe(0);
      expect(allocations[0]!.percentage).toBe(0);
    });
  });

  describe('solveLinearSystem', () => {
    it('solves 3x3 system of linear equations Ax = b with partial pivoting', () => {
      // 2x + y - z = 8
      // -3x - y + 2z = -11
      // -2x + y + 2z = -3
      const A = [
        [2, 1, -1],
        [-3, -1, 2],
        [-2, 1, 2],
      ];
      const b = [8, -11, -3];

      const x = SolverEngine.solveLinearSystem(A, b);
      expect(x).toBeDefined();
      expect(x![0]).toBeCloseTo(2, 4);
      expect(x![1]).toBeCloseTo(3, 4);
      expect(x![2]).toBeCloseTo(-1, 4);
    });

    it('returns null for singular or dimension mismatched matrices', () => {
      expect(SolverEngine.solveLinearSystem([], [])).toBeNull();
      expect(SolverEngine.solveLinearSystem([[1, 2]], [1, 2])).toBeNull();

      // Singular matrix
      const singularA = [
        [1, 2],
        [2, 4],
      ];
      expect(SolverEngine.solveLinearSystem(singularA, [3, 6])).toBeNull();
    });
  });
});
