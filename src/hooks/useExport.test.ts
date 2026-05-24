/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from './useExport';
import { ExportEngine } from '@/engines/ExportEngine';
import type { ExportData } from '@/engines/ExportEngine';

vi.mock('@/engines/ExportEngine');

const mockExportEngine = vi.mocked(ExportEngine);

const mockExportData: ExportData = {
  headers: ['col1', 'col2'],
  rows: [
    ['value1', 100],
    ['value2', 200],
  ],
};

describe('useExport', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useExport());
    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // --- exportToPDF ---

  it('should call ExportEngine.exportToPDF and manage final state', async () => {
    const { result } = renderHook(() => useExport());
    mockExportEngine.exportToPDF.mockReturnValue(undefined);

    await act(async () => {
      await result.current.exportToPDF(mockExportData, 'Test PDF');
    });

    expect(mockExportEngine.exportToPDF).toHaveBeenCalledWith(mockExportData, {
      title: 'Test PDF',
    });
    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set an error if PDF export fails', async () => {
    const { result } = renderHook(() => useExport());
    mockExportEngine.exportToPDF.mockImplementation(() => {
      throw new Error('PDF Fail');
    });

    await act(async () => {
      await result.current.exportToPDF(mockExportData, 'Test PDF');
    });

    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBe('Export failed');
  });

  it('should not call PDF export if data is empty', async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportToPDF({ headers: [], rows: [] }, 'Test PDF');
    });

    expect(mockExportEngine.exportToPDF).not.toHaveBeenCalled();
    expect(result.current.error).toBe('No data to export');
  });

  // --- exportToExcel ---

  it('should call ExportEngine.exportToExcel and manage final state', async () => {
    const { result } = renderHook(() => useExport());
    mockExportEngine.exportToExcel.mockReturnValue(undefined);

    await act(async () => {
      await result.current.exportToExcel(mockExportData, 'Test Excel');
    });

    expect(mockExportEngine.exportToExcel).toHaveBeenCalledWith(mockExportData, {
      title: 'Test Excel',
    });
    expect(result.current.isExporting).toBe(false);
  });

  it('should set an error if Excel export fails', async () => {
    const { result } = renderHook(() => useExport());
    mockExportEngine.exportToExcel.mockImplementation(() => {
      throw new Error('Excel Fail');
    });

    await act(async () => {
      await result.current.exportToExcel(mockExportData, 'Test Excel');
    });

    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBe('Export failed');
  });

  // --- exportToCSV ---

  it('should call ExportEngine.exportToCSV and manage final state', async () => {
    const { result } = renderHook(() => useExport());
    mockExportEngine.exportToCSV.mockReturnValue(undefined);

    await act(async () => {
      await result.current.exportToCSV(mockExportData, 'Test CSV');
    });

    expect(mockExportEngine.exportToCSV).toHaveBeenCalledWith(mockExportData, {
      title: 'Test CSV',
    });
    expect(result.current.isExporting).toBe(false);
  });

  it('should set an error if CSV export fails', async () => {
    const { result } = renderHook(() => useExport());
    mockExportEngine.exportToCSV.mockImplementation(() => {
      throw new Error('CSV Fail');
    });

    await act(async () => {
      await result.current.exportToCSV(mockExportData, 'Test CSV');
    });

    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBe('Export failed');
  });
});
