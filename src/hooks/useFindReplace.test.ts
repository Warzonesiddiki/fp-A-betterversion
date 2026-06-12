/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFindReplace } from './useFindReplace';
import type { DataGridColumn } from '@/components/ui/DataGrid';

const columns: DataGridColumn[] = [
  { field: 'name', headerName: 'Name', type: 'text' },
  { field: 'status', headerName: 'Status', type: 'text' },
];

function createMockGridRef(
  initialNodes?: { data: Record<string, unknown>; setDataValue: ReturnType<typeof vi.fn> }[]
) {
  const nodes: { data: Record<string, unknown>; setDataValue: ReturnType<typeof vi.fn> }[] =
    initialNodes ?? [];
  const forEachNode = vi.fn(
    (
      cb: (node: { data: Record<string, unknown>; setDataValue: ReturnType<typeof vi.fn> }) => void
    ) => {
      for (const node of nodes) {
        cb(node);
      }
    }
  );
  const gridRef = {
    current: {
      api: {
        setGridOption: vi.fn(),
        forEachNode,
      },
    },
    nodes,
  };
  return gridRef;
}

describe('useFindReplace', () => {
  let mockGrid: ReturnType<typeof createMockGridRef>;

  beforeEach(() => {
    mockGrid = createMockGridRef();
  });

  it('should initialize with find/replace closed', () => {
    const { result } = renderHook(() => useFindReplace(mockGrid as any, columns));
    expect(result.current.showFindReplace).toBe(false);
    expect(result.current.findText).toBe('');
    expect(result.current.replaceText).toBe('');
  });

  it('should toggle find/replace panel', () => {
    const { result } = renderHook(() => useFindReplace(mockGrid as any, columns));

    act(() => {
      result.current.setShowFindReplace(true);
    });
    expect(result.current.showFindReplace).toBe(true);

    act(() => {
      result.current.setShowFindReplace(false);
    });
    expect(result.current.showFindReplace).toBe(false);
  });

  it('should set find and replace text', () => {
    const { result } = renderHook(() => useFindReplace(mockGrid as any, columns));

    act(() => {
      result.current.setFindText('hello');
    });
    act(() => {
      result.current.setReplaceText('world');
    });

    expect(result.current.findText).toBe('hello');
    expect(result.current.replaceText).toBe('world');
  });

  it('should call setGridOption on find', () => {
    const { result } = renderHook(() => useFindReplace(mockGrid as any, columns));

    act(() => {
      result.current.setFindText('test');
    });
    act(() => {
      result.current.handleFind();
    });

    expect(mockGrid.current.api.setGridOption).toHaveBeenCalledWith('quickFilterText', 'test');
  });

  it('should not find if findText is empty', () => {
    const { result } = renderHook(() => useFindReplace(mockGrid as any, columns));

    act(() => {
      result.current.handleFind();
    });

    expect(mockGrid.current.api.setGridOption).not.toHaveBeenCalled();
  });

  it('should not find if gridRef is null', () => {
    const nullGrid = { current: null };
    const { result } = renderHook(() => useFindReplace(nullGrid as any, columns));

    act(() => {
      result.current.setFindText('test');
    });
    act(() => {
      result.current.handleFind();
    });

    // Should not throw
    expect(result.current.findText).toBe('test');
  });

  it('should replace matching values', () => {
    const nodes = [
      { data: { name: 'Hello World', status: 'active' }, setDataValue: vi.fn() },
      { data: { name: 'Goodbye', status: 'inactive' }, setDataValue: vi.fn() },
    ];
    const grid = createMockGridRef(nodes);

    const { result } = renderHook(() => useFindReplace(grid as any, columns));

    act(() => {
      result.current.setFindText('Hello');
    });
    act(() => {
      result.current.setReplaceText('Hi');
    });
    act(() => {
      result.current.handleReplace();
    });

    expect(nodes![0]!.setDataValue).toHaveBeenCalledWith('name', 'Hi World');
    expect(nodes![1]!.setDataValue).not.toHaveBeenCalled();
  });

  it('should replace case-insensitively', () => {
    const nodes = [{ data: { name: 'hello WORLD' }, setDataValue: vi.fn() }];
    const grid = createMockGridRef(nodes);

    const { result } = renderHook(() => useFindReplace(grid as any, columns));

    act(() => {
      result.current.setFindText('world');
    });
    act(() => {
      result.current.setReplaceText('earth');
    });
    act(() => {
      result.current.handleReplace();
    });

    expect(nodes![0]!.setDataValue).toHaveBeenCalledWith('name', 'hello earth');
  });

  it('should replace across multiple columns', () => {
    const multiCols: DataGridColumn[] = [
      { field: 'a', headerName: 'A', type: 'text' },
      { field: 'b', headerName: 'B', type: 'text' },
    ];
    const nodes = [{ data: { a: 'foo bar', b: 'bar baz' }, setDataValue: vi.fn() }];
    const grid = createMockGridRef(nodes);

    const { result } = renderHook(() => useFindReplace(grid as any, multiCols));

    act(() => {
      result.current.setFindText('bar');
    });
    act(() => {
      result.current.setReplaceText('qux');
    });
    act(() => {
      result.current.handleReplace();
    });

    expect(nodes![0]!.setDataValue).toHaveBeenCalledWith('a', 'foo qux');
    expect(nodes![0]!.setDataValue).toHaveBeenCalledWith('b', 'qux baz');
  });

  it('should close and clear filter on closeFindReplace', () => {
    const { result } = renderHook(() => useFindReplace(mockGrid as any, columns));

    act(() => {
      result.current.setShowFindReplace(true);
    });
    act(() => {
      result.current.closeFindReplace();
    });

    expect(result.current.showFindReplace).toBe(false);
    expect(mockGrid.current.api.setGridOption).toHaveBeenCalledWith('quickFilterText', '');
  });

  it('should handle replace when gridRef is null', () => {
    const nullGrid = { current: null };
    const { result } = renderHook(() => useFindReplace(nullGrid as any, columns));

    act(() => {
      result.current.setFindText('test');
    });
    act(() => {
      result.current.handleReplace();
    });

    // Should not throw
  });

  it('should handle replace with empty findText', () => {
    const { result } = renderHook(() => useFindReplace(mockGrid as any, columns));

    act(() => {
      result.current.handleReplace();
    });

    expect(mockGrid.nodes[0]?.setDataValue).toBeUndefined();
  });
});
