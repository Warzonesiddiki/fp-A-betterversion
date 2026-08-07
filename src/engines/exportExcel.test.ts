import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExportConfig, ExportData } from './ExportEngine';

// Mock file-saver first
const mockSaveAs = vi.fn();
vi.mock('file-saver', () => ({
  saveAs: mockSaveAs,
}));

// Mock exceljs with a class-based approach
const mockAddRow = vi.fn().mockReturnValue({ font: {} });
const mockEachRow = vi.fn((callback: (row: any, rowNumber: number) => void) => {
  // Simulate iterating rows (row 1 is header, row 2 is data)
  const mockRow = {
    eachCell: vi.fn((cellCb: (cell: any, colNumber: number) => void) => {
      cellCb({ value: 'Revenue', numFmt: '' }, 1);
      cellCb({ value: 50000, numFmt: '' }, 2);
    }),
    getCell: vi.fn((colNumber: number) => ({
      value: colNumber === 2 ? 1500 : -500,
      font: {},
    })),
  };
  callback(mockRow, 2);
});
const mockWriteBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
const mockWorksheet: any = {
  addRow: mockAddRow,
  views: [],
  columns: [],
  eachRow: mockEachRow,
};

class MockWorkbook {
  addWorksheet = vi.fn().mockReturnValue(mockWorksheet);
  xlsx = { writeBuffer: mockWriteBuffer };
}

vi.mock('exceljs', () => ({
  default: { Workbook: MockWorkbook },
}));

// Import after mock setup
const {
  default: exportToExcel,
  exportToExcelWithConditionalFormatting,
  exportToExcelWithPassword,
  sanitizeExcelRow,
} = await import('./exportExcel');

describe('exportExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorksheet.views = [];
    mockWorksheet.columns = [];
  });

  describe('sanitizeExcelRow', () => {
    it('neutralizes leading equals and quotes without altering numbers and booleans', () => {
      const row = ['=SUM(A1:B2)', 100, true, null, undefined, 'normal text'];
      const sanitized = sanitizeExcelRow(row);
      expect(sanitized[0]).toBe("'=SUM(A1:B2)");
      expect(sanitized[1]).toBe(100);
      expect(sanitized[2]).toBe(true);
      expect(sanitized[3]).toBe('');
      expect(sanitized[4]).toBe('');
      expect(sanitized[5]).toBe('normal text');
    });
  });

  describe('exportToExcel', () => {
    it('should create a workbook and add headers', async () => {
      const data: ExportData = {
        headers: ['Name', 'Amount'],
        rows: [['Revenue', 100000]],
      };
      const config: ExportConfig = { title: 'Test Report' };

      await exportToExcel(data, config);

      expect(mockAddRow).toHaveBeenCalledWith(['Name', 'Amount']);
    });

    it('should add data rows', async () => {
      const data: ExportData = {
        headers: ['Name', 'Amount'],
        rows: [
          ['Revenue', 100000],
          ['Expenses', 50000],
        ],
      };
      const config: ExportConfig = { title: 'Test' };

      await exportToExcel(data, config);

      expect(mockAddRow).toHaveBeenCalledTimes(3); // 1 header + 2 data
      expect(mockAddRow).toHaveBeenCalledWith(['Revenue', 100000]);
      expect(mockAddRow).toHaveBeenCalledWith(['Expenses', 50000]);
    });

    it('should set frozen header row', async () => {
      const data: ExportData = { headers: ['A'], rows: [['B']] };
      const config: ExportConfig = { title: 'Test' };

      await exportToExcel(data, config);

      expect(mockWorksheet.views).toEqual([{ state: 'frozen', xSplit: 0, ySplit: 1 }]);
    });

    it('should set column widths based on content', async () => {
      const data: ExportData = {
        headers: ['Name', 'Amount'],
        rows: [['Revenue', 100000]],
      };
      const config: ExportConfig = { title: 'Test' };

      await exportToExcel(data, config);

      expect(mockWorksheet.columns).toHaveLength(2);
      expect(mockWorksheet.columns[0]!.header).toBe('Name');
      expect(mockWorksheet.columns[0]!.key).toBe('Name');
      expect(mockWorksheet.columns[0]!.width).toBeGreaterThan(0);
    });

    it('should call saveAs with correct filename', async () => {
      const data: ExportData = { headers: ['A'], rows: [['B']] };
      const config: ExportConfig = { title: 'Profit & Loss Report' };

      await exportToExcel(data, config);

      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'Profit_&_Loss_Report.xlsx');
    });

    it('should use default filename when title is missing', async () => {
      mockSaveAs.mockClear();
      const data: ExportData = { headers: ['A'], rows: [['B']] };
      const config = {} as ExportConfig;

      await exportToExcel(data, config);

      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'export.xlsx');
    });

    it('should handle null/undefined values in rows', async () => {
      const data: ExportData = {
        headers: ['Name', 'Value'],
        rows: [
          ['Test', null],
          ['Test2', null],
        ],
      };
      const config: ExportConfig = { title: 'Test' };

      await exportToExcel(data, config);

      expect(mockAddRow).toHaveBeenCalled();
      expect(mockAddRow.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should write buffer and create blob', async () => {
      const data: ExportData = { headers: ['A'], rows: [['B']] };
      const config: ExportConfig = { title: 'Test' };

      await exportToExcel(data, config);

      expect(mockWriteBuffer).toHaveBeenCalled();
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), expect.stringContaining('.xlsx'));
    });

    it('should handle empty rows', async () => {
      const data: ExportData = { headers: ['A', 'B'], rows: [] };
      const config: ExportConfig = { title: 'Empty' };

      await exportToExcel(data, config);

      expect(mockAddRow).toHaveBeenCalledTimes(1); // only header
      expect(mockSaveAs).toHaveBeenCalled();
    });

    it('should apply currency format to numeric cells', async () => {
      const data: ExportData = {
        headers: ['Account', 'Amount'],
        rows: [['Revenue', 500000]],
      };
      const config: ExportConfig = { title: 'Test' };

      await exportToExcel(data, config);

      expect(mockEachRow).toHaveBeenCalled();
    });
  });

  describe('exportToExcelWithConditionalFormatting', () => {
    it('applies positive_good, negative_good, and threshold conditional formatting rules', async () => {
      const data: ExportData = {
        headers: ['Line', 'Variance', 'Growth'],
        rows: [
          ['Sales', 1500, 0.12],
          ['Costs', -500, -0.04],
        ],
      };
      const config: ExportConfig = { title: 'Variance Analysis' };
      const rules = [
        { column: 2, type: 'positive_good' as const, goodColor: 'FF00FF00', badColor: 'FFFF0000' },
        { column: 2, type: 'negative_good' as const },
        { column: 2, type: 'threshold' as const, threshold: 1000 },
      ];

      await exportToExcelWithConditionalFormatting(data, config, rules);

      expect(mockAddRow).toHaveBeenCalled();
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'Variance_Analysis.xlsx');
    });
  });

  describe('exportToExcelWithPassword', () => {
    it('exports excel with and without password config', async () => {
      const data: ExportData = {
        headers: ['Account', 'Balance'],
        rows: [['Checking', 10000]],
      };

      await exportToExcelWithPassword(data, { title: 'Protected', password: 'secret-pass' });
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'Protected.xlsx');

      await exportToExcelWithPassword(data, { title: 'Unprotected' });
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'Unprotected.xlsx');
    });
  });
});
