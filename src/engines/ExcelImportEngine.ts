/* eslint-disable @typescript-eslint/no-explicit-any */
// =============================================================================
// EXCEL IMPORT ENGINE
// Parse Excel (.xlsx/.xls) and CSV files, auto-detect columns, validate data
// Pure TypeScript, deterministic, testable
// =============================================================================

import ExcelJS from 'exceljs';
import { sanitizeForDisplay } from '@/utils/security';

export type FileFormat = 'xlsx' | 'csv';

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface ParsedWorkbook {
  fileName: string;
  format: FileFormat;
  sheets: ParsedSheet[];
  sheetCount: number;
  totalRows: number;
}

export type TargetField =
  | 'date'
  | 'accountCode'
  | 'accountName'
  | 'debit'
  | 'credit'
  | 'amount'
  | 'description'
  | 'reference'
  | 'department'
  | 'entity'
  | 'period'
  | 'skip';

export interface AutoColumnMapping {
  sourceColumn: string;
  targetField: TargetField;
  confidence: number; // 0-1
  reason: string;
}

export interface ImportValidationError {
  row: number;
  column: string;
  value: unknown;
  message: string;
}

export interface ImportValidationResult {
  valid: boolean;
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
  mappedRowCount: number;
}

export interface MappedRow {
  date: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  amount: number;
  description: string;
  reference: string;
  department: string;
  entity: string;
  period: string;
  [key: string]: unknown;
}

const DATE_KEYWORDS = [
  'date',
  'posting date',
  'post date',
  'transaction date',
  'trans date',
  'doc date',
  'document date',
  'period',
  'month',
  'fiscal period',
];
const ACCOUNT_CODE_KEYWORDS = [
  'account',
  'account code',
  'acct code',
  'gl account',
  'gl code',
  'account number',
  'code',
  'cost center',
  'cost centre',
  'department code',
];
const ACCOUNT_NAME_KEYWORDS = [
  'account name',
  'acct name',
  'name',
  'description',
  'account desc',
  'gl name',
];
const DEBIT_KEYWORDS = ['debit', 'dr', 'debit amount', 'debits'];
const CREDIT_KEYWORDS = ['credit', 'cr', 'credit amount', 'credits'];
const AMOUNT_KEYWORDS = ['amount', 'net amount', 'value', 'total', 'net change'];
const DESCRIPTION_KEYWORDS = [
  'description',
  'memo',
  'narrative',
  'details',
  'comment',
  'notes',
  'line description',
];
const REFERENCE_KEYWORDS = [
  'reference',
  'ref',
  'document',
  'doc number',
  'invoice',
  'invoice number',
  'voucher',
  'check',
  'cheque',
];
const DEPARTMENT_KEYWORDS = [
  'department',
  'dept',
  'cost center',
  'cost centre',
  'business unit',
  'bu',
];
const ENTITY_KEYWORDS = ['entity', 'company', 'subsidiary', 'legal entity', 'entity code'];

const NUMERIC_REGEX = /^-?[\d,]+\.?\d*$/;

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ');
}

function matchKeyword(header: string, keywords: string[]): number {
  const normalized = normalizeHeader(header);
  for (let i = 0; i < keywords.length; i++) {
    if (normalized === keywords[i]!) return 1.0 - i * 0.05;
    if (normalized.includes(keywords[i]!)) return 0.7 - i * 0.03;
  }
  return 0;
}

function isDateString(v: unknown): boolean {
  if (v instanceof Date) return true;
  if (typeof v !== 'string' && typeof v !== 'number') return false;
  const s = String(v);
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(s)) return true;
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(s)) return true;
  // Excel serial date numbers
  if (typeof v === 'number' && v > 25569 && v < 60000) return true;
  return false;
}

function isNumericString(v: unknown): boolean {
  if (typeof v === 'number') return true;
  if (typeof v !== 'string') return false;
  return NUMERIC_REGEX.test(v.trim());
}

