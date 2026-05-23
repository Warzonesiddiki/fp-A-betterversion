// =============================================================================
// ETL PIPELINE ENGINE
// Extract, Transform, Load data from various sources
// Pure TypeScript, deterministic, testable
// =============================================================================

export type DataSourceType = 'csv' | 'excel' | 'json' | 'xml';
export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'currency';

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  fieldType: FieldType;
  required: boolean;
  defaultValue?: unknown;
}

export interface TransformRule {
  id: string;
  name: string;
  type: 'filter' | 'sort' | 'aggregate' | 'pivot' | 'unpivot' | 'join' | 'union' | 'formula';
  config: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: unknown;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  recordsImported: number;
  recordsRejected: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duration: number;
}

export interface ColumnStats {
  name: string;
  type: FieldType;
  nullCount: number;
  distinctCount: number;
  min?: unknown;
  max?: unknown;
  avg?: number;
}

export class ETLPipelineEngine {
  private mappings: FieldMapping[] = [];
  private transforms: TransformRule[] = [];
  private importHistory: ImportResult[] = [];

  // ---------------------------------------------------------------------------
  // Field Mapping
  // ---------------------------------------------------------------------------

  setMappings(mappings: FieldMapping[]): void {
    this.mappings = mappings;
  }

  getMappings(): FieldMapping[] {
    return [...this.mappings];
  }

  autoDetectMappings(headers: string[]): FieldMapping[] {
    return headers.map((h) => ({
      sourceField: h,
      targetField: this.normalizeFieldName(h),
      fieldType: 'string' as FieldType,
      required: false,
    }));
  }

  private normalizeFieldName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // ---------------------------------------------------------------------------
  // Transform Rules
  // ---------------------------------------------------------------------------

  addTransform(rule: TransformRule): void {
    this.transforms.push(rule);
  }

  removeTransform(id: string): boolean {
    const idx = this.transforms.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.transforms.splice(idx, 1);
    return true;
  }

  getTransforms(): TransformRule[] {
    return [...this.transforms];
  }

  // ---------------------------------------------------------------------------
  // Data Validation
  // ---------------------------------------------------------------------------

  validate(data: Record<string, unknown>[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (const mapping of this.mappings) {
        const value = row[mapping.sourceField];

        // Check required fields
        if (mapping.required && (value === null || value === undefined || value === '')) {
          errors.push({
            row: i,
            field: mapping.sourceField,
            message: 'Required field is empty',
            value,
          });
          continue;
        }

        // Check type
        if (value !== null && value !== undefined && value !== '') {
          if (!this.validateFieldType(value, mapping.fieldType)) {
            errors.push({
              row: i,
              field: mapping.sourceField,
              message: `Expected ${mapping.fieldType}`,
              value,
            });
          }
        }

        // Warn about nulls in non-required fields
        if (!mapping.required && (value === null || value === undefined)) {
          warnings.push({
            row: i,
            field: mapping.sourceField,
            message: 'Null value in optional field',
          });
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateFieldType(value: unknown, type: FieldType): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value));
      case 'date':
        return !isNaN(Date.parse(String(value)));
      case 'boolean':
        return typeof value === 'boolean' || value === 'true' || value === 'false';
      case 'currency':
        return typeof value === 'number' || !isNaN(Number(String(value).replace(/[$,]/g, '')));
      default:
        return true;
    }
  }

  // ---------------------------------------------------------------------------
  // Data Profiling
  // ---------------------------------------------------------------------------

  profile(data: Record<string, unknown>[]): ColumnStats[] {
    if (data.length === 0) return [];

    const headers = Object.keys(data[0]);
    return headers.map((name) => {
      const values = data.map((row) => row[name]);
      const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
      const distinct = new Set(nonNull);

      const stats: ColumnStats = {
        name,
        type: this.inferType(nonNull),
        nullCount: values.length - nonNull.length,
        distinctCount: distinct.size,
      };

      if (stats.type === 'number' || stats.type === 'currency') {
        const nums = nonNull.map((v) => Number(String(v).replace(/[$,]/g, '')));
        stats.min = Math.min(...nums);
        stats.max = Math.max(...nums);
        stats.avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      } else if (stats.type === 'date') {
        const dates = nonNull.map((v) => new Date(String(v)).getTime());
        stats.min = new Date(Math.min(...dates)).toISOString();
        stats.max = new Date(Math.max(...dates)).toISOString();
      } else {
        const sorted = [...nonNull].sort();
        stats.min = sorted[0];
        stats.max = sorted[sorted.length - 1];
      }

      return stats;
    });
  }

