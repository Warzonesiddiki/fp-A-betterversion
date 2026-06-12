/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelectionStats } from './useSelectionStats';
import type { DataGridColumn } from '@/components/ui/DataGrid';

const columns: DataGridColumn[] = [
  { field: 'name', headerName: 'Name', type: 'text' },
  { field: 'revenue', headerName: 'Revenue', type: 'currency' },
  { field: 'cost', headerName: 'Cost', type: 'number' },
  { field: 'margin', headerName: 'Margin', type: 'percent' },
];

function createMockGridRef(selectedRows: Record<string, unknown>[]) {
  return {
    current: {
      api: {
        getSelectedRows: vi.fn(() => selectedRows),
      },
    },
  };
}

describe('useSelectionStats', () => {
  it('should return null stats when no grid ref', () => {
    const nullGrid = { current: null };
    const { result } = renderHook(() => useSelectionStats(nullGrid as any, columns));

    act(() => {
      result.current.updateSelectionStats();
    });

    expect(result.current.selectionStats).toBeNull();
  });

  it('should return null stats when no rows selected', () => {
    const grid = createMockGridRef([]);
    const { result } = renderHook(() => useSelectionStats(grid as any, columns));

    act(() => {
      result.current.updateSelectionStats();
    });

    expect(result.current.selectionStats).toBeNull();
  });

  it('should calculate stats for numeric columns', () => {
    const grid = createMockGridRef([
      { name: 'A', revenue: 100, cost: 50, margin: 0.5 },
      { name: 'B', revenue: 200, cost: 80, margin: 0.5 },
    ]);

    const { result } = renderHook(() => useSelectionStats(grid as any, columns));

    act(() => {
      result.current.updateSelectionStats();
    });

    // numeric values: 100, 50, 0.5, 200, 80, 0.5 = 431
    expect(result.current.selectionStats).toEqual({
      sum: 431,
      avg: 431 / 6,
      count: 6,
      min: 0.5,
      max: 200,
    });
  });

  it('should return null when no numeric values in selection', () => {
    const grid = createMockGridRef([{ name: 'A', revenue: null, cost: undefined }]);

    const { result } = renderHook(() => useSelectionStats(grid as any, columns));

    act(() => {
      result.current.updateSelectionStats();
    });

    expect(result.current.selectionStats).toBeNull();
  });

  it('should filter out NaN and Infinity values', () => {
    const grid = createMockGridRef([{ name: 'A', revenue: 100, cost: NaN, margin: Infinity }]);

    const { result } = renderHook(() => useSelectionStats(grid as any, columns));

    act(() => {
      result.current.updateSelectionStats();
    });

    // Only revenue=100 is finite
    expect(result.current.selectionStats).toEqual({
      sum: 100,
      avg: 100,
      count: 1,
      min: 100,
      max: 100,
    });
  });

  it('should handle single row selection', () => {
    const grid = createMockGridRef([{ name: 'A', revenue: 42, cost: 21, margin: 0.5 }]);

    const { result } = renderHook(() => useSelectionStats(grid as any, columns));

    act(() => {
      result.current.updateSelectionStats();
    });

    expect(result.current.selectionStats?.count).toBe(3);
    expect(result.current.selectionStats?.min).toBe(0.5);
    expect(result.current.selectionStats?.max).toBe(42);
  });

  it('should handle mixed selected and unselected columns', () => {
    const grid = createMockGridRef([
      { name: 'A', revenue: 100 },
      { name: 'B', revenue: 200 },
    ]);

    const { result } = renderHook(() => useSelectionStats(grid as any, columns));

    act(() => {
      result.current.updateSelectionStats();
    });

    // Only revenue is numeric type
    expect(result.current.selectionStats?.count).toBe(2);
    expect(result.current.selectionStats?.sum).toBe(300);
  });

  it('should return null for zero-value numeric entries (all zeros)', () => {
    const grid = createMockGridRef([{ revenue: 0, cost: 0, margin: 0 }]);

    const { result } = renderHook(() => useSelectionStats(grid as any, columns));

    act(() => {
      result.current.updateSelectionStats();
    });

    // 0 is finite, so stats should exist
    expect(result.current.selectionStats).not.toBeNull();
    expect(result.current.selectionStats?.sum).toBe(0);
  });
});
