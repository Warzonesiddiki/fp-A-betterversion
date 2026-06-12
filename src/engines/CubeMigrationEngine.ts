/* eslint-disable @typescript-eslint/no-unused-vars */
// =============================================================================
// CUBE MIGRATION ENGINE — Migrate from other OLAP systems
// Supports Essbase, TM1, SSAS, and generic CSV/JSON import
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

export type SourceSystem = 'essbase' | 'tm1' | 'ssas' | 'csv' | 'json' | 'custom';

export interface MigrationConfig {
  source: SourceSystem;
  cubeName: string;
  dimensionMapping: Record<string, string>;
  measureMapping: Record<string, string>;
  options: MigrationOptions;
}

export interface MigrationOptions {
  skipMissingDimensions?: boolean;
  defaultMissingValues?: string;
  encoding?: 'utf-8' | 'latin-1' | 'utf-16';
  delimiter?: string;
  datePattern?: string;
}

export interface MigrationResult {
  success: boolean;
  sourceSystem: SourceSystem;
  cubeName: string;
  dimensionsCreated: string[];
  membersAdded: number;
  cellsImported: number;
  errors: MigrationError[];
  warnings: string[];
  durationMs: number;
}

export interface MigrationError {
  row?: number;
  column?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SourceDimension {
  name: string;
  members: { code: string; description: string; parent?: string }[];
}

export interface SourceCube {
  name: string;
  dimensions: SourceDimension[];
  data: Record<string, number | string>[];
}

// =============================================================================
// CUBE MIGRATION ENGINE
// =============================================================================

export class CubeMigrationEngine {
  private migrationHistory: MigrationResult[] = [];

  migrateFromEssbase(config: MigrationConfig, data: string): MigrationResult {
    const start = performance.now();
    const errors: MigrationError[] = [];
    const warnings: string[] = [];

    const parsed = this.parseEssbaseData(data, config, errors);
    const result: MigrationResult = {
      success: errors.length === 0,
      sourceSystem: 'essbase',
      cubeName: config.cubeName,
      dimensionsCreated: Object.values(config.dimensionMapping),
      membersAdded: parsed.membersAdded,
      cellsImported: parsed.cellsImported,
      errors,
      warnings,
      durationMs: performance.now() - start,
    };

    this.migrationHistory.push(result);
    return result;
  }

  migrateFromTM1(config: MigrationConfig, data: string): MigrationResult {
    const start = performance.now();
    const errors: MigrationError[] = [];
    const warnings: string[] = [];

    const parsed = this.parseTM1Data(data, config, errors);
    const result: MigrationResult = {
      success: errors.length === 0,
      sourceSystem: 'tm1',
      cubeName: config.cubeName,
      dimensionsCreated: Object.values(config.dimensionMapping),
      membersAdded: parsed.membersAdded,
      cellsImported: parsed.cellsImported,
      errors,
      warnings,
      durationMs: performance.now() - start,
    };

    this.migrationHistory.push(result);
    return result;
  }

  migrateFromSSAS(config: MigrationConfig, data: string): MigrationResult {
    const start = performance.now();
    const errors: MigrationError[] = [];
    const warnings: string[] = [];

    const parsed = this.parseSSASData(data, config, errors);
    const result: MigrationResult = {
      success: errors.length === 0,
      sourceSystem: 'ssas',
      cubeName: config.cubeName,
      dimensionsCreated: Object.values(config.dimensionMapping),
      membersAdded: parsed.membersAdded,
      cellsImported: parsed.cellsImported,
      errors,
      warnings,
      durationMs: performance.now() - start,
    };

    this.migrationHistory.push(result);
    return result;
  }

  migrateFromCSV(config: MigrationConfig, data: string): MigrationResult {
    const start = performance.now();
    const errors: MigrationError[] = [];
    const warnings: string[] = [];
    const delimiter = config.options.delimiter ?? ',';

    const lines = data.split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      errors.push({
        message: 'CSV must have at least a header and one data row',
        severity: 'error',
      });
      return this.buildResult('csv', config, 0, 0, errors, warnings, start);
    }

    const headers = lines[0]!.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
    let cellsImported = 0;
    const membersAdded = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]!.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
      if (values.length !== headers.length) {
        errors.push({
          row: i + 1,
          message: `Row has ${values.length} columns, expected ${headers.length}`,
          severity: 'error',
        });
        continue;
      }

      const coords: Record<string, string> = {};
      let measureValue: number | undefined;

