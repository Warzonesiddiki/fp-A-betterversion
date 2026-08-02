// =============================================================================
// REPORT BUILDER — Export Logic
// PDF, Excel, CSV generation and layout serialization
// =============================================================================

import {
  type ReportDefinition,
  type ReportLayout,
  type PDFExportMetadata,
  type ExcelExportResult,
  type CSVExportResult,
  type CubeData,
  type ExportFormat,
  type NumberFormat,
} from './report-builder-types';
import { resolveLayout } from './report-builder-formulas';
import { formatMoney } from '../utils/money';

// ---------------------------------------------------------------------------
// PDF Export Metadata
// ---------------------------------------------------------------------------

export function generatePDFMetadata(
  report: ReportDefinition,
  options?: Partial<PDFExportMetadata>
): PDFExportMetadata {
  return {
    reportId: report.id,
    title: report.name,
    subtitle: report.description || undefined,
    orientation: 'landscape',
    pageSize: 'letter',
    margins: { top: 72, bottom: 72, left: 54, right: 54 },
    showPageNumbers: true,
    showTimestamp: true,
    ...options,
  };
}

// ---------------------------------------------------------------------------
// Layout Serialization
// ---------------------------------------------------------------------------

export function exportLayout(layout: ReportLayout): string {
  return JSON.stringify(layout, null, 2);
}

export function importLayout(json: string): ReportLayout {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!isValidLayout(parsed)) {
      throw new Error('Invalid layout structure');
    }
    return parsed;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown parse error';
    throw new Error(`Failed to import layout: ${message}`);
  }
}

function isValidLayout(value: unknown): value is ReportLayout {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.rows) &&
    Array.isArray(obj.columns) &&
    typeof obj.columnWidths === 'object' &&
    typeof obj.defaultRowHeight === 'number'
  );
}

// ---------------------------------------------------------------------------
// Excel Export
// ---------------------------------------------------------------------------

export function generateExcelExport(
  report: ReportDefinition,
  cubeData: CubeData
): ExcelExportResult {
  const resolved = resolveLayout(report.layout, cubeData, formatNumberForExport);
  const visibleColumns = report.layout.columns.filter((col) => col.isVisible);

  const headerRow = visibleColumns.map((col) => col.header);

  const dataRows: Array<Array<string | number | boolean | null>> = [];

  for (let ri = 0; ri < report.layout.rows.length; ri++) {
    const row = report.layout.rows[ri];
    if (!row!.isVisible) continue;

    const excelRow: Array<string | number | boolean | null> = [];
    for (let ci = 0; ci < report.layout.columns.length; ci++) {
      const col = report.layout.columns[ci];
      if (!col!.isVisible) continue;

      const cell = resolved[ri]?.[ci];
      if (cell) {
        excelRow.push(cell.rawValue);
      } else {
        excelRow.push(null);
      }
    }
    dataRows.push(excelRow);
  }

  const columnWidths = visibleColumns.map((col) => col.width);

  return {
    sheets: [
      {
        name: report.name.substring(0, 31),
        data: [headerRow, ...dataRows],
        columnWidths,
      },
    ],
    metadata: {
      title: report.name,
      createdAt: new Date().toISOString(),
      author: report.createdBy,
      orientation: 'landscape',
    },
  };
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

export function generateCSVExport(report: ReportDefinition, cubeData: CubeData): CSVExportResult {
  const resolved = resolveLayout(report.layout, cubeData, formatNumberForExport);
  const visibleColumns = report.layout.columns.filter((col) => col.isVisible);

  const escapeCSV = (value: string | number | boolean | null): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [];

  const headerLine = visibleColumns.map((col) => escapeCSV(col.header)).join(',');
  lines.push(headerLine);

  for (let ri = 0; ri < report.layout.rows.length; ri++) {
    const row = report.layout.rows[ri];
    if (!row!.isVisible) continue;

    const csvCells: string[] = [];
    for (let ci = 0; ci < report.layout.columns.length; ci++) {
      const col = report.layout.columns[ci];
      if (!col!.isVisible) continue;

      const cell = resolved[ri]?.[ci];
      if (cell) {
        csvCells.push(escapeCSV(cell.rawValue));
      } else {
        csvCells.push('');
      }
    }
    lines.push(csvCells.join(','));
  }

  const safeName = report.name.replace(/[^a-zA-Z0-9_-]/g, '_');

  return {
    content: lines.join('\n'),
    filename: `${safeName}.csv`,
    mimeType: 'text/csv',
  };
}

// ---------------------------------------------------------------------------
// Multi-format Export Dispatcher
// ---------------------------------------------------------------------------

export function exportReport(
  report: ReportDefinition,
  cubeData: CubeData,
  format: ExportFormat
): PDFExportMetadata | ExcelExportResult | CSVExportResult {
  switch (format) {
    case 'pdf':
      return generatePDFMetadata(report);
    case 'excel':
      return generateExcelExport(report, cubeData);
    case 'csv':
      return generateCSVExport(report, cubeData);
    default: {
      const _exhaustive: never = format;
      throw new Error(`Unsupported export format: ${_exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helper (same as ReportBuilderEngine.formatNumber)
// ---------------------------------------------------------------------------

function formatNumberForExport(value: number, format: NumberFormat, decimals = 2): string {
  if (!Number.isFinite(value)) return '#N/A';

  switch (format) {
    case 'currency': {
      const abs = formatMoney(Math.abs(value), { places: decimals });
      return value < 0 ? `($${abs})` : `$${abs}`;
    }
    case 'percentage':
      return `${formatMoney(value * 100, { places: decimals })}%`;
    case 'compact': {
      const absValue = Math.abs(value);
      const sign = value < 0 ? '(' : '';
      const end = value < 0 ? ')' : '';
      if (absValue >= 1_000_000_000)
        return `${sign}$${formatMoney(absValue / 1_000_000_000, { places: 1 })}B${end}`;
      if (absValue >= 1_000_000)
        return `${sign}$${formatMoney(absValue / 1_000_000, { places: 1 })}M${end}`;
      if (absValue >= 1_000)
        return `${sign}$${formatMoney(absValue / 1_000, { places: 1 })}K${end}`;
      return `${sign}$${formatMoney(absValue, { places: decimals })}${end}`;
    }
    case 'wholenumber':
      return Math.round(value).toLocaleString('en-US');
    case 'decimal':
    default:
      return value.toFixed(decimals);
  }
}
