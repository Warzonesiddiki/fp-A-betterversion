// =============================================================================
// PIVOT TABLE ENGINE — Multi-dimensional pivot with aggregation, calculated fields
// Pure TypeScript, deterministic, no external dependencies
// =============================================================================

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';

export interface PivotField {
  name: string;
  label: string;
  type: 'dimension' | 'measure';
  dataType: 'string' | 'number' | 'date';
}

export interface PivotConfig {
  rows: string[];
  columns: string[];
  values: { field: string; aggregation: AggregationType }[];
  filters: Record<string, string[]>;
  showTotals: boolean;
  showSubtotals: boolean;
}

export interface PivotCell {
  value: number | null;
  formattedValue: string;
  isTotal: boolean;
}

export interface PivotRow {
  key: string;
  label: string;
  cells: PivotCell[];
  isTotal: boolean;
  level: number;
  children?: PivotRow[];
}

export interface PivotResult {
  columnHeaders: string[];
  rows: PivotRow[];
  grandTotals: PivotCell[];
  metadata: {
    totalRows: number;
    totalColumns: number;
    generatedAt: string;
  };
}

export interface CalculatedField {
  name: string;
  label: string;
  formula: string;
  dependencies: string[];
}

export class PivotTableEngine {
  private calculatedFields: CalculatedField[] = [];

  createPivot(data: Record<string, unknown>[], config: PivotConfig): PivotResult {
    const filtered = this.applyFilters(data, config.filters);
    const columnValues = this.extractUniqueValues(filtered, config.columns);
    const rowValues = this.extractUniqueValues(filtered, config.rows);

    const columnHeaders =
      columnValues.length > 0
        ? columnValues.map((cv) => config.columns.map((c) => String(cv[c] ?? '')).join(' / '))
        : ['Total'];

    const rows: PivotRow[] = [];

    for (const rv of rowValues) {
      const rowKey = config.rows.map((r) => String(rv[r] ?? '')).join(' / ');
      const rowLabel = rowKey;
      const cells: PivotCell[] = [];

      for (const cv of columnValues) {
        const matching = filtered.filter(
          (d) =>
            config.rows.every((r) => String(d[r]) === String(rv[r])) &&
            config.columns.every((c) => String(d[c]) === String(cv[c]))
        );
        cells.push(this.aggregateCells(matching, config.values));
      }

      if (config.showTotals && columnValues.length > 0) {
        const allForRow = filtered.filter((d) =>
          config.rows.every((r) => String(d[r]) === String(rv[r]))
        );
        cells.push(this.aggregateCells(allForRow, config.values));
      }

      rows.push({
        key: rowKey,
        label: rowLabel,
        cells,
        isTotal: false,
        level: 0,
      });
    }

    if (config.showTotals) {
      const totalCells: PivotCell[] = [];
      for (const cv of columnValues) {
        const matching = filtered.filter((d) =>
          config.columns.every((c) => String(d[c]) === String(cv[c]))
        );
        totalCells.push(this.aggregateCells(matching, config.values));
      }
      totalCells.push(this.aggregateCells(filtered, config.values));

      rows.push({
        key: 'Grand Total',
        label: 'Grand Total',
        cells: totalCells,
        isTotal: true,
        level: 0,
      });
    }

    const grandTotals = config.values.map((v) => {
      const values = filtered.map((d) => Number(d[v.field]) || 0);
      return {
        value: this.aggregate(values, v.aggregation),
        formattedValue: this.formatNumber(this.aggregate(values, v.aggregation)),
        isTotal: true,
      };
    });

    return {
      columnHeaders: config.showTotals ? [...columnHeaders, 'Total'] : columnHeaders,
      rows,
      grandTotals,
      metadata: {
        totalRows: rows.length,
        totalColumns: columnHeaders.length,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  addCalculatedField(field: CalculatedField): void {
    this.calculatedFields.push(field);
  }

  getCalculatedFields(): CalculatedField[] {
    return [...this.calculatedFields];
  }

  removeCalculatedField(name: string): boolean {
    const idx = this.calculatedFields.findIndex((f) => f.name === name);
    if (idx === -1) return false;
    this.calculatedFields.splice(idx, 1);
    return true;
  }

  sortPivot(rows: PivotRow[], columnIndex: number, direction: 'asc' | 'desc'): PivotRow[] {
    const dataRows = rows.filter((r) => !r.isTotal);
    const totalRows = rows.filter((r) => r.isTotal);

    dataRows.sort((a, b) => {
      const aVal = a.cells[columnIndex]?.value ?? 0;
      const bVal = b.cells[columnIndex]?.value ?? 0;
      return direction === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });

    return [...dataRows, ...totalRows];
  }

  filterByValue(rows: PivotRow[], labelFilter: (label: string) => boolean): PivotRow[] {
    return rows.filter((r) => r.isTotal || labelFilter(r.label));
  }

  toCSV(result: PivotResult): string {
    const lines: string[] = [];
    lines.push(['', ...result.columnHeaders].join(','));
    for (const row of result.rows) {
      const values = row.cells.map((c) => c.value ?? '');
      lines.push([row.label, ...values].join(','));
    }
    return lines.join('\n');
  }

  private applyFilters(
    data: Record<string, unknown>[],
    filters: Record<string, string[]>
  ): Record<string, unknown>[] {
    return data.filter((row) =>
      Object.entries(filters).every(
        ([field, allowed]) => allowed.length === 0 || allowed.includes(String(row[field]))
      )
    );
  }

  private extractUniqueValues(
    data: Record<string, unknown>[],
    fields: string[]
  ): Record<string, unknown>[] {
    if (fields.length === 0) return [];
    const seen = new Set<string>();
    const result: Record<string, unknown>[] = [];
    for (const row of data) {
      const key = fields.map((f) => String(row[f] ?? '')).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        const obj: Record<string, unknown> = {};
        for (const f of fields) obj[f] = row[f];
        result.push(obj);
      }
    }
    return result;
  }

  private aggregateCells(
    data: Record<string, unknown>[],
    values: { field: string; aggregation: AggregationType }[]
  ): PivotCell {
    if (values.length === 0 || data.length === 0) {
      return { value: null, formattedValue: '', isTotal: false };
    }
    const v = values[0];
    const nums = data.map((d) => Number(d[v.field]) || 0);
    const agg = this.aggregate(nums, v.aggregation);
    return { value: agg, formattedValue: this.formatNumber(agg), isTotal: false };
  }

  private aggregate(values: number[], type: AggregationType): number {
    if (values.length === 0) return 0;
    switch (type) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'count':
        return values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'median': {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      }
      default:
        return 0;
    }
  }

  private formatNumber(value: number | null): string {
    if (value === null) return '';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
  }
}
