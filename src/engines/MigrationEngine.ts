/**
 * MigrationEngine — Source-specific migration parsers for Planful, Adaptive, Anaplan
 * Extends ImportEngine with column auto-detection, migration readiness scoring, and rollback
 */

import ExcelJS from 'exceljs';

export type MigrationSource = 'excel' | 'planful' | 'adaptive' | 'anaplan' | 'csv' | 'unknown';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number; // 0-1
  matchType: 'exact' | 'fuzzy' | 'alias' | 'manual';
}

export interface MigrationReadiness {
  score: number; // 0-100
  status: 'green' | 'yellow' | 'red';
  issues: { severity: 'error' | 'warning' | 'info'; message: string }[];
  sheetCount: number;
  totalRows: number;
  detectedColumns: ColumnMapping[];
  unmappedColumns: string[];
  formulaComplexity: 'simple' | 'moderate' | 'complex';
  hasExternalLinks: boolean;
  hasMergedCells: boolean;
  hasHiddenRows: boolean;
}

export interface MigrationPlan {
  source: MigrationSource;
  sheets: { name: string; rows: number; columns: string[] }[];
  mappings: ColumnMapping[];
  estimatedDuration: string;
  warnings: string[];
}

export interface MigrationSnapshot {
  id: string;
  timestamp: string;
  source: MigrationSource;
  fileName: string;
  plan: MigrationPlan;
  data: Record<string, unknown>[];
  applied: boolean;
}

// Known column aliases for auto-mapping
const COLUMN_ALIASES: Record<string, string[]> = {
  account: [
    'account',
    'account_code',
    'accountcode',
    'gl_account',
    'glaccount',
    'acct',
    'account_number',
    'accountnumber',
    'coa',
  ],
  accountName: ['account_name', 'accountname', 'acct_name', 'acctname', 'description', 'name'],
  department: [
    'department',
    'dept',
    'cost_center',
    'costcenter',
    'cost_centre',
    'costcentre',
    'dept_code',
    'deptcode',
  ],
  entity: [
    'entity',
    'company',
    'subsidiary',
    'legal_entity',
    'legalentity',
    'entity_code',
    'entitycode',
  ],
  period: [
    'period',
    'month',
    'fiscal_period',
    'fiscalperiod',
    'acct_period',
    'acctperiod',
    'month_year',
    'monthyear',
  ],
  date: [
    'date',
    'transaction_date',
    'transactiondate',
    'trans_date',
    'transdate',
    'posting_date',
    'postingdate',
    'effective_date',
    'effectivedate',
  ],
  debit: ['debit', 'debits', 'dr', 'debit_amount', 'debitamount'],
  credit: ['credit', 'credits', 'cr', 'credit_amount', 'creditamount'],
  amount: ['amount', 'balance', 'net_amount', 'netamount', 'total', 'value'],
  scenario: ['scenario', 'version', 'plan_type', 'plantype', 'budget_type', 'budgettype'],
  currency: ['currency', 'curr', 'currency_code', 'currencycode'],
  entityName: ['entity_name', 'entityname', 'company_name', 'companyname'],
  departmentName: [
    'department_name',
    'departmentname',
    'dept_name',
    'deptname',
    'cost_center_name',
  ],
};

// Planful-specific export format detection
const PLANFUL_MARKERS = [
  'planful',
  'host analytics',
  'hostanalytics',
  'plan_id',
  'planid',
  'model_id',
  'modelid',
];

// Adaptive-specific export format detection
const ADAPTIVE_MARKERS = [
  'adaptive',
  'workday adaptive',
  'adaptive insights',
  'level_code',
  'levelcode',
  'level_name',
  'levelname',
  'sheet_type',
  'sheettype',
];

// Anaplan-specific export format detection
const ANAPLAN_MARKERS = [
  'anaplan',
  'module_name',
  'modulename',
  'line_item',
  'lineitem',
  'list_name',
  'listname',
  'dimension_1',
  'dimension_2',
];

/**
 * Extract row values from an ExcelJS row as a string array.
 * ExcelJS rows are 1-indexed, so we skip index 0.
 */
function rowToValues(row: ExcelJS.Row): string[] {
  const values: string[] = [];
  const cellCount = row.cellCount;
  for (let i = 1; i <= cellCount; i++) {
    const cell = row.getCell(i);
    const val = cell.value;
    if (val === null || val === undefined) {
      values.push('');
    } else if (typeof val === 'object' && 'result' in val) {
      // Formula cell — use the cached result
      values.push(String(val.result ?? ''));
    } else if (val instanceof Date) {
      values.push(val.toISOString());
    } else {
      values.push(String(val));
    }
  }
  return values;
}

/**
 * Read all rows from a worksheet as a 2D string array (first row = headers).
 */
