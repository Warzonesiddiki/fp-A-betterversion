import { ImportEngine, type ImportProgress } from '@/engines/ImportEngine';
import type { ImportFormat } from '@/store/glUploadStore';
import { ExcelImportEngine, type AutoColumnMapping } from '@/engines/ExcelImportEngine';

export type ImportStage =
  | 'detect'
  | 'parse'
  | 'map'
  | 'validate'
  | 'preview'
  | 'import'
  | 'complete'
  | 'error';

export interface GLImportOptions {
  requiredColumns?: string[];
  numericColumns?: string[];
  dateColumns?: string[];
  maxRows?: number;
  autoMap?: boolean;
  validateAccounts?: boolean;
  accountCodes?: string[];
}

export interface GLImportStageProgress {
  stage: ImportStage;
  percent: number;
  message: string;
}

export interface GLParseResult {
  fileName: string;
  format: ImportFormat;
  headers: string[];
  rowCount: number;
  columnCount: number;
  previewRows: Record<string, unknown>[];
  allRows: Record<string, unknown>[];
}

export interface GLMappingResult {
  autoMappings: AutoColumnMapping[];
  userMappings: Record<string, string>;
  unmappedRequiredFields: string[];
  confidence: number;
}

export interface GLValidationResult {
  valid: boolean;
  rowCount: number;
  errorCount: number;
  warningCount: number;
  errors: Array<{ row: number; column: string; message: string; value?: unknown }>;
  warnings: Array<{ row: number; column: string; message: string; value?: unknown }>;
  validRows: Record<string, unknown>[];
}

export interface GLImportSummary {
  fileName: string;
  format: ImportFormat;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorCount: number;
  warningCount: number;
  duration: number;
}

export class GLImportService {
  private importEngine: ImportEngine;
  private excelEngine: ExcelImportEngine;
  private progressListeners: Set<(p: GLImportStageProgress) => void> = new Set();

  constructor() {
    this.importEngine = new ImportEngine();
    this.excelEngine = new ExcelImportEngine();
    this.importEngine.onProgress(this.handleImportEngineProgress);
  }

  onProgress(listener: (p: GLImportStageProgress) => void): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private emitProgress(stage: ImportStage, percent: number, message: string): void {
    const progress: GLImportStageProgress = { stage, percent, message };
    this.progressListeners.forEach((l) => l(progress));
  }

  private handleImportEngineProgress = (p: ImportProgress): void => {
    this.emitProgress('import', p.percent, p.message);
  };

  detectFormat(file: File): { format: string; supported: boolean } {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const supported = ext === 'csv' || ext === 'xlsx' || ext === 'xls';
    return { format: ext, supported };
  }

  async parseFile(file: File, options: GLImportOptions = {}): Promise<GLParseResult> {
    this.emitProgress('detect', 5, 'Detecting file format...');

    const { format, supported } = this.detectFormat(file);
    if (!supported) {
      throw new Error(`Unsupported file format: .${format}. Please use .csv, .xlsx, or .xls.`);
    }
    // Narrow the raw extension to the supported import formats (guaranteed by
    // the supported check above) so it satisfies ImportFormat without a cast.
    const importFormat: ImportFormat =
      format === 'csv' || format === 'xlsx' || format === 'xls' ? format : 'unknown';

    if (format === 'csv') {
      this.emitProgress('parse', 20, 'Parsing CSV file...');
      const { result } = await this.importEngine.importCSV(file, {
        requiredColumns: options.requiredColumns,
        numericColumns: options.numericColumns,
        dateColumns: options.dateColumns,
        maxRows: options.maxRows,
      });

      const allRows = result.preview.map((row, i) => ({
        ...row,
        _rowNum: i + 2,
      }));

      this.emitProgress('parse', 40, `Parsed ${result.rowCount} rows`);

      return {
        fileName: file.name,
        format: importFormat,
        headers: result.columns,
        rowCount: result.rowCount,
        columnCount: result.columnCount,
        previewRows: result.preview,
        allRows,
      };
    }

    this.emitProgress('parse', 20, 'Parsing Excel file...');
    const workbook = await this.excelEngine.parseFile(file);
    const sheet = workbook.sheets[0];
    if (!sheet) {
      throw new Error('No sheets found in the workbook');
    }

    const headers = sheet.headers;
    const allRows = sheet.rows.map((row, i) => ({
      ...row,
      _rowNum: i + 2,
    }));
    const previewRows = this.excelEngine.getPreview(sheet.rows, 20);

    this.emitProgress('parse', 40, `Parsed ${sheet.rowCount} rows from sheet "${sheet.name}"`);

    return {
      fileName: file.name,
      format: importFormat,
      headers,
      rowCount: sheet.rowCount,
      columnCount: headers.length,
      previewRows,
      allRows,
    };
  }

