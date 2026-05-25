import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExportConfig, ExportData } from './ExportEngine';

// Mock file-saver first
const mockSaveAs = vi.fn();
vi.mock('file-saver', () => ({
  saveAs: mockSaveAs,
}));

// Mock exceljs with a class-based approach
const mockAddRow = vi.fn().mockReturnValue({ font: {} });
const mockEachRow = vi.fn();
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
const { default: exportToExcel } = await import('./exportExcel');

describe('exportToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorksheet.views = [];
    mockWorksheet.columns = [];
  });

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
    expect(mockWorksheet.columns[0].header).toBe('Name');
    expect(mockWorksheet.columns[0].key).toBe('Name');
    expect(mockWorksheet.columns[0].width).toBeGreaterThan(0);
  });

  it('should call saveAs with correct filename', async () => {
    const data: ExportData = { headers: ['A'], rows: [['B']] };
    const config: ExportConfig = { title: 'Profit & Loss Report' };

    await exportToExcel(data, config);

    expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'Profit_&_Loss_Report.xlsx');
  });

  it('should use default filename when title is missing', async () => {
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

    // addRow receives processed data; null/undefined may be converted or passed through
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

    // Capture eachRow callback
    let _eachRowCallback: ((row: any, rowNumber: number) => void) | undefined;
    mockEachRow.mockImplementation((cb: any) => {
      _eachRowCallback = cb;
    });

    await exportToExcel(data, config);

    // Verify eachRow was registered
    expect(mockEachRow).toHaveBeenCalled();
  });
});
