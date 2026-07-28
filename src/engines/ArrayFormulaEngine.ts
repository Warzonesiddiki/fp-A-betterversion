/**
 * ArrayFormulaEngine — Array formula support for FinPlan Pro
 * Handles multi-cell array formulas like Excel's Ctrl+Shift+Enter
 */

interface ArrayFormula {
  id: string;
  formula: string;
  outputRange: { startRow: number; startCol: number; endRow: number; endCol: number };
  inputRange: { startRow: number; startCol: number; endRow: number; endCol: number };
  spill: boolean; // auto-expand to fill range
}

interface ArrayResult {
  values: (number | string | boolean | null)[][];
  rows: number;
  cols: number;
}

export class ArrayFormulaEngine {
  private static formulas = new Map<string, ArrayFormula>();
  private static results = new Map<string, ArrayResult>();

  /**
   * Register an array formula
   */
  static register(formula: Omit<ArrayFormula, 'id'>): string {
    const id = `arr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.formulas.set(id, { ...formula, id });
    return id;
  }

  /**
   * Evaluate an array formula
   */
  static evaluate(
    formula: string,
    data: number[][],
    outputRows: number,
    outputCols: number
  ): ArrayResult {
    const values: (number | string | boolean | null)[][] = [];

    // Parse formula type
    if (formula.startsWith('MMULT(')) {
      return this.mmult(data, outputRows, outputCols);
    }
    if (formula.startsWith('TRANSPOSE(')) {
      return this.transpose(data);
    }
    if (formula.startsWith('SUMPRODUCT(')) {
      return this.sumproduct(data);
    }
    if (formula.startsWith('FILTER(')) {
      return this.filter(data, formula);
    }
    if (formula.startsWith('SORT(')) {
      return this.sort(data, formula);
    }
    if (formula.startsWith('UNIQUE(')) {
      return this.unique(data);
    }

    // Default: evaluate cell-by-cell
    for (let r = 0; r < outputRows; r++) {
      const row: (number | string | boolean | null)[] = [];
      for (let c = 0; c < outputCols; c++) {
        const val = data[r]?.[c] ?? null;
        row.push(val);
      }
      values.push(row);
    }

    return { values, rows: outputRows, cols: outputCols };
  }

  /**
   * Matrix multiplication
   */
  private static mmult(a: number[][], rows: number, cols: number): ArrayResult {
    const result: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        for (let k = 0; k < (a[0]?.length ?? 0); k++) {
          sum += (a[i]?.[k] ?? 0) * (a[k]?.[j] ?? 0);
        }
        row.push(sum);
      }
      result.push(row);
    }
    return { values: result, rows, cols };
  }

  /**
   * Transpose a matrix
   */
  private static transpose(data: number[][]): ArrayResult {
    const rows = data[0]?.length ?? 0;
    const cols = data.length;
    const values: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(data[j]?.[i] ?? 0);
      }
      values.push(row);
    }
    return { values, rows, cols };
  }

  /**
   * Sum-product of arrays
   */
  private static sumproduct(data: number[][]): ArrayResult {
    if (data.length < 2) return { values: [[0]], rows: 1, cols: 1 };
    const result = data[0]!.reduce((sum, val, i) => {
      const multiplier = data[1]?.[i] ?? 0;
      return sum + val * multiplier;
    }, 0);
    return { values: [[result]], rows: 1, cols: 1 };
  }

  /**
   * Filter array by condition
   */
  private static filter(data: number[][], _formula: string): ArrayResult {
    // Parse FILTER(array, condition)
    // For now, return data as-is (condition parsing is complex)
    return {
      values: data,
      rows: data.length,
      cols: data[0]?.length ?? 0,
    };
  }

  /**
   * Sort array
   */
  private static sort(data: number[][], _formula: string): ArrayResult {
    const sorted = [...data].sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0));
    return {
      values: sorted,
      rows: sorted.length,
      cols: sorted[0]?.length ?? 0,
    };
  }

  /**
   * Unique values from array
   */
  private static unique(data: number[][]): ArrayResult {
    const seen = new Set<string>();
    const result: number[][] = [];
    for (const row of data) {
      const key = JSON.stringify(row);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(row);
      }
    }
    return {
      values: result,
      rows: result.length,
      cols: result[0]?.length ?? 0,
    };
  }

  /**
   * Get registered formulas
   */
  static getFormulas(): ArrayFormula[] {
    return Array.from(this.formulas.values());
  }

  /**
   * Clear all formulas
   */
  static reset(): void {
    this.formulas.clear();
    this.results.clear();
  }
}
