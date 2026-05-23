import { describe, it, expect } from 'vitest';
import { GoalSeekEngine } from './GoalSeekEngine';

describe('GoalSeekEngine', () => {
  describe('seek', () => {
    it('should find x for simple linear function', () => {
      const result = GoalSeekEngine.seek({
        fn: (x) => x * 2,
        target: 10,
        initialGuess: 1,
      });
      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(5, 6);
    });

    it('should find x for quadratic function', () => {
      const result = GoalSeekEngine.seek({
        fn: (x) => x * x,
        target: 25,
        initialGuess: 3,
      });
      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(5, 4);
    });

    it('should find x for cubic function', () => {
      const result = GoalSeekEngine.seek({
        fn: (x) => x * x * x,
        target: 27,
        initialGuess: 2,
      });
      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(3, 3);
    });

    it('should handle target at zero', () => {
      const result = GoalSeekEngine.seek({
        fn: (x) => x + 5,
        target: 0,
        initialGuess: 0,
      });
      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(-5, 6);
    });

    it('should handle negative target', () => {
      const result = GoalSeekEngine.seek({
        fn: (x) => x * 3,
        target: -15,
        initialGuess: 0,
      });
      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(-5, 6);
    });

    it('should report iterations', () => {
      const result = GoalSeekEngine.seek({
        fn: (x) => x * x,
        target: 100,
        initialGuess: 5,
      });
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('should report final output close to target', () => {
      const result = GoalSeekEngine.seek({
        fn: (x) => x * 2 + 1,
        target: 11,
        initialGuess: 0,
      });
      expect(result.finalOutput).toBeCloseTo(11, 6);
    });

    it('should handle constant function (no convergence)', () => {
      const result = GoalSeekEngine.seek({
        fn: () => 5,
        target: 10,
        initialGuess: 0,
        maxIterations: 50,
      });
      expect(result.converged).toBe(false);
    });

    it('should respect maxIterations', () => {
      const result = GoalSeekEngine.seek({
        fn: (x) => Math.pow(x, 10),
        target: 1024,
        initialGuess: 1.5,
        maxIterations: 10,
      });
      expect(result.iterations).toBeLessThanOrEqual(10);
    });

    it('should handle very small tolerance', () => {
      const result = GoalSeekEngine.seek({
        fn: (x) => x * 2,
        target: 10,
        initialGuess: 4,
        tolerance: 1e-15,
      });
      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(5, 10);
    });
  });
});