  private inferType(values: unknown[]): FieldType {
    const sample = values.slice(0, 100);
    const allNumbers = sample.every((v) => typeof v === 'number' || !isNaN(Number(v)));
    if (allNumbers) return 'number';

    const allDates = sample.every((v) => !isNaN(Date.parse(String(v))));
    if (allDates) return 'date';

    const allBooleans = sample.every(
      (v) => v === 'true' || v === 'false' || typeof v === 'boolean'
    );
    if (allBooleans) return 'boolean';

    return 'string';
  }

  // ---------------------------------------------------------------------------
  // Data Cleansing
  // ---------------------------------------------------------------------------

  cleanse(data: Record<string, unknown>[]): Record<string, unknown>[] {
    return data.map((row) => {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        let v = value;
        // Trim strings
        if (typeof v === 'string') v = v.trim();
        // Convert empty strings to null
        if (v === '') v = null;
        cleaned[key] = v;
      }
      return cleaned;
    });
  }

  // ---------------------------------------------------------------------------
  // Transform Execution
  // ---------------------------------------------------------------------------

  executeTransforms(data: Record<string, unknown>[]): Record<string, unknown>[] {
    let result = [...data];
    for (const transform of this.transforms) {
      result = this.executeTransform(result, transform);
    }
    return result;
  }

  private executeTransform(
    data: Record<string, unknown>[],
    rule: TransformRule
  ): Record<string, unknown>[] {
    switch (rule.type) {
      case 'filter':
        return this.filterData(data, rule.config);
      case 'sort':
        return this.sortData(data, rule.config);
      case 'aggregate':
        return this.aggregateData(data, rule.config);
      default:
        return data;
    }
  }

  private filterData(
    data: Record<string, unknown>[],
    config: Record<string, unknown>
  ): Record<string, unknown>[] {
    const field = config.field as string;
    const op = config.operator as string;
    const value = config.value;
    return data.filter((row) => {
      const cellValue = row[field];
      switch (op) {
        case 'eq':
          return cellValue === value;
        case 'neq':
          return cellValue !== value;
        case 'gt':
          return Number(cellValue) > Number(value);
        case 'lt':
          return Number(cellValue) < Number(value);
        case 'contains':
          return String(cellValue).includes(String(value));
        default:
          return true;
      }
    });
  }

  private sortData(
    data: Record<string, unknown>[],
    config: Record<string, unknown>
  ): Record<string, unknown>[] {
    const field = config.field as string;
    const direction = (config.direction as string) || 'asc';
    return [...data].sort((a, b) => {
      const aVal = String(a[field] ?? '');
      const bVal = String(b[field] ?? '');
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return direction === 'asc' ? cmp : -cmp;
    });
  }

  private aggregateData(
    data: Record<string, unknown>[],
    config: Record<string, unknown>
  ): Record<string, unknown>[] {
    const groupBy = config.groupBy as string;
    const aggField = config.field as string;
    const aggFunc = config.function as string;

    const groups = new Map<unknown, Record<string, unknown>[]>();
    for (const row of data) {
      const key = row[groupBy];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    return Array.from(groups.entries()).map(([key, rows]) => {
      const values = rows.map((r) => Number(r[aggField])).filter((n) => !isNaN(n));
      let result: number;
      switch (aggFunc) {
        case 'sum':
          result = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          result = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          result = Math.min(...values);
          break;
        case 'max':
          result = Math.max(...values);
          break;
        case 'count':
          result = values.length;
          break;
        default:
          result = 0;
      }
      return { [groupBy]: key, [aggField]: result };
    });
  }

  // ---------------------------------------------------------------------------
  // Import History
  // ---------------------------------------------------------------------------

  recordImport(result: ImportResult): void {
    this.importHistory.push(result);
  }

  getImportHistory(): ImportResult[] {
    return [...this.importHistory];
  }

  getLastImport(): ImportResult | undefined {
    return this.importHistory[this.importHistory.length - 1];
  }
}