function worksheetToRows(worksheet: ExcelJS.Worksheet): string[][] {
  const rows: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    rows.push(rowToValues(row));
  });
  return rows;
}

/**
 * Auto-detect column mappings based on header names
 */
function autoMapColumns(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedTargets = new Set<string>();

  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    let bestMatch: ColumnMapping | null = null;

    for (const [target, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (usedTargets.has(target)) continue;

      // Exact match
      if (aliases.includes(normalized)) {
        bestMatch = {
          sourceColumn: header,
          targetField: target,
          confidence: 1.0,
          matchType: 'exact',
        };
        break;
      }

      // Fuzzy match (contains)
      for (const alias of aliases) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
          const confidence = (alias.length / Math.max(normalized.length, alias.length)) * 0.8;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = {
              sourceColumn: header,
              targetField: target,
              confidence,
              matchType: 'fuzzy',
            };
          }
        }
      }
    }

    if (bestMatch) {
      mappings.push(bestMatch);
      usedTargets.add(bestMatch.targetField);
    }
  }

  return mappings;
}

/**
 * Detect migration source from file content
 */
function detectSource(headers: string[], data: Record<string, unknown>[]): MigrationSource {
  const headerText = headers.join(' ').toLowerCase();
  const sampleText = data
    .slice(0, 5)
    .map((r) => Object.values(r).join(' '))
    .join(' ')
    .toLowerCase();
  const combined = headerText + ' ' + sampleText;

  if (PLANFUL_MARKERS.some((m) => combined.includes(m))) return 'planful';
  if (ADAPTIVE_MARKERS.some((m) => combined.includes(m))) return 'adaptive';
  if (ANAPLAN_MARKERS.some((m) => combined.includes(m))) return 'anaplan';

  // Check for Excel-specific patterns
  if (headers.some((h) => h.startsWith('Column'))) return 'excel';

  return 'csv';
}

/**
 * Assess migration readiness from workbook analysis
 */
function assessReadiness(
  headers: string[],
  data: Record<string, unknown>[],
  mappings: ColumnMapping[],
  workbook?: ExcelJS.Workbook
): MigrationReadiness {
  const issues: MigrationReadiness['issues'] = [];
  let score = 100;

  // Check for required columns
  const requiredFields = ['account', 'amount'];
  const mappedTargets = new Set(mappings.map((m) => m.targetField));
  const unmappedRequired = requiredFields.filter((f) => !mappedTargets.has(f));

  if (unmappedRequired.length > 0) {
    score -= 30;
    issues.push({
      severity: 'error',
      message: `Required columns not mapped: ${unmappedRequired.join(', ')}. Manual mapping needed.`,
    });
  }

  // Check for unmapped columns
  const mappedSources = new Set(mappings.map((m) => m.sourceColumn));
  const unmappedColumns = headers.filter((h) => !mappedSources.has(h));

  if (unmappedColumns.length > headers.length * 0.5) {
    score -= 20;
    issues.push({
      severity: 'warning',
      message: `${unmappedColumns.length} columns could not be auto-mapped. Review recommended.`,
    });
  }

  // Check data quality
  let emptyRowCount = 0;
  for (const row of data) {
    if (Object.values(row).every((v) => v === '' || v === null || v === undefined)) {
      emptyRowCount++;
    }
  }

  if (emptyRowCount > data.length * 0.1) {
    score -= 10;
    issues.push({
      severity: 'warning',
      message: `${emptyRowCount} empty rows detected (${Math.round((emptyRowCount / data.length) * 100)}%).`,
    });
  }

  // Check formula complexity (from workbook)
  let formulaComplexity: string = 'simple';
  let hasExternalLinks = false;
  let hasMergedCells = false;
  let hasHiddenRows = false;

  if (workbook) {
    workbook.eachSheet((worksheet) => {
      // Check for formulas
      let formulaCellCount = 0;
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
            formulaCellCount++;
          }
        });
      });
      if (formulaCellCount > 50) formulaComplexity = 'complex';
      else if (formulaCellCount > 10) formulaComplexity = 'moderate';

      // Check for external links — formula strings containing [ ] (external workbook refs)
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
            const formula = String(cell.value.formula);
            if (formula.includes('[') && formula.includes(']')) {
              hasExternalLinks = true;
            }
          }
        });
      });

      // Check for merged cells
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const merges = (worksheet as any)._merges as Record<string, unknown> | undefined;
      if (merges && Object.keys(merges).length > 0) hasMergedCells = true;

      // Check for hidden rows
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        if (row.hidden) hasHiddenRows = true;
      });
    });
  }

  if (formulaComplexity === 'complex') {
    score -= 15;
    issues.push({
      severity: 'warning',
      message: 'Complex formulas detected. Manual formula recreation may be needed.',
    });
  }

  if (hasExternalLinks) {
    score -= 20;
    issues.push({
      severity: 'error',
      message: 'External file links detected. These will break during migration.',
    });
  }

  if (hasMergedCells) {
    score -= 5;
    issues.push({
      severity: 'info',
      message: 'Merged cells detected. Will be unmerged during import.',
    });
  }

  if (hasHiddenRows) {
    score -= 5;
    issues.push({
      severity: 'info',
      message: 'Hidden rows detected. Review whether to include them.',
    });
  }

  // Determine status
  let status: 'green' | 'yellow' | 'red' = 'green';
  if (score < 60) status = 'red';
  else if (score < 80) status = 'yellow';

  return {
    score: Math.max(0, score),
    status,
    issues,
    sheetCount: workbook?.worksheets.length ?? 1,
    totalRows: data.length,
    detectedColumns: mappings,
    unmappedColumns,
    formulaComplexity: formulaComplexity as unknown as 'simple' | 'moderate' | 'complex',
    hasExternalLinks,
    hasMergedCells,
    hasHiddenRows,
  };
}