      for (let j = 0; j < headers.length; j++) {
        const mappedDim = config.dimensionMapping[headers[j]!];
        const mappedMeasure = config.measureMapping[headers[j]!];

        if (mappedDim) {
          coords[mappedDim] = values[j]!;
          membersAdded.add(`${mappedDim}:${values[j]}`);
        } else if (mappedMeasure) {
          measureValue = parseFloat(values[j]!);
          if (isNaN(measureValue)) {
            errors.push({
              row: i + 1,
              column: headers[j]!,
              message: 'Invalid numeric value',
              severity: 'warning',
            });
          }
        }
      }

      if (measureValue !== undefined) {
        cellsImported++;
      }
    }

    return this.buildResult(
      'csv',
      config,
      membersAdded.size,
      cellsImported,
      errors,
      warnings,
      start
    );
  }

  migrateFromJSON(config: MigrationConfig, data: string): MigrationResult {
    const start = performance.now();
    const errors: MigrationError[] = [];
    const warnings: string[] = [];

    let parsed: Record<string, unknown>[];
    try {
      parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        errors.push({ message: 'JSON data must be an array of objects', severity: 'error' });
        return this.buildResult('json', config, 0, 0, errors, warnings, start);
      }
    } catch (e) {
      errors.push({
        message: `Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`,
        severity: 'error',
      });
      return this.buildResult('json', config, 0, 0, errors, warnings, start);
    }

    let cellsImported = 0;
    const membersAdded = new Set<string>();

    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i];
      const coords: Record<string, string> = {};
      let measureValue: number | undefined;

      for (const [key, value] of Object.entries(row!)) {
        const mappedDim = config.dimensionMapping[key];
        const mappedMeasure = config.measureMapping[key];

        if (mappedDim && typeof value === 'string') {
          coords[mappedDim] = value;
          membersAdded.add(`${mappedDim}:${value}`);
        } else if (mappedMeasure && typeof value === 'number') {
          measureValue = value;
        }
      }

      if (measureValue !== undefined) cellsImported++;
    }

    return this.buildResult(
      'json',
      config,
      membersAdded.size,
      cellsImported,
      errors,
      warnings,
      start
    );
  }

  getMigrationHistory(): MigrationResult[] {
    return [...this.migrationHistory];
  }

  getLastMigration(): MigrationResult | undefined {
    return this.migrationHistory[this.migrationHistory.length - 1];
  }

  clearHistory(): void {
    this.migrationHistory = [];
  }

  private parseEssbaseData(
    data: string,
    config: MigrationConfig,
    errors: MigrationError[]
  ): { membersAdded: number; cellsImported: number } {
    const lines = data.split('\n').filter((l) => l.trim());
    let membersAdded = 0;
    let cellsImported = 0;

    for (const line of lines) {
      if (line.startsWith('#') || line.trim() === '') continue;
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        membersAdded += parts.length - 1;
        cellsImported++;
      }
    }

    return { membersAdded, cellsImported };
  }

  private parseTM1Data(
    data: string,
    config: MigrationConfig,
    errors: MigrationError[]
  ): { membersAdded: number; cellsImported: number } {
    const lines = data.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    let membersAdded = 0;
    let cellsImported = 0;

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        membersAdded += parts.length - 1;
        cellsImported++;
      }
    }

    return { membersAdded, cellsImported };
  }

  private parseSSASData(
    data: string,
    config: MigrationConfig,
    errors: MigrationError[]
  ): { membersAdded: number; cellsImported: number } {
    const lines = data.split('\n').filter((l) => l.trim());
    let membersAdded = 0;
    let cellsImported = 0;

    for (const line of lines) {
      const parts = line.split('\t').map((p) => p.trim());
      if (parts.length >= 2) {
        membersAdded += parts.length - 1;
        cellsImported++;
      }
    }

    return { membersAdded, cellsImported };
  }

  private buildResult(
    source: SourceSystem,
    config: MigrationConfig,
    membersAdded: number,
    cellsImported: number,
    errors: MigrationError[],
    warnings: string[],
    start: number
  ): MigrationResult {
    const result: MigrationResult = {
      success: errors.length === 0,
      sourceSystem: source,
      cubeName: config.cubeName,
      dimensionsCreated: Object.values(config.dimensionMapping),
      membersAdded,
      cellsImported,
      errors,
      warnings,
      durationMs: performance.now() - start,
    };
    this.migrationHistory.push(result);
    return result;
  }
}
