// =============================================================================
// SENSITIVITY ENGINE — Multi-variable sensitivity analysis
// Tornado charts, spider charts, data tables
// Pure TypeScript, deterministic, testable
// =============================================================================

export interface SensitivityVariable {
  name: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
}

export interface TornadoItem {
  name: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
  lowOutput: number;
  highOutput: number;
  swing: number;
  rank: number;
}

export interface SpiderPoint {
  variable: string;
  variation: number;
  output: number;
}

export interface DataTableResult {
  rowVariable: string;
  columnVariable: string;
  rowValues: number[];
  columnValues: number[];
  outputs: number[][];
}

export class SensitivityEngine {
  /**
   * Generate tornado chart data by varying one variable at a time.
   */
  static tornado(
    variables: SensitivityVariable[],
    model: (vars: Record<string, number>) => number,
    baseVariables: Record<string, number>
  ): TornadoItem[] {
    const baseOutput = model(baseVariables);

    const items = variables.map((v) => {
      const lowVars = { ...baseVariables, [v.name]: v.lowValue };
      const highVars = { ...baseVariables, [v.name]: v.highValue };
      const lowOutput = model(lowVars);
      const highOutput = model(highVars);

      return {
        name: v.name,
        baseValue: v.baseValue,
        lowValue: v.lowValue,
        highValue: v.highValue,
        lowOutput,
        highOutput,
        swing: Math.abs(highOutput - lowOutput),
        rank: 0,
      };
    });

    items.sort((a, b) => b.swing - a.swing);
    items.forEach((item, i) => {
      item.rank = i + 1;
    });

    return items;
  }

  /**
   * Generate spider chart data (one-way sensitivity on each variable).
   */
  static spider(
    variables: SensitivityVariable[],
    model: (vars: Record<string, number>) => number,
    baseVariables: Record<string, number>,
    steps: number = 11
  ): Map<string, SpiderPoint[]> {
    const result = new Map<string, SpiderPoint[]>();

    for (const v of variables) {
      const points: SpiderPoint[] = [];
      const range = v.highValue - v.lowValue;

      for (let i = 0; i < steps; i++) {
        const pct = i / (steps - 1);
        const value = v.lowValue + range * pct;
        const variation = ((value - v.baseValue) / v.baseValue) * 100;
        const vars = { ...baseVariables, [v.name]: value };
        points.push({ variable: v.name, variation, output: model(vars) });
      }

      result.set(v.name, points);
    }

    return result;
  }

  /**
   * Generate a two-way data table (vary two variables simultaneously).
   */
  static dataTable(
    rowVariable: string,
    rowValues: number[],
    columnVariable: string,
    columnValues: number[],
    model: (vars: Record<string, number>) => number,
    baseVariables: Record<string, number>
  ): DataTableResult {
    const outputs: number[][] = [];

    for (const rowVal of rowValues) {
      const row: number[] = [];
      for (const colVal of columnValues) {
        const vars = { ...baseVariables, [rowVariable]: rowVal, [columnVariable]: colVal };
        row.push(model(vars));
      }
      outputs.push(row);
    }

    return { rowVariable, columnVariable, rowValues, columnValues, outputs };
  }

  /**
   * Elasticity analysis: percentage change in output per 1% change in input.
   */
  static elasticity(
    variables: SensitivityVariable[],
    model: (vars: Record<string, number>) => number,
    baseVariables: Record<string, number>
  ): Array<{ name: string; elasticity: number; interpretation: string }> {
    const baseOutput = model(baseVariables);
    const delta = 0.01; // 1%

    return variables.map((v) => {
      const perturbed = { ...baseVariables, [v.name]: v.baseValue * (1 + delta) };
      const newOutput = model(perturbed);
      const outputChange = (newOutput - baseOutput) / baseOutput;
      const elasticity = outputChange / delta;

      let interpretation: string;
      if (Math.abs(elasticity) > 1) interpretation = 'Highly sensitive';
      else if (Math.abs(elasticity) > 0.5) interpretation = 'Moderately sensitive';
      else interpretation = 'Low sensitivity';

      return { name: v.name, elasticity, interpretation };
    });
  }
}