function parseNumeric(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return 0;
  const cleaned = v.replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function formatValue(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (v === null || v === undefined) return '';
  return String(v);
}

export class ExcelImportEngine {
  // ---------------------------------------------------------------------------
  // Parse File
  // ---------------------------------------------------------------------------

  async parseFile(file: File): Promise<ParsedWorkbook> {
    const buffer = await file.arrayBuffer();
    const format = this.detectFormat(file.name);
    const workbook = new ExcelJS.Workbook();

    if (format === 'csv') {
      // Browser-compatible CSV parsing — no Node streams needed
      const text = new TextDecoder().decode(buffer);
      const rows = text.split(/\r?\n/).filter((r) => r.trim());
      const sheet = workbook.addWorksheet('Sheet1');
      for (const row of rows) {
        // Simple CSV split (handles basic cases; no quoted-comma support)
        sheet.addRow(row.split(',').map((c) => c.trim()));
      }
    } else {
      await workbook.xlsx.load(buffer);
    }

    const sheets: ParsedSheet[] = [];

    workbook.eachSheet((worksheet) => {
      const rows: Record<string, unknown>[] = [];
      let headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          headers = (row.values as any[]).slice(1).map(String);
          return;
        }

        const rowData: Record<string, unknown> = {};
        const values = row.values as any[];
        headers.forEach((header, index) => {
          // values[0] is empty, values[1] is first col
          const val = values[index + 1];
          // exceljs sometimes returns objects for formulas or shared strings
          if (val && typeof val === 'object' && 'result' in val) {
            rowData[header] = val.result;
          } else {
            rowData[header] = val;
          }
        });
        rows.push(rowData);
      });

      sheets.push({
        name: worksheet.name,
        headers,
        rows,
        rowCount: rows.length,
      });
    });

    const totalRows = sheets.reduce((sum, s) => sum + s.rowCount, 0);

    return {
      fileName: file.name,
      format,
      sheets,
      sheetCount: sheets.length,
      totalRows,
    };
  }

  // ---------------------------------------------------------------------------
  // Auto-Detect Column Mappings
  // ---------------------------------------------------------------------------

  autoDetectMappings(
    headers: string[],
    sampleRows: Record<string, unknown>[]
  ): AutoColumnMapping[] {
    const mappings: AutoColumnMapping[] = [];

    for (const header of headers) {
      let bestField: TargetField = 'skip';
      let bestConfidence = 0;
      let reason = '';

      // Check keyword matches
      const checks: [string[], TargetField][] = [
        [DATE_KEYWORDS, 'date'],
        [ACCOUNT_CODE_KEYWORDS, 'accountCode'],
        [ACCOUNT_NAME_KEYWORDS, 'accountName'],
        [DEBIT_KEYWORDS, 'debit'],
        [CREDIT_KEYWORDS, 'credit'],
        [AMOUNT_KEYWORDS, 'amount'],
        [DESCRIPTION_KEYWORDS, 'description'],
        [REFERENCE_KEYWORDS, 'reference'],
        [DEPARTMENT_KEYWORDS, 'department'],
        [ENTITY_KEYWORDS, 'entity'],
      ];

      for (const [keywords, field] of checks) {
        const score = matchKeyword(header, keywords);
        if (score > bestConfidence) {
          bestConfidence = score;
          bestField = field;
          reason = `Keyword match: "${header}" → ${field} (${(score * 100).toFixed(0)}%)`;
        }
      }

      // Boost confidence with sample data analysis
      if (sampleRows.length > 0 && bestConfidence < 0.9) {
        const values = sampleRows.map((r) => r[header]!).filter((v) => v !== '' && v != null);
        if (values.length > 0) {
          const dateCount = values.filter(isDateString).length;
          const numericCount = values.filter(isNumericString).length;
          const dateRatio = dateCount / values.length;
          const numericRatio = numericCount / values.length;

          if (dateRatio > 0.8 && bestField !== 'date') {
            bestField = 'date';
            bestConfidence = Math.max(bestConfidence, 0.85);
            reason = `Date pattern detected in ${Math.round(dateRatio * 100)}% of values`;
          } else if (
            numericRatio > 0.8 &&
            (bestField === 'debit' || bestField === 'credit' || bestField === 'amount')
          ) {
            bestConfidence = Math.max(bestConfidence, 0.8);
            reason = `Numeric pattern + keyword match`;
          }
        }
      }

      mappings.push({
        sourceColumn: header,
        targetField: bestField,
        confidence: bestConfidence,
        reason,
      });
    }

    // Resolve conflicts: ensure only one date, one accountCode, etc.
    this.resolveMappingConflicts(mappings);

    return mappings;
  }

  private resolveMappingConflicts(mappings: AutoColumnMapping[]): void {
    const uniqueFields: TargetField[] = ['date', 'accountCode', 'accountName'];

    for (const field of uniqueFields) {
      const candidates = mappings
        .filter((m) => m.targetField === field)
        .sort((a, b) => b.confidence - a.confidence);

      // Keep only the highest confidence, demote others to skip
      for (let i = 1; i < candidates.length; i++) {
        candidates[i]!.targetField = 'skip';
        candidates[i]!.reason =
          `Demoted: "${candidates[0]!.sourceColumn}" is a better match for ${field}`;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Map and Validate Data
  // ---------------------------------------------------------------------------

  mapData(
    rows: Record<string, unknown>[],
    mappings: AutoColumnMapping[]
  ): { mapped: MappedRow[]; errors: ImportValidationError[]; warnings: ImportValidationError[] } {
    const errors: ImportValidationError[] = [];
    const warnings: ImportValidationError[] = [];
    const mapped: MappedRow[] = [];

    const columnMap = new Map<TargetField, string>();
    for (const m of mappings) {
      if (m.targetField !== 'skip') {
        columnMap.set(m.targetField, m.sourceColumn);
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed + header row

      const getVal = (field: TargetField): unknown => {
        const col = columnMap.get(field);
        return col ? row![col] : undefined;
      };

      const dateVal = getVal('date');
      const accountCodeVal = getVal('accountCode');
      const debitVal = getVal('debit');
      const creditVal = getVal('credit');
      const amountVal = getVal('amount');

      // Validate required fields
      if (!accountCodeVal || String(accountCodeVal).trim() === '') {
        errors.push({
          row: rowNum,
          column: 'accountCode',
          value: accountCodeVal,
          message: 'Missing account code',
        });
        continue;
      }

      if (!dateVal || String(dateVal).trim() === '') {
        warnings.push({ row: rowNum, column: 'date', value: dateVal, message: 'Missing date' });
      }

      const debit = parseNumeric(debitVal);
      const credit = parseNumeric(creditVal);
      const amount = parseNumeric(amountVal);

      // Warn if both debit/credit and amount are provided and inconsistent
      if (debitVal !== undefined && creditVal !== undefined && amountVal !== undefined) {
        if (Math.abs(debit - credit - amount) > 0.01 && Math.abs(amount) > 0.01) {
          warnings.push({
            row: rowNum,
            column: 'amount',
            value: amountVal,
            message: `Amount (${amount}) != Debit (${debit}) - Credit (${credit})`,
          });
        }
      }

      mapped.push({
        date: formatValue(dateVal),
        accountCode: sanitizeForDisplay(String(accountCodeVal).trim()),
        accountName: sanitizeForDisplay(String(getVal('accountName') ?? '')),
        debit: Math.abs(debit),
        credit: Math.abs(credit),
        amount: columnMap.has('amount') ? amount : debit - credit,
        description: sanitizeForDisplay(String(getVal('description') ?? '')),
        reference: sanitizeForDisplay(String(getVal('reference') ?? '')),
        department: sanitizeForDisplay(String(getVal('department') ?? '')),
        entity: sanitizeForDisplay(String(getVal('entity') ?? '')),
        period: sanitizeForDisplay(String(getVal('period') ?? '')),
      });
    }

    return { mapped, errors, warnings };
  }

  // ---------------------------------------------------------------------------
  // Validate Import
  // ---------------------------------------------------------------------------

  validate(rows: MappedRow[]): ImportValidationResult {
    const errors: ImportValidationError[] = [];
    const warnings: ImportValidationError[] = [];

    if (rows.length === 0) {
      errors.push({ row: 0, column: 'file', value: null, message: 'No data rows found' });
      return { valid: false, errors, warnings, mappedRowCount: 0 };
    }

    // Check for balanced debits/credits
    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    const imbalance = Math.abs(totalDebit - totalCredit);

    if (imbalance > 0.01 && totalDebit > 0 && totalCredit > 0) {
      warnings.push({
        row: 0,
        column: 'balance',
        value: imbalance,
        message: `Debits ($${totalDebit.toFixed(2)}) and Credits ($${totalCredit.toFixed(2)}) are imbalanced by $${imbalance.toFixed(2)}`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      mappedRowCount: rows.length,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private detectFormat(fileName: string): FileFormat {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx') return 'xlsx';
    if (ext === 'csv') return 'csv';
    throw new Error(`Unsupported file format: .${ext}. Please use .xlsx or .csv.`);
  }

  getPreview(rows: Record<string, unknown>[], count: number = 10): Record<string, unknown>[] {
    return rows.slice(0, count);
  }
}
