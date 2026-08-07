import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GLImportService } from './GLImportService';

const mockImportCSV = vi.fn();

vi.mock('@/engines/ImportEngine', () => {
  function MockImportEngine() {
    this.importCSV = mockImportCSV;
    this.onProgress = vi.fn(() => vi.fn());
    this.getProgress = () => ({ status: 'idle', percent: 0, message: '' });
  }
  return { ImportEngine: MockImportEngine };
});

const mockParseFile = vi.fn();
const mockAutoDetect = vi.fn();
const mockGetPreview = vi.fn();

vi.mock('@/engines/ExcelImportEngine', () => {
  function MockExcelImportEngine() {
    this.parseFile = mockParseFile;
    this.autoDetectMappings = mockAutoDetect;
    this.getPreview = mockGetPreview;
  }
  return { ExcelImportEngine: MockExcelImportEngine };
});

describe('GLImportService', () => {
  let service: GLImportService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GLImportService();
  });

  describe('detectFormat', () => {
    it('detects CSV format', () => {
      const file = new File([''], 'data.csv', { type: 'text/csv' });
      const result = service.detectFormat(file);
      expect(result.format).toBe('csv');
      expect(result.supported).toBe(true);
    });

    it('detects Excel format', () => {
      const file = new File([''], 'data.xlsx');
      const result = service.detectFormat(file);
      expect(result.format).toBe('xlsx');
      expect(result.supported).toBe(true);
    });

    it('detects xls format', () => {
      const file = new File([''], 'data.xls');
      const result = service.detectFormat(file);
      expect(result.format).toBe('xls');
      expect(result.supported).toBe(true);
    });

    it('rejects unsupported format', () => {
      const file = new File([''], 'data.pdf');
      const result = service.detectFormat(file);
      expect(result.format).toBe('pdf');
      expect(result.supported).toBe(false);
    });
  });

  describe('parseFile', () => {
    it('throws for unsupported format', async () => {
      const file = new File([''], 'data.pdf');
      await expect(service.parseFile(file)).rejects.toThrow('Unsupported file format');
    });

    it('parses CSV and returns result', async () => {
      const mockResult = {
        valid: true,
        errors: [],
        warnings: [],
        rowCount: 100,
        columnCount: 6,
        columns: ['Account', 'Date', 'Debit', 'Credit', 'Entity', 'Description'],
        preview: [{ Account: '1000', Date: '2024-01-01', Debit: '100', Credit: '0' }],
      };
      mockImportCSV.mockResolvedValue({
        result: mockResult,
        snapshot: { id: 'snap-1', applied: false },
      });

      const file = new File(['a,b,c\n1,2,3'], 'data.csv', { type: 'text/csv' });
      const result = await service.parseFile(file);

      expect(result.fileName).toBe('data.csv');
      expect(result.format).toBe('csv');
      expect(result.rowCount).toBe(100);
      expect(result.headers).toEqual([
        'Account',
        'Date',
        'Debit',
        'Credit',
        'Entity',
        'Description',
      ]);
      expect(mockImportCSV).toHaveBeenCalledTimes(1);
    });
  });

  describe('autoDetectMappings', () => {
    it('returns mapping result from headers', () => {
      mockAutoDetect.mockReturnValue([
        {
          sourceColumn: 'Account',
          targetField: 'accountCode',
          confidence: 0.95,
          reason: 'Keyword match',
        },
        { sourceColumn: 'Date', targetField: 'date', confidence: 0.9, reason: 'Keyword match' },
      ]);

      const result = service.autoDetectMappings(['Account', 'Date'], []);
      expect(result.autoMappings).toHaveLength(2);
      expect(result.userMappings).toEqual({ Account: 'accountCode', Date: 'date' });
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('identifies unmapped required fields with low confidence', () => {
      mockAutoDetect.mockReturnValue([
        { sourceColumn: 'MysteryCol', targetField: 'skip', confidence: 0.2, reason: 'Weak match' },
      ]);

      const result = service.autoDetectMappings(['MysteryCol'], []);
      expect(result.unmappedRequiredFields).toContain('MysteryCol');
    });
  });

  describe('validateData', () => {
    const rows = [
      { Account: '1000', Date: '2024-01-01', Debit: '100', Credit: '0' },
      { Account: '', Date: '2024-01-02', Debit: '0', Credit: '50' },
    ];
    const mappings = { Account: 'accountCode', Date: 'date', Debit: 'debit', Credit: 'credit' };

    it('passes valid data', () => {
      const result = service.validateData([rows[0]], mappings);
      expect(result.valid).toBe(true);
      expect(result.errorCount).toBe(0);
      expect(result.validRows).toHaveLength(1);
    });

    it('rejects missing account code', () => {
      const result = service.validateData(rows, mappings);
      expect(result.valid).toBe(false);
      expect(result.errorCount).toBe(1);
      expect(result.validRows).toHaveLength(1);
    });

    it('warns about unknown accounts when validation on', () => {
      const result = service.validateData([rows[0]], mappings, {
        validateAccounts: true,
        accountCodes: ['2000'],
      });
      expect(result.warningCount).toBe(1);
      expect(result.warnings[0]?.message).toContain('not found');
    });
  });

  describe('confirmImport', () => {
    it('returns import summary', async () => {
      const result = await service.confirmImport('test.csv', 'csv', [], 100, 2, 1);
      expect(result.fileName).toBe('test.csv');
      expect(result.totalRows).toBe(100);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('progress events', () => {
    it('emits progress events to listeners', () => {
      const listener = vi.fn();
      const unsubscribe = service.onProgress(listener);

      (service as any).emitProgress('parse', 30, 'Parsing...');
      expect(listener).toHaveBeenCalledWith({ stage: 'parse', percent: 30, message: 'Parsing...' });

      unsubscribe();
      (service as any).emitProgress('import', 90, 'Importing...');
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('cleans up listeners', () => {
      const listener = vi.fn();
      service.onProgress(listener);
      service.destroy();
      (service as any).emitProgress('complete', 100, 'Done');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
