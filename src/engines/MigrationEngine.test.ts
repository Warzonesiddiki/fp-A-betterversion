/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach } from 'vitest';
import ExcelJS from 'exceljs';
import { ImportEngine } from './ImportEngine';
import { MigrationEngine } from './MigrationEngine';

/**
 * Helper: create an xlsx File from rows using ExcelJS.
 */
async function createXlsxFile(
  rows: (string | number)[][],
  fileName: string,
  sheetName = 'Data'
): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  for (const row of rows) {
    worksheet.addRow(row);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], fileName, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('ImportEngine (base)', () => {
  let engine: ImportEngine;

  beforeEach(() => {
    engine = new ImportEngine();
  });

  describe('auto-detection', () => {
    it('should detect CSV files by extension', () => {
      const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
      expect(engine.detectFormat(file)).toBe('csv');
    });

    it('should detect Excel files by extension', () => {
      const file = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      expect(engine.detectFormat(file)).toBe('excel');
    });

    it('should detect JSON files by extension', () => {
      const file = new File(['[]'], 'test.json', { type: 'application/json' });
      expect(engine.detectFormat(file)).toBe('json');
    });

    it('should return unknown for unsupported formats', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(engine.detectFormat(file)).toBe('unknown');
    });
  });

  describe('CSV import', () => {
    it('should import valid CSV with auto-delimiter detection', async () => {
      const csv = 'Account,Amount,Date\nRevenue,1000,2024-01-15\nCOGS,500,2024-01-15';
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      const { result, snapshot } = await engine.importCSV(file);

      expect(result.valid).toBe(true);
      expect(result.rowCount).toBe(2);
      expect(result.columns).toEqual(['Account', 'Amount', 'Date']);
      expect(result.preview).toHaveLength(2);
      expect(snapshot).not.toBeNull();
      expect(snapshot?.format).toBe('csv');
    });

    it('should handle tab-delimited CSV', async () => {
      const csv = 'Account\tAmount\nRevenue\t1000\nCOGS\t500';
      const file = new File([csv], 'test.tsv', { type: 'text/tab-separated-values' });
      const { result } = await engine.importCSV(file);

      expect(result.valid).toBe(true);
      expect(result.columns).toEqual(['Account', 'Amount']);
    });

    it('should reject empty CSV', async () => {
      const file = new File([''], 'empty.csv', { type: 'text/csv' });
      const { result } = await engine.importCSV(file);

      expect(result.valid).toBe(false);
      expect(result!.errors[0]!.message).toContain('header row');
    });

    it('should handle quoted fields with commas', async () => {
      const csv = 'Name,Description\n"Acme, Inc","A company"\n"Other","Another"';
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      const { result } = await engine.importCSV(file);

      expect(result.valid).toBe(true);
      expect(result!.preview[0]!.Name).toBe('Acme, Inc');
    });
  });

  describe('JSON import', () => {
    it('should import valid JSON array', async () => {
      const data = [
        { account: 'Revenue', amount: 1000 },
        { account: 'COGS', amount: 500 },
      ];
      const file = new File([JSON.stringify(data)], 'test.json', { type: 'application/json' });
      const { result } = await engine.importJSON(file);

      expect(result.valid).toBe(true);
      expect(result.rowCount).toBe(2);
      expect(result.columns).toEqual(['account', 'amount']);
    });

    it('should handle single JSON object', async () => {
      const data = { account: 'Revenue', amount: 1000 };
      const file = new File([JSON.stringify(data)], 'test.json', { type: 'application/json' });
      const { result } = await engine.importJSON(file);

      expect(result.valid).toBe(true);
      expect(result.rowCount).toBe(1);
    });

    it('should reject invalid JSON', async () => {
      const file = new File(['not json'], 'test.json', { type: 'application/json' });
      const { result } = await engine.importJSON(file);

      expect(result.valid).toBe(false);
      expect(result!.errors[0]!.message).toContain('Invalid JSON');
    });
  });

  describe('validation', () => {
    it('should detect non-numeric values in numeric columns', async () => {
      const csv = 'Account,Amount\nRevenue,1000\nCOGS,not_a_number';
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      const { result } = await engine.importCSV(file, { numericColumns: ['Amount'] });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Non-numeric'))).toBe(true);
    });

    it('should warn about unrecognized date formats', async () => {
      const csv = 'Account,Date\nRevenue,2024-01-15\nCOGS,not-a-date';
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      const { result } = await engine.importCSV(file, { dateColumns: ['Date'] });

      expect(result.warnings.some((w) => w.message.includes('date format'))).toBe(true);
    });
  });

  describe('rollback', () => {
    it('should create and rollback snapshots', async () => {
      const csv = 'Account,Amount\nRevenue,1000';
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      const { snapshot } = await engine.importCSV(file);

      expect(snapshot).not.toBeNull();
      const snapshots = engine.getSnapshots();
      expect(snapshots).toHaveLength(1);

      engine.rollback(snapshot!.id);
      const rolled = engine.getSnapshots().find((s) => s.id === snapshot!.id);
      expect(rolled?.applied).toBe(false);
    });

    it('should clear snapshots', async () => {
      const csv = 'Account,Amount\nRevenue,1000';
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      await engine.importCSV(file);

      expect(engine.getSnapshots()).toHaveLength(1);
      engine.clearSnapshots();
      expect(engine.getSnapshots()).toHaveLength(0);
    });
  });

  describe('progress tracking', () => {
    it('should emit progress events during import', async () => {
      const progressEvents: { status: string; percent: number }[] = [];
      engine.onProgress((p) => progressEvents.push({ status: p.status, percent: p.percent }));

      const csv = 'Account,Amount\nRevenue,1000';
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      await engine.importCSV(file);

      expect(progressEvents.length).toBeGreaterThanOrEqual(3);
      expect(progressEvents![0]!.status).toBe('reading');
      expect(progressEvents![progressEvents.length - 1]!.status).toBe('complete');
    });
  });
});

