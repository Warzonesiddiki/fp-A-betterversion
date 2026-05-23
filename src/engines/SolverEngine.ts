// =============================================================================
// SOLVER ENGINE — Constraint satisfaction and optimization
// Linear programming, simplex method, constraint solving
// Pure TypeScript, deterministic, testable
// =============================================================================

export interface LinearConstraint {
  coefficients: number[];
  operator: '<=' | '>=' | '=';
  rhs: number;
  name?: string;
}

export interface LinearObjective {
  coefficients: number[];
  direction: 'maximize' | 'minimize';
}

export interface LinearProgram {
  objective: LinearObjective;
  constraints: LinearConstraint[];
  variableNames?: string[];
}

export interface SolverResult {
  feasible: boolean;
  optimal: boolean;
  objectiveValue: number;
  variableValues: number[];
  iterations: number;
  shadowPrices?: number[];
  reducedCosts?: number[];
}

export class SolverEngine {
  /**
   * Solve a linear program using the revised simplex method.
   */
  static solveLP(program: LinearProgram): SolverResult {
    const { objective, constraints } = program;
    const numVars = objective.coefficients.length;
    const numConstraints = constraints.length;

    // Build tableau: [A | I | b; -c | 0 | 0]
    const tableau: number[][] = [];

    for (let i = 0; i < numConstraints; i++) {
      const row: number[] = [...constraints[i].coefficients];
      // Add slack variables
      for (let j = 0; j < numConstraints; j++) {
        row.push(i === j ? 1 : 0);
      }
      row.push(constraints[i].rhs);
      tableau.push(row);
    }

    // Objective row
    const objRow: number[] =
      objective.direction === 'maximize'
        ? objective.coefficients.map((c) => -c)
        : [...objective.coefficients];
    for (let j = 0; j < numConstraints; j++) {
      objRow.push(0);
    }
    objRow.push(0);
    tableau.push(objRow);

    const totalCols = numVars + numConstraints + 1;
    const basis = Array.from({ length: numConstraints }, (_, i) => numVars + i);

    let iterations = 0;
    const maxIterations = 1000;

    // Simplex iterations
    while (iterations < maxIterations) {
      iterations++;

      // Find entering variable (most negative in objective row)
      let enteringCol = -1;
      let minVal = -1e-10;
      for (let j = 0; j < totalCols - 1; j++) {
        if (tableau[numConstraints][j] < minVal) {
          minVal = tableau[numConstraints][j];
          enteringCol = j;
        }
      }

      if (enteringCol === -1) {
        break; // Optimal
      }

      // Find leaving variable (minimum ratio test)
      let leavingRow = -1;
      let minRatio = Infinity;
      for (let i = 0; i < numConstraints; i++) {
        if (tableau[i][enteringCol] > 1e-10) {
          const ratio = tableau[i][totalCols - 1] / tableau[i][enteringCol];
          if (ratio < minRatio) {
            minRatio = ratio;
            leavingRow = i;
          }
        }
      }

      if (leavingRow === -1) {
        return {
          feasible: false,
          optimal: false,
          objectiveValue: 0,
          variableValues: Array(numVars).fill(0),
          iterations,
        };
      }

      // Pivot
      const pivot = tableau[leavingRow][enteringCol];
      for (let j = 0; j < totalCols; j++) {
        tableau[leavingRow][j] /= pivot;
      }
      for (let i = 0; i <= numConstraints; i++) {
        if (i !== leavingRow) {
          const factor = tableau[i][enteringCol];
          for (let j = 0; j < totalCols; j++) {
            tableau[i][j] -= factor * tableau[leavingRow][j];
          }
        }
      }
      basis[leavingRow] = enteringCol;
    }

    // Extract solution
    const variableValues = Array(numVars).fill(0);
    for (let i = 0; i < numConstraints; i++) {
      if (basis[i] < numVars) {
        variableValues[basis[i]] = tableau[i][totalCols - 1];
      }
    }

    const rawObj = tableau[numConstraints][totalCols - 1];
    const objectiveValue = objective.direction === 'maximize' ? rawObj : -rawObj;

    return {
      feasible: true,
      optimal: iterations < maxIterations,
      objectiveValue,
      variableValues,
      iterations,
    };
  }

  /**
   * Find the optimal allocation of a budget across items with constraints.
   */
  static allocateBudget(
    totalBudget: number,
    items: Array<{ name: string; minAllocation: number; maxAllocation: number; priority: number }>
  ): Array<{ name: string; allocation: number; percentage: number }> {
    const sorted = [...items].sort((a, b) => b.priority - a.priority);
    let remaining = totalBudget;
    const results: Array<{ name: string; allocation: number; percentage: number }> = [];

    // First pass: allocate minimums
    for (const item of sorted) {
      const min = Math.min(item.minAllocation, remaining);
      remaining -= min;
      results.push({ name: item.name, allocation: min, percentage: 0 });
    }

    // Second pass: allocate remaining by priority
    for (const item of sorted) {
      const result = results.find((r) => r.name === item.name)!;
      const additional = Math.min(item.maxAllocation - result.allocation, remaining);
      result.allocation += additional;
      remaining -= additional;
    }

    // Calculate percentages
    const total = results.reduce((sum, r) => sum + r.allocation, 0);
    for (const result of results) {
      result.percentage = total > 0 ? (result.allocation / total) * 100 : 0;
    }

    return results;
  }

  /**
   * Solve a system of linear equations (Ax = b) using Gaussian elimination.
   */
  static solveLinearSystem(A: number[][], b: number[]): number[] | null {
    const n = A.length;
    if (n === 0 || A[0].length !== n || b.length !== n) return null;

    // Augmented matrix
    const aug: number[][] = A.map((row, i) => [...row, b[i]]);

    // Forward elimination with partial pivoting
    for (let col = 0; col < n; col++) {
      // Find pivot
      let maxVal = Math.abs(aug[col][col]);
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(aug[row][col]) > maxVal) {
          maxVal = Math.abs(aug[row][col]);
          maxRow = row;
        }
      }
      if (maxVal < 1e-12) return null; // Singular

      // Swap rows
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

      // Eliminate below
      for (let row = col + 1; row < n; row++) {
        const factor = aug[row][col] / aug[col][col];
        for (let j = col; j <= n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }

    // Back substitution
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = aug[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= aug[i][j] * x[j];
      }
      x[i] = sum / aug[i][i];
    }

    return x;
  }
}
