/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataGridExport } from './useDataGridExport';
import type { DataGridColumn } from '@/components/ui/DataGrid';

const columns: DataGridColumn[] = [
  { field: 'name', headerName: 'Name', type: 'text' },
  { field: 'revenue', headerName: 'Revenue', type: 'currency' },
  { field: 'cost', headerName: 'Cost', type: 'currency' },
];

const rows: Record<string, unknown>[] = [
  { name: 'Acme Corp', revenue: 100000, cost: 80000 },
  { name: 'Globex', revenue: 200000, cost: 150000 },
];

const OrigBlob = global.Blob;

describe('useDataGridExport', () => {
  let capturedCsv = '';

  beforeEach(() => {
    capturedCsv = '';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  it('should return handleExport function', () => {
    const { result } = renderHook(() => useDataGridExport(columns, rows, new Set()));
    expect(typeof result.current.handleExport).toBe('function');
  });

  it('should produce CSV from visible columns only', () => {
    const { result } = renderHook(() => useDataGridExport(columns, rows, new Set(['cost'])));

    class MockBlob {
      constructor(parts: BlobPart[], _options?: BlobPropertyBag) {
        capturedCsv = parts.join('');
      }
    }
    (global as any).Blob = MockBlob;

    act(() => {
      result.current.handleExport();
    });

    (global as any).Blob = OrigBlob;

    const lines = capturedCsv.split('\n');
    expect(lines[0]!).toBe('Name,Revenue');
    expect(lines.length).toBe(3);
  });

  it('should handle empty rows', () => {
    const { result } = renderHook(() => useDataGridExport(columns, [], new Set()));

    class MockBlob {
      constructor(parts: BlobPart[], _options?: BlobPropertyBag) {
        capturedCsv = parts.join('');
      }
    }
    (global as any).Blob = MockBlob;

    act(() => {
      result.current.handleExport();
    });

    (global as any).Blob = OrigBlob;
    expect(capturedCsv).toBe('Name,Revenue,Cost');
  });

  it('should wrap comma-containing values in quotes', () => {
    const csvRows: Record<string, unknown>[] = [
      { name: 'Acme, Inc', revenue: 100000, cost: 80000 },
    ];
    const { result } = renderHook(() => useDataGridExport(columns, csvRows, new Set()));

    class MockBlob {
      constructor(parts: BlobPart[], _options?: BlobPropertyBag) {
        capturedCsv = parts.join('');
      }
    }
    (global as any).Blob = MockBlob;

    act(() => {
      result.current.handleExport();
    });

    (global as any).Blob = OrigBlob;
    expect(capturedCsv).toContain('"Acme, Inc"');
  });

  it('should handle null/undefined values gracefully', () => {
    const sparseRows: Record<string, unknown>[] = [{ name: null, revenue: undefined, cost: 0 }];
    const { result } = renderHook(() => useDataGridExport(columns, sparseRows, new Set()));

    class MockBlob {
      constructor(parts: BlobPart[], _options?: BlobPropertyBag) {
        capturedCsv = parts.join('');
      }
    }
    (global as any).Blob = MockBlob;

    act(() => {
      result.current.handleExport();
    });

    (global as any).Blob = OrigBlob;

    const lines = capturedCsv.split('\n');
    expect(lines[1]!).toBe(',,0');
  });
});
