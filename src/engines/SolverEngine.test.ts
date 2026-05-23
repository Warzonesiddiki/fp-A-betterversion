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

    it('should return variable values', () => {
      const result = SolverEngine.solveLP({
        objective: { coefficients: [1, 1], direction: 'maximize' },
        constraints: [
          { coefficients: [1, 0], operator: '<=', rhs: 5 },
          { coefficients: [0, 1], operator: '<=', rhs: 3 },
        ],
      });
      expect(result.variableValues).toBeDefined();
      expect(result.variableValues.length).toBe(2);
    });

    it('should report iterations', () => {
      const result = SolverEngine.solveLP({
        objective: { coefficients: [1, 1], direction: 'maximize' },
        constraints: [
          { coefficients: [1, 0], operator: '<=', rhs: 10 },
          { coefficients: [0, 1], operator: '<=', rhs: 10 },
        ],
      });
      expect(result.iterations).toBeGreaterThan(0);
    });
  });
});
