/**
 * @fileoverview Goal Seek Engine — Find input value that produces a target output
 * Pure TypeScript, deterministic, testable (bisection + Newton-Raphson solvers)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Solver
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 10th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 *
 * MONEY MIGRATION (2026-08-03, GAP-1 F-0006): breakEven (fixedCosts, pricePerUnit,
 * variableCostPerUnit → contributionMargin, units, revenue) now uses the canonical
 * money primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP). Raw - / * on
 * currency values eliminated. roundTo(x,2) for results. Solvers remain generic
 * numeric (operate on whatever fn returns, including money values).
 */
// =============================================================================
// GOAL SEEK ENGINE — Find input value that produces a target output
// Pure TypeScript, deterministic, testable
// =============================================================================

import { subtractMoney, multiplyMoney, divideMoney, roundTo, toDecimal } from '../utils/money';

export interface GoalSeekConfig {
  fn: (x: number) => number;
  target: number;
  initialGuess: number;
  tolerance?: number;
  maxIterations?: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface GoalSeekResult {
  converged: boolean;
  value: number;
  iterations: number;
  finalOutput: number;
  error: number;
}

export class GoalSeekEngine {
  /**
   * Find the input value that produces the target output.
   * Uses Newton-Raphson with bisection fallback.
   */
  static seek(config: GoalSeekConfig): GoalSeekResult {
    const {
      fn,
      target,
      initialGuess,
      tolerance = 1e-10,
      maxIterations = 200,
      lowerBound = -1e15,
      upperBound = 1e15,
    } = config;

    // Try Newton-Raphson first (fast convergence)
    let x = initialGuess;
    const h = 1e-8;

    for (let i = 0; i < maxIterations; i++) {
      const fx = fn(x) - target;

      if (Math.abs(fx) < tolerance) {
        return { converged: true, value: x, iterations: i + 1, finalOutput: fn(x), error: fx };
      }

      // Numerical derivative
      const fPrime = (fn(x + h) - fn(x - h)) / (2 * h);

      if (Math.abs(fPrime) < 1e-15) {
        // Derivative too small, fall back to bisection
        return this.bisection(fn, target, lowerBound, upperBound, tolerance, maxIterations - i);
      }

      const newX = x - fx / fPrime;

      // Check bounds
      if (newX < lowerBound || newX > upperBound || !Number.isFinite(newX)) {
        return this.bisection(fn, target, lowerBound, upperBound, tolerance, maxIterations - i);
      }

      x = newX;
    }

    return {
      converged: false,
      value: x,
      iterations: maxIterations,
      finalOutput: fn(x),
      error: fn(x) - target,
    };
  }

  /**
   * Bisection method as fallback for Newton-Raphson.
   */
  private static bisection(
    fn: (x: number) => number,
    target: number,
    a: number,
    b: number,
    tolerance: number,
    maxIterations: number
  ): GoalSeekResult {
    let fa = fn(a) - target;
    let fb = fn(b) - target;

    // Ensure f(a) and f(b) have opposite signs
    if (fa * fb > 0) {
      // Try to find a valid bracket by expanding
      const step = (b - a) / 10;
      for (let i = 0; i < 100; i++) {
        const newA = a - step * (i + 1);
        const newB = b + step * (i + 1);
        fa = fn(newA) - target;
        fb = fn(newB) - target;
        if (fa * fb <= 0) {
          a = newA;
          b = newB;
          break;
        }
        if (i === 99) {
          return {
            converged: false,
            value: (a + b) / 2,
            iterations: 0,
            finalOutput: fn((a + b) / 2),
            error: fn((a + b) / 2) - target,
          };
        }
      }
    }

    let mid: number;
    for (let i = 0; i < maxIterations; i++) {
      mid = (a + b) / 2;
      const fmid = fn(mid) - target;

      if (Math.abs(fmid) < tolerance || (b - a) / 2 < tolerance) {
        return {
          converged: true,
          value: mid,
          iterations: i + 1,
          finalOutput: fn(mid),
          error: fmid,
        };
      }

      if (fmid * fa < 0) {
        b = mid;
        fb = fmid;
      } else {
        a = mid;
        fa = fmid;
      }
    }

    mid = (a + b) / 2;
    return {
      converged: false,
      value: mid,
      iterations: maxIterations,
      finalOutput: fn(mid),
      error: fn(mid) - target,
    };
  }

  /** 
   * Find break-even point where revenue equals cost.
   * Money migration: contributionMargin, units, revenue use money primitives.
   */
  static breakEven(
    fixedCosts: number,
    pricePerUnit: number,
    variableCostPerUnit: number
  ): { units: number; revenue: number; valid: boolean } {
    const contributionMargin = roundTo(subtractMoney(pricePerUnit, variableCostPerUnit));
    if (toDecimal(contributionMargin).lte(0)) {
      return { units: 0, revenue: 0, valid: false };
    }
    const units = roundTo(divideMoney(fixedCosts, contributionMargin));
    const revenue = roundTo(multiplyMoney(units, pricePerUnit));
    return { units, revenue, valid: true };
  }
}
