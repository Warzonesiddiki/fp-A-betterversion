import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportPipeline } from './ImportPipeline';

const mockGLUploadStore = {
  setFile: vi.fn(),
  setMappings: vi.fn(),
  setPreview: vi.fn(),
  setProgress: vi.fn(),
  setAutoMapping: vi.fn(),
  completeSession: vi.fn(),
  reset: vi.fn(),
};

const mockGLStore = {
  addEntry: vi.fn(),
  recordImport: vi.fn(),
};

vi.mock('@/store/glUploadStore', () => ({
  useGLUploadStore: { getState: () => mockGLUploadStore },
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: { getState: () => mockGLStore },
}));

const mockOnProgress = vi.fn(() => vi.fn());
const mockParseFile = vi.fn();
const mockAutoDetectMappings = vi.fn();
const mockValidateData = vi.fn();
const mockConfirmImport = vi.fn();
const mockDetectFormat = vi.fn();
const mockDestroy = vi.fn();

function MockGLImportService() {
  this.onProgress = mockOnProgress;
  this.parseFile = mockParseFile;
  this.autoDetectMappings = mockAutoDetectMappings;
  this.validateData = mockValidateData;
  this.confirmImport = mockConfirmImport;
  this.detectFormat = mockDetectFormat;
  this.destroy = mockDestroy;
}

vi.mock('./GLImportService', () => ({
  GLImportService: MockGLImportService,
}));

describe('ImportPipeline', () => {
  let pipeline: ImportPipeline;

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new ImportPipeline();
  });

  it('emits events through the pipeline', () => {
    const listener = vi.fn();
    const unsubscribe = pipeline.onEvent(listener);

    (pipeline as any).emit('detect', 5, 'Starting');
    expect(listener).toHaveBeenCalledWith({ stage: 'detect', percent: 5, message: 'Starting' });

    unsubscribe();
    (pipeline as any).emit('complete', 100, 'Done');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('throws on parse failure', async () => {
    mockParseFile.mockRejectedValue(new Error('Parse error'));
    const file = new File([''], 'test.csv', { type: 'text/csv' });

    await expect(pipeline.run(file)).rejects.toThrow('Parse error');
  });

  it('runs full pipeline successfully', async () => {
    const mockParsed = {
      fileName: 'test.csv',
      format: 'csv',
      headers: ['Account', 'Date', 'Debit', 'Credit'],
      rowCount: 10,
      columnCount: 4,
      previewRows: [{ Account: '1000', Date: '2024-01-01', Debit: 100, Credit: 0 }],
      allRows: [
        { Account: '1000', Date: '2024-01-01', Debit: 100, Credit: 0 },
        { Account: '2000', Date: '2024-01-02', Debit: 0, Credit: 100 },
      ],
    };

    const mockMapping = {
      autoMappings: [
        { sourceColumn: 'Account', targetField: 'accountCode', confidence: 0.95, reason: '' },
        { sourceColumn: 'Date', targetField: 'date', confidence: 0.9, reason: '' },
        { sourceColumn: 'Debit', targetField: 'debit', confidence: 0.9, reason: '' },
        { sourceColumn: 'Credit', targetField: 'credit', confidence: 0.9, reason: '' },
      ],
      userMappings: { Account: 'accountCode', Date: 'date', Debit: 'debit', Credit: 'credit' },
      unmappedRequiredFields: [],
      confidence: 0.91,
    };

    const mockValidation = {
      valid: true,
      rowCount: 2,
      errorCount: 0,
      warningCount: 0,
      errors: [],
      warnings: [],
      validRows: [
        { accountCode: '1000', date: '2024-01-01', debit: 100, credit: 0 },
        { accountCode: '2000', date: '2024-01-02', debit: 0, credit: 100 },
      ],
    };

    const mockSummary = {
      fileName: 'test.csv',
      format: 'csv',
      totalRows: 2,
      importedRows: 2,
      skippedRows: 0,
      errorCount: 0,
      warningCount: 0,
      duration: 50,
    };

    mockParseFile.mockResolvedValue(mockParsed);
    mockAutoDetectMappings.mockReturnValue(mockMapping);
    mockValidateData.mockReturnValue(mockValidation);
    mockConfirmImport.mockResolvedValue(mockSummary);

    const file = new File(['a,b,c\n1,2,3'], 'test.csv', { type: 'text/csv' });
    const result = await pipeline.run(file, { requiredColumns: ['accountCode'] });

    expect(result.summary.importedRows).toBe(2);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]?.accountCode).toBe('1000');
    expect(result.entries[1]?.accountCode).toBe('2000');
  });

  it('handles partial import with errors', async () => {
    const mockParsed = {
      fileName: 'partial.csv',
      format: 'csv',
      headers: ['Account', 'Debit', 'Credit'],
      rowCount: 3,
      columnCount: 3,
      previewRows: [],
      allRows: [
        { Account: '1000', Debit: 100, Credit: 0 },
        { Account: '', Debit: 0, Credit: 50 },
        { Account: '2000', Debit: 0, Credit: 200 },
      ],
    };

    const mockMapping = {
      autoMappings: [
        { sourceColumn: 'Account', targetField: 'accountCode', confidence: 0.95, reason: '' },
      ],
      userMappings: { Account: 'accountCode' },
      unmappedRequiredFields: [],
      confidence: 0.95,
    };

    const mockValidation = {
      valid: false,
      rowCount: 3,
      errorCount: 1,
      warningCount: 0,
      errors: [
        {
          row: 3,
          column: 'accountCode',
          message: 'Missing required field: accountCode',
          value: '',
        },
      ],
      warnings: [],
      validRows: [
        { accountCode: '1000', debit: 100, credit: 0 },
        { accountCode: '2000', debit: 0, credit: 200 },
      ],
    };

    const mockSummary = {
      fileName: 'partial.csv',
      format: 'csv',
      totalRows: 3,
      importedRows: 2,
      skippedRows: 1,
      errorCount: 1,
      warningCount: 0,
      duration: 30,
    };

    mockParseFile.mockResolvedValue(mockParsed);
    mockAutoDetectMappings.mockReturnValue(mockMapping);
    mockValidateData.mockReturnValue(mockValidation);
    mockConfirmImport.mockResolvedValue(mockSummary);

    const file = new File(['a,b,c\n1,2,3'], 'partial.csv', { type: 'text/csv' });
    const result = await pipeline.run(file);

    expect(result.summary.importedRows).toBe(2);
    expect(result.summary.skippedRows).toBe(1);
    expect(result.entries).toHaveLength(2);
  });

  it('destroy cleans up service', () => {
    pipeline.destroy();
    expect(mockDestroy).toHaveBeenCalled();
  });
});
