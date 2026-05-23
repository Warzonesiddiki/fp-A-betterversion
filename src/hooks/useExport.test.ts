/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExport } from './useExport';
import { ExportEngine } from '@/engines/ExportEngine';
import type { ExportData } from '@/engines/ExportEngine';

// Mock the engine
vi.mock('@/engines/ExportEngine');

const mockExportEngine = vi.mocked(ExportEngine);

const mockExportData: ExportData = {
  columns: [{ key: 'col1', name: 'Column 1' }],
  rows: [{ col1: 'value1' }],
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
    mockExportEngine.exportToPDF.mockResolvedValue(undefined);

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
    mockExportEngine.exportToPDF.mockRejectedValue(new Error('PDF Fail'));

    await act(async () => {
      await result.current.exportToPDF(mockExportData, 'Test PDF');
    });

    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBe('Export failed');
  });

  it('should not call PDF export if data is empty', async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportToPDF({ columns: [], rows: [] }, 'Test PDF');
    });

    expect(mockExportEngine.exportToPDF).not.toHaveBeenCalled();
    expect(result.current.error).toBe('No data to export');
  });

  // --- exportToExcel ---

  it('should call ExportEngine.exportToExcel and manage final state', async () => {
    const { result } = renderHook(() => useExport());
    mockExportEngine.exportToExcel.mockResolvedValue(undefined);

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
    mockExportEngine.exportToExcel.mockRejectedValue(new Error('Excel Fail'));

    await act(async () => {
      await result.current.exportToExcel(mockExportData, 'Test Excel');
    });

    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBe('Export failed');
  });

  // --- exportToCSV ---

  it('should call ExportEngine.exportToCSV and manage final state', async () => {
    const { result } = renderHook(() => useExport());
    mockExportEngine.exportToCSV.mockResolvedValue(undefined);

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
    mockExportEngine.exportToCSV.mockRejectedValue(new Error('CSV Fail'));

    await act(async () => {
      await result.current.exportToCSV(mockExportData, 'Test CSV');
    });

    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBe('Export failed');
  });
});
