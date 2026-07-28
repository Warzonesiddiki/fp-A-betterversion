import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeSpreadsheetCell,
  sanitizeSpreadsheetText,
  isDangerousSpreadsheetCell,
} from './spreadsheetSanitize';
import { toCSV } from './csv';
import { sanitizeExcelRow } from '@/engines/exportExcel';
import { PivotTableEngine } from '@/engines/PivotTableEngine';
import { ExportEngine } from '@/engines/ExportEngine';

/**
 * F-0017 / KAV-13: CSV/Excel formula injection neutralization.
 * The old exportToExcel converted '=...' strings into LIVE Excel formulas.
 * No exported cell may begin with an unneutralized dangerous character.
 */

const PAYLOADS = [
  '=cmd|"/c calc"!A1',
  '=HYPERLINK("http://evil.example","click")',
  '+cmd|"/c calc"!A1',
  '-2+3+cmd|"/c calc"!A1',
  '@SUM(1+1)*cmd|"/c calc"!A1',
  '\t=cmd|"/c calc"!A1',
  '\r=1+1',
  '  =1+1', // leading whitespace then formula
];

describe('spreadsheetSanitize', () => {
  it.each(PAYLOADS)('neutralizes payload: %j', (payload) => {
    const out = sanitizeSpreadsheetText(payload) as string;
    expect(out.startsWith("'")).toBe(true);
    expect(isDangerousSpreadsheetCell(out)).toBe(false);
  });

  it('leaves safe strings, numbers, booleans, null untouched', () => {
    expect(sanitizeSpreadsheetCell('Revenue')).toBe('Revenue');
    expect(sanitizeSpreadsheetCell('1,000.50')).toBe('1,000.50');
    expect(sanitizeSpreadsheetCell('total - including minus inside')).toBe(
      'total - including minus inside'
    );
    expect(sanitizeSpreadsheetCell(1234.56)).toBe(1234.56);
    expect(sanitizeSpreadsheetCell(-42)).toBe(-42); // numeric negative is data, not a payload
    expect(sanitizeSpreadsheetCell(true)).toBe(true);
    expect(sanitizeSpreadsheetCell(null)).toBe(null);
    expect(sanitizeSpreadsheetText(undefined)).toBe('');
  });
});

describe('F-0017: csv.toCSV neutralizes dangerous cells', () => {
  it('KAV-13: every payload is prefixed even when quoting rules trigger', () => {
    const csv = toCSV(
      [
        ...PAYLOADS.map((p, i) => ({ name: p, amount: i })),
        { name: 'safe "quoted", value', amount: 1 },
      ],
      ['name', 'amount']
    );
    const lines = csv.split('\n').slice(1);
    for (const line of lines) {
      const firstCell = line.startsWith('"')
        ? line.slice(1) // strip opening quote
        : line.split(',')[0]!;
      expect(isDangerousSpreadsheetCell(firstCell)).toBe(false);
    }
    // Payloads are neutralized first, then CSV-quoted around the prefix.
    expect(csv).toContain('"\'=cmd|');
    expect(csv).not.toContain('\n=cmd');
  });
});

describe('F-0017: exportExcel never emits live formulas from data', () => {
  it('sanitizeExcelRow returns no { formula } objects and prefixes payloads', () => {
    const row = sanitizeExcelRow(['=1+1+cmd|"/c calc"!A1', '@SUM(A1)', 'safe', 42, null]);
    expect(row[0]).toBe('\'=1+1+cmd|"/c calc"!A1');
    expect(row[1]).toBe("'@SUM(A1)");
    expect(row[2]).toBe('safe');
    expect(row[3]).toBe(42);
    for (const cell of row) {
      expect(typeof cell === 'object' && cell !== null && 'formula' in (cell as object)).toBe(
        false
      );
    }
  });
});

describe('F-0017: PivotTableEngine.toCSV neutralizes user-controlled labels', () => {
  it('row labels and headers are sanitized', () => {
    const engine = new PivotTableEngine();
    const pivot = engine.createPivot(
      [
        { name: '=evil()', region: 'N', sales: 10 },
        { name: '@SUM(1)', region: 'S', sales: 20 },
      ],
      {
        rows: ['name'],
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: {},
        showTotals: false,
        showSubtotals: false,
      }
    );
    const csv = engine.toCSV(pivot);
    for (const line of csv.split('\n')) {
      const cell = line.split(',')[0]!;
      expect(isDangerousSpreadsheetCell(cell)).toBe(false);
    }
    expect(csv).toContain("'=evil()");
  });
});

describe('F-0017: ExportEngine.exportToCSV neutralizes cells', () => {
  it('captured blob content contains no live payload', async () => {
    const snapshots: Array<{ blob: Blob; filename: string }> = [];
    vi.doMock('@/utils/canvasFactory', async (importOriginal) => {
      const mod = await importOriginal<typeof import('@/utils/canvasFactory')>();
      return {
        ...mod,
        downloadBlob: (blob: Blob, filename: string) => snapshots.push({ blob, filename }),
      };
    });
    vi.resetModules();
    const { ExportEngine: ReloadedEngine } = await import('@/engines/ExportEngine');
    ReloadedEngine.exportToCSV(
      {
        headers: ['name', 'amount'],
        rows: [
          [PAYLOADS[0] as string, 5],
          ['=HYPERLINK("http://x")' as string, 10],
        ],
      },
      { format: 'csv', title: 'injection-test' }
    );
    expect(snapshots).toHaveLength(1);
    const text = await snapshots[0]!.blob.text();
    expect(text).toContain("'=cmd|");
    expect(text).toContain("'=HYPERLINK");
    const dataLines = text.split(/\r?\n/).slice(1).filter(Boolean);
    for (const line of dataLines) {
      // CSV quoting wraps the neutralized prefix: "'=payload..."
      const unwrapped = line.startsWith('"') ? line.slice(1) : line;
      expect(unwrapped.startsWith("'")).toBe(true);
    }
    // Also verify the statically-imported class path used above type-checks.
    expect(ExportEngine).toBeDefined();
  });
});