describe('MigrationEngine', () => {
  let engine: MigrationEngine;

  beforeEach(() => {
    engine = new MigrationEngine();
  });

  describe('source detection', () => {
    it('should auto-detect Planful format', async () => {
      const file = await createXlsxFile(
        [
          ['Plan_ID', 'Model_ID', 'Entity', 'Account', 'Amount'],
          ['1', '100', 'Corp', 'Revenue', '1000'],
        ],
        'planful_export.xlsx'
      );

      const source = await engine.detectMigrationSource(file);
      expect(source).toBe('planful');
    });

    it('should auto-detect Adaptive format', async () => {
      const file = await createXlsxFile(
        [
          ['Level_Code', 'Level_Name', 'Account', 'Amount'],
          ['CORP', 'Corporate', 'Revenue', '1000'],
        ],
        'adaptive_export.xlsx'
      );

      const source = await engine.detectMigrationSource(file);
      expect(source).toBe('adaptive');
    });

    it('should auto-detect Anaplan format', async () => {
      const file = await createXlsxFile(
        [
          ['Module_Name', 'Line_Item', 'List_Name', 'Amount'],
          ['P&L', 'Revenue', 'Accounts', '1000'],
        ],
        'anaplan_export.xlsx'
      );

      const source = await engine.detectMigrationSource(file);
      expect(source).toBe('anaplan');
    });
  });

  describe('migration analysis', () => {
    it('should perform full migration analysis', async () => {
      const file = await createXlsxFile(
        [
          ['Account', 'Account_Name', 'Department', 'Amount', 'Date'],
          ['4000', 'Revenue', 'Sales', '50000', '2024-01-15'],
          ['5000', 'COGS', 'Operations', '20000', '2024-01-15'],
        ],
        'budget.xlsx',
        'Budget'
      );

      const { source, readiness, plan } = await engine.analyzeMigration(file);

      expect(readiness.score).toBeGreaterThan(0);
      expect(readiness.sheetCount).toBe(1);
      expect(readiness.totalRows).toBe(2);
      expect(readiness.detectedColumns.length).toBeGreaterThan(0);
      expect(plan.mappings.length).toBeGreaterThan(0);
    });
  });

  describe('migration execution', () => {
    it('should execute migration and create snapshot', async () => {
      const file = await createXlsxFile(
        [
          ['Account', 'Amount'],
          ['Revenue', '1000'],
          ['COGS', '500'],
        ],
        'test.xlsx'
      );

      const mappings = [
        {
          sourceColumn: 'Account',
          targetField: 'account',
          confidence: 1.0,
          matchType: 'exact' as const,
        },
        {
          sourceColumn: 'Amount',
          targetField: 'amount',
          confidence: 1.0,
          matchType: 'exact' as const,
        },
      ];

      const { result, snapshot } = await engine.executeMigration(file, mappings);

      expect(result.valid).toBe(true);
      expect(result.rowCount).toBe(2);
      expect(snapshot).not.toBeNull();
      expect(snapshot?.source).toBe('excel');
      expect(snapshot?.plan.mappings).toEqual(mappings);

      const snapshots = engine.getMigrationSnapshots();
      expect(snapshots).toHaveLength(1);
    });

    it('should rollback migration', async () => {
      const file = await createXlsxFile(
        [
          ['Account', 'Amount'],
          ['Revenue', '1000'],
        ],
        'test.xlsx'
      );

      const mappings = [
        {
          sourceColumn: 'Account',
          targetField: 'account',
          confidence: 1.0,
          matchType: 'exact' as const,
        },
      ];

      const { snapshot } = await engine.executeMigration(file, mappings);
      expect(snapshot).not.toBeNull();

      const rolled = engine.rollbackMigration(snapshot!.id);
      expect(rolled).not.toBeNull();
      expect(rolled!.applied).toBe(false);
    });
  });

  describe('progress tracking', () => {
    it('should emit progress events during migration', async () => {
      const progressEvents: { status: string; percent: number }[] = [];
      engine.onProgress((p) => progressEvents.push({ status: p.status, percent: p.percent }));

      const file = await createXlsxFile(
        [
          ['Account', 'Amount'],
          ['Revenue', '1000'],
        ],
        'test.xlsx'
      );

      const mappings = [
        {
          sourceColumn: 'Account',
          targetField: 'account',
          confidence: 1.0,
          matchType: 'exact' as const,
        },
      ];

      await engine.executeMigration(file, mappings);

      expect(progressEvents.length).toBeGreaterThanOrEqual(3);
      expect(progressEvents![0]!.status).toBe('reading');
      expect(progressEvents![progressEvents.length - 1]!.status).toBe('complete');
    });
  });
});
