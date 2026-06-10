/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnVisibility } from './useColumnVisibility';
import type { ColDef } from 'ag-grid-community';

const columns: ColDef[] = [
  { field: 'name' },
  { field: 'revenue' },
  { field: 'cost' },
  { field: 'profit' },
];

describe('useColumnVisibility', () => {
  it('should initialize with all columns visible', () => {
    const { result } = renderHook(() => useColumnVisibility(columns));
    expect(result.current.hiddenColumns.size).toBe(0);
    expect(result.current.visibleColumnDefs).toHaveLength(4);
  });

  it('should toggle column hidden/visible', () => {
    const { result } = renderHook(() => useColumnVisibility(columns));

    act(() => {
      result.current.toggleColumn('revenue');
    });
    expect(result.current.hiddenColumns.has('revenue')).toBe(true);
    expect(result.current.visibleColumnDefs).toHaveLength(3);
    expect(result.current.visibleColumnDefs.find((c) => c.field === 'revenue')).toBeUndefined();

    act(() => {
      result.current.toggleColumn('revenue');
    });
    expect(result.current.hiddenColumns.has('revenue')).toBe(false);
    expect(result.current.visibleColumnDefs).toHaveLength(4);
  });

  it('should hide multiple columns independently', () => {
    const { result } = renderHook(() => useColumnVisibility(columns));

    act(() => {
      result.current.toggleColumn('name');
    });
    act(() => {
      result.current.toggleColumn('cost');
    });

    expect(result.current.hiddenColumns.size).toBe(2);
    expect(result.current.visibleColumnDefs).toHaveLength(2);
    expect(result.current.visibleColumnDefs.map((c) => c.field)).toEqual(['revenue', 'profit']);
  });

  it('should handle groupBy', () => {
    const { result } = renderHook(() => useColumnVisibility(columns));

    act(() => {
      result.current.handleGroupBy('name');
    });
    expect(result.current.groupColumn).toBe('name');

    // groupColumn field is prepended with rowGroup:true and hidden
    const grouped = result.current.visibleColumnDefs.find((c) => c.field === 'name');
    expect(grouped?.rowGroup).toBe(true);
    expect(grouped?.hide).toBe(true);

    // original name column is filtered out of visible defs
    const visibleFields = result.current.visibleColumnDefs
      .filter((c) => !c.rowGroup)
      .map((c) => c.field);
    expect(visibleFields).not.toContain('name');
    expect(visibleFields).toEqual(['revenue', 'cost', 'profit']);
  });

  it('should clear groupBy with null', () => {
    const { result } = renderHook(() => useColumnVisibility(columns));

    act(() => {
      result.current.handleGroupBy('name');
    });
    act(() => {
      result.current.handleGroupBy(null);
    });

    expect(result.current.groupColumn).toBe(null);
    expect(result.current.visibleColumnDefs).toHaveLength(4);
  });

  it('should combine hidden columns with groupBy', () => {
    const { result } = renderHook(() => useColumnVisibility(columns));

    act(() => {
      result.current.toggleColumn('cost');
    });
    act(() => {
      result.current.handleGroupBy('name');
    });

    // name is rowGroup, cost is hidden, so revenue + profit remain
    const visibleFields = result.current.visibleColumnDefs
      .filter((c) => !c.rowGroup)
      .map((c) => c.field);
    expect(visibleFields).toEqual(['revenue', 'profit']);
  });

  it('should toggle showColumnMenu', () => {
    const { result } = renderHook(() => useColumnVisibility(columns));
    expect(result.current.showColumnMenu).toBe(false);

    act(() => {
      result.current.setShowColumnMenu(true);
    });
    expect(result.current.showColumnMenu).toBe(true);
  });

  it('should handle columns with no field', () => {
    const cols: ColDef[] = [{ field: undefined }, { field: 'a' }];
    const { result } = renderHook(() => useColumnVisibility(cols));

    act(() => {
      result.current.toggleColumn('');
    });
    // empty string field should be in hidden set
    expect(result.current.hiddenColumns.has('')).toBe(true);
  });
});