  autoDetectMappings(headers: string[], sampleRows: Record<string, unknown>[]): GLMappingResult {
    this.emitProgress('map', 50, 'Auto-detecting column mappings...');

    const autoMappings = this.excelEngine.autoDetectMappings(headers, sampleRows);

    const userMappings: Record<string, string> = {};
    for (const m of autoMappings) {
      if (m.targetField !== 'skip') {
        userMappings[m.sourceColumn] = m.targetField;
      }
    }

    const avgConfidence =
      autoMappings.length > 0
        ? autoMappings.reduce((sum, m) => sum + m.confidence, 0) / autoMappings.length
        : 0;

    this.emitProgress('map', 60, 'Mapping complete');

    return {
      autoMappings,
      userMappings,
      unmappedRequiredFields: autoMappings
        .filter((m) => m.confidence < 0.5)
        .map((m) => m.sourceColumn),
      confidence: avgConfidence,
    };
  }

  validateData(
    rows: Record<string, unknown>[],
    mappings: Record<string, string>,
    options: GLImportOptions = {}
  ): GLValidationResult {
    this.emitProgress('validate', 70, 'Validating data...');

    const errors: GLValidationResult['errors'] = [];
    const warnings: GLValidationResult['warnings'] = [];
    const validRows: Record<string, unknown>[] = [];

    const fieldToCol = new Map(Object.entries(mappings).map(([col, field]) => [field, col]));
    const requiredFields = ['accountCode'];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      let rowValid = true;

      for (const field of requiredFields) {
        const col = fieldToCol.get(field);
        const val = col ? row?.[col] : undefined;
        if (val == null || String(val).trim() === '') {
          errors.push({
            row: rowNum,
            column: field,
            message: `Missing required field: ${field}`,
            value: val,
          });
          rowValid = false;
        }
      }

      if (options.validateAccounts && options.accountCodes) {
        const col = fieldToCol.get('accountCode');
        const val = col ? String(row?.[col] ?? '').trim() : '';
        if (val && !options.accountCodes.includes(val)) {
          warnings.push({
            row: rowNum,
            column: 'accountCode',
            message: `Account code "${val}" not found in chart of accounts`,
            value: val,
          });
        }
      }

      if (rowValid) {
        const mappedRow: Record<string, unknown> = {};
        for (const [col, field] of Object.entries(mappings)) {
          mappedRow[field] = row?.[col];
        }
        validRows.push(mappedRow);
      }
    }

    this.emitProgress('validate', 80, `Validation complete: ${errors.length} errors`);

    return {
      valid: errors.length === 0,
      rowCount: rows.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors,
      warnings,
      validRows,
    };
  }

  async confirmImport(
    fileName: string,
    format: ImportFormat,
    validRows: Record<string, unknown>[],
    totalRows: number,
    errorCount: number,
    warningCount: number
  ): Promise<GLImportSummary> {
    const startTime = performance.now();

    this.emitProgress('import', 90, `Importing ${validRows.length} rows...`);

    await new Promise((r) => setTimeout(r, 50));

    const duration = performance.now() - startTime;

    this.emitProgress('complete', 100, 'Import complete');

    return {
      fileName,
      format,
      totalRows,
      importedRows: validRows.length,
      skippedRows: totalRows - validRows.length,
      errorCount,
      warningCount,
      duration,
    };
  }

  destroy(): void {
    this.progressListeners.clear();
  }
}