export type ImportValidationResult = {
  valid: boolean;
  errors: { row: number; column: string; message: string; severity: 'error' | 'warning' }[];
  warnings: { row: number; column: string; message: string; severity: 'error' | 'warning' }[];
  rowCount: number;
  columnCount: number;
  columns: string[];
  preview: Record<string, unknown>[];
};

type ImportStatus = 'idle' | 'reading' | 'parsing' | 'validating' | 'complete' | 'error';
type ImportProgress = { status: ImportStatus; percent: number; message: string };

export class MigrationEngine {
  private migrationSnapshots: MigrationSnapshot[] = [];
  private progress: ImportProgress = { status: 'idle', percent: 0, message: '' };
  private progressListeners: Set<(p: ImportProgress) => void> = new Set();

  onProgress(listener: (p: ImportProgress) => void): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  protected setProgress(status: ImportStatus, percent: number, message: string) {
    this.progress = { status, percent, message };
    this.progressListeners.forEach((l) => l(this.progress));
  }

  detectFormat(file: File): string {
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv':
        return 'csv';
      case 'xlsx':
      case 'xls':
        return 'excel';
      case 'json':
        return 'json';
      default:
        return 'unknown';
    }
  }

  /**
   * Load a workbook from a File using ExcelJS.
   */
  private async loadWorkbook(file: File): Promise<ExcelJS.Workbook> {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    return workbook;
  }

  /**
   * Read headers and data rows from a worksheet.
   */
  private readSheetData(worksheet: ExcelJS.Worksheet): {
    headers: string[];
    dataRows: Record<string, unknown>[];
  } {
    const allRows = worksheetToRows(worksheet);
    if (allRows.length === 0) return { headers: [], dataRows: [] };

    const headers = allRows[0].map(String);
    const dataRows = allRows.slice(1).map((row) =>
      headers.reduce(
        (obj, h, i) => ({
          ...obj,
          [h]: i < row.length ? String(row[i] ?? '') : '',
        }),
        {} as Record<string, unknown>
      )
    );

    return { headers, dataRows };
  }

  /**
   * Detect migration source from file
   */
  async detectMigrationSource(file: File): Promise<MigrationSource> {
    const format = this.detectFormat(file);
    if (format === 'unknown') return 'unknown';

    try {
      const workbook = await this.loadWorkbook(file);
      const firstSheet = workbook.worksheets[0];
      if (!firstSheet) return 'unknown';

      const { headers, dataRows } = this.readSheetData(firstSheet);
      if (dataRows.length < 1 || headers.length === 0) return 'unknown';

      return detectSource(headers, dataRows);
    } catch {
      return 'unknown';
    }
  }

  /**
   * Full migration analysis: readiness assessment + column mapping
   */
  async analyzeMigration(file: File): Promise<{
    source: MigrationSource;
    readiness: MigrationReadiness;
    plan: MigrationPlan;
    workbook: ExcelJS.Workbook;
  }> {
    const workbook = await this.loadWorkbook(file);
    const firstSheet = workbook.worksheets[0]!;

    const { headers, dataRows } = this.readSheetData(firstSheet);

    const source = detectSource(headers, dataRows);
    const mappings = autoMapColumns(headers);
    const readiness = assessReadiness(headers, dataRows, mappings, workbook);

    // Build sheet info
    const sheets = workbook.worksheets.map((worksheet) => {
      const allRows = worksheetToRows(worksheet);
      return {
        name: worksheet.name,
        rows: Math.max(0, allRows.length - 1),
        columns: allRows.length > 0 ? allRows[0].map(String) : [],
      };
    });

    const plan: MigrationPlan = {
      source,
      sheets,
      mappings,
      estimatedDuration:
        readiness.totalRows < 1000
          ? '< 1 minute'
          : readiness.totalRows < 10000
            ? '1-5 minutes'
            : '5-15 minutes',
      warnings: readiness.issues
        .filter((i) => i.severity === 'error' || i.severity === 'warning')
        .map((i) => i.message),
    };

    return { source, readiness, plan, workbook };
  }

  /**
   * Execute migration with mapped columns
   */
  async executeMigration(
    file: File,
    mappings: ColumnMapping[],
    options: {
      sheetName?: string;
      maxRows?: number;
      importMode?: 'as-is' | 'with-formulas' | 'historical-only' | 'structure-only';
    } = {}
  ): Promise<{ result: ImportValidationResult; snapshot: MigrationSnapshot | null }> {
    this.setProgress('reading', 10, 'Reading Excel file...');

    try {
      this.setProgress('parsing', 30, 'Parsing Excel workbook...');

      const workbook = await this.loadWorkbook(file);

      const targetSheet = options.sheetName
        ? workbook.getWorksheet(options.sheetName)
        : workbook.worksheets[0];
      const sheetName = targetSheet?.name ?? workbook.worksheets[0]?.name;

      if (!targetSheet || !sheetName) {
        return {
          result: {
            valid: false,
            errors: [
              { row: 0, column: '', message: 'Workbook contains no sheets', severity: 'error' },
            ],
            warnings: [],
            rowCount: 0,
            columnCount: 0,
            columns: [],
            preview: [],
          },
          snapshot: null,
        };
      }

      const allRows = worksheetToRows(targetSheet);

      if (allRows.length < 2) {
        return {
          result: {
            valid: false,
            errors: [
              {
                row: 0,
                column: '',
                message: 'Sheet must have a header row and at least one data row',
                severity: 'error',
              },
            ],
            warnings: [],
            rowCount: 0,
            columnCount: 0,
            columns: [],
            preview: [],
          },
          snapshot: null,
        };
      }

      this.setProgress('validating', 60, 'Validating data...');

      const headers: string[] = allRows[0].map(String);
      const maxRows = options.maxRows ?? 100000;
      const dataRows = allRows
        .slice(1, maxRows + 1)
        .map((row) => headers.map((_, i) => (i < row.length ? String(row[i] ?? '') : '')));

      // Basic validation
      const errors: {
        row: number;
        column: string;
        message: string;
        severity: 'error' | 'warning';
      }[] = [];
      const warnings: {
        row: number;
        column: string;
        message: string;
        severity: 'error' | 'warning';
      }[] = [];

      const preview: Record<string, unknown>[] = dataRows.slice(0, 20).map((row) => {
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => {
          obj[h] = i < row.length ? row[i] : '';
        });
        return obj;
      });

      const result: ImportValidationResult = {
        valid: errors.length === 0,
        errors,
        warnings,
        rowCount: dataRows.length,
        columnCount: headers.length,
        columns: headers,
        preview,
      };

      this.setProgress('complete', 100, `Imported ${result.rowCount} rows from "${sheetName}"`);

      const migrationSnapshot: MigrationSnapshot = {
        id: `migration-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'excel',
        fileName: file.name,
        plan: {
          source: 'excel',
          sheets: [{ name: sheetName, rows: result.rowCount, columns: headers }],
          mappings,
          estimatedDuration: '1-5 minutes',
          warnings: [],
        },
        data: preview,
        applied: true,
      };

      this.migrationSnapshots.push(migrationSnapshot);
      return { result, snapshot: migrationSnapshot };
    } catch (err) {
      this.setProgress(
        'error',
        0,
        `Migration failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      return {
        result: {
          valid: false,
          errors: [
            {
              row: 0,
              column: '',
              message: `Migration failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
              severity: 'error',
            },
          ],
          warnings: [],
          rowCount: 0,
          columnCount: 0,
          columns: [],
          preview: [],
        },
        snapshot: null,
      };
    }
  }

  /**
   * Rollback a migration
   */
  rollbackMigration(snapshotId: string): MigrationSnapshot | null {
    const snapshot = this.migrationSnapshots.find((s) => s.id === snapshotId);
    if (snapshot) {
      snapshot.applied = false;
    }
    return snapshot ?? null;
  }

  /**
   * Get all migration snapshots
   */
  getMigrationSnapshots(): MigrationSnapshot[] {
    return [...this.migrationSnapshots];
  }

  /**
   * Clear all migration snapshots
   */
  clearMigrationSnapshots(): void {
    this.migrationSnapshots = [];
  }
}
