/**
 * Sensitivity Table Engine — 2-way sensitivity analysis and tornado diagrams
 * Part 4 #5: Critical financial domain gap
 */

import { roundTo } from '../utils/money';

export interface SensitivityConfig {
  rowVariable: string;
  rowValues: number[];
  colVariable: string;
  colValues: number[];
  outputMetric: string;
  baseCase: { row: number; col: number };
  computeFn: (rowVal: number, colVal: number) => number;
}

export interface SensitivityResult {
  config: SensitivityConfig;
  table: number[][];
  rowLabels: string[];
  colLabels: string[];
  baseCaseValue: number;
  min: number;
  max: number;
}

export interface HighlightedTable extends SensitivityResult {
  baseCaseRowIndex: number;
  baseCaseColIndex: number;
}

export interface FormattedTable {
  rows: Array<{
    label: string;
    values: string[];
    isBaseRow: boolean;
  }>;
  colLabels: string[];
  outputMetric: string;
}

export interface Variable {
  name: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
  impactFn: (value: number) => number;
}

export interface TornadoResult {
  variables: Array<{
    name: string;
    baseValue: number;
    lowValue: number;
    highValue: number;
    lowImpact: number;
    highImpact: number;
    range: number;
  }>;
  baseValue: number;
  sortedByRange: Array<{
    name: string;
    lowDelta: number;
    highDelta: number;
    range: number;
  }>;
}

export class SensitivityTableEngine {
  /**
   * Generate a 2-way sensitivity table
   */
  static generate(config: SensitivityConfig): SensitivityResult {
    const { rowValues, colValues, computeFn, baseCase } = config;

    const table: number[][] = [];
    let min = Infinity;
    let max = -Infinity;
    let baseCaseValue = 0;

    for (let ri = 0; ri < rowValues.length; ri++) {
      const row: number[] = [];
      for (let ci = 0; ci < colValues.length; ci++) {
        const value = computeFn(rowValues[ri]!, colValues[ci]!);
        row.push(value);
        if (value < min) min = value;
        if (value > max) max = value;
        if (rowValues[ri] === baseCase.row && colValues[ci] === baseCase.col) {
          baseCaseValue = value;
        }
      }
      table.push(row);
    }

    const rowLabels = rowValues.map((v) => this.formatValue(v));
    const colLabels = colValues.map((v) => this.formatValue(v));

    return { config, table, rowLabels, colLabels, baseCaseValue, min, max };
  }

  /**
   * Highlight the base case cell in the table
   */
  static highlightBaseCase(
    table: SensitivityResult,
    baseCase: { row: number; col: number }
  ): HighlightedTable {
    const baseCaseRowIndex = table.config.rowValues.indexOf(baseCase.row);
    const baseCaseColIndex = table.config.colValues.indexOf(baseCase.col);

    return {
      ...table,
      baseCaseRowIndex: baseCaseRowIndex >= 0 ? baseCaseRowIndex : 0,
      baseCaseColIndex: baseCaseColIndex >= 0 ? baseCaseColIndex : 0,
    };
  }

  /**
   * Format table values for display
   */
  static formatTable(
    table: SensitivityResult,
    format: 'currency' | 'percent' | 'number' = 'number'
  ): FormattedTable {
    const formatFn = (v: number): string => {
      if (format === 'currency') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(v);
      }
      if (format === 'percent') {
        return `${roundTo(v * 100, 1)}%`;
      }
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);
    };

    return {
      rows: table.table.map((row, ri) => ({
        label: table.rowLabels[ri]!,
        values: row.map((v) => formatFn(v)),
        isBaseRow: table.config.rowValues[ri] === table.config.baseCase.row,
      })),
      colLabels: table.colLabels,
      outputMetric: table.config.outputMetric,
    };
  }

  /**
   * Tornado diagram analysis — sensitivity of output to each variable
   */
  static tornadoAnalysis(baseValue: number, variables: Variable[]): TornadoResult {
    const sorted = variables
      .map((v) => {
        const lowImpact = v.impactFn(v.lowValue);
        const highImpact = v.impactFn(v.highValue);
        return {
          name: v.name,
          baseValue: v.baseValue,
          lowValue: v.lowValue,
          highValue: v.highValue,
          lowImpact,
          highImpact,
          range: Math.abs(highImpact - lowImpact),
        };
      })
      .sort((a, b) => b.range - a.range);

    return {
      variables: sorted,
      baseValue,
      sortedByRange: sorted.map((v) => ({
        name: v.name,
        lowDelta: v.lowImpact - baseValue,
        highDelta: v.highImpact - baseValue,
        range: v.range,
      })),
    };
  }

  private static formatValue(value: number): string {
    if (Math.abs(value) < 1) return `${roundTo(value * 100, 0)}%`;
    if (Math.abs(value) >= 1000000) return `${roundTo(value / 1000000, 1)}M`;
    if (Math.abs(value) >= 1000) return `${roundTo(value / 1000, 0)}K`;
    return `${roundTo(value, 0)}`;
  }
}
