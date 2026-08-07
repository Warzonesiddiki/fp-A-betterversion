/**
 * @vitest-environment jsdom
 */
import 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFreezePanes } from './useFreezePanes';

function createMockGridApi() {
  const cols = [{ getColId: () => 'col1' }, { getColId: () => 'col2' }, { getColId: () => 'col3' }];
  return {
    getColumns: vi.fn(() => cols),
    setColumnsPinned: vi.fn(),
  } as any;
}

describe('useFreezePanes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useFreezePanes(createMockGridApi()));
    expect(result.current.frozenRows).toBe(0);
    expect(result.current.frozenCols).toBe(0);
    expect(result.current.isFrozen).toBe(false);
  });

  it('should not crash when null gridApi', () => {
    const { result } = renderHook(() => useFreezePanes(null));
    expect(result.current.frozenRows).toBe(0);
    act(() => {
      result.current.freezeTopRow();
    });
    expect(result.current.frozenRows).toBe(0);
  });

  it('should freeze top row', () => {
    const api = createMockGridApi();
    const { result } = renderHook(() => useFreezePanes(api));
    act(() => {
      result.current.freezeTopRow();
    });
    expect(result.current.frozenRows).toBe(1);
    expect(result.current.isFrozen).toBe(true);
  });

  it('should freeze first N columns', () => {
    const api = createMockGridApi();
    const { result } = renderHook(() => useFreezePanes(api));
    act(() => {
      result.current.freezeFirstColumns(2);
    });
    expect(result.current.frozenCols).toBe(2);
    expect(api.setColumnsPinned).toHaveBeenCalled();
  });

  it('should freeze both rows and columns', () => {
    const api = createMockGridApi();
    const { result } = renderHook(() => useFreezePanes(api));
    act(() => {
      result.current.freezeBoth(1, 2);
    });
    expect(result.current.frozenRows).toBe(1);
    expect(result.current.frozenCols).toBe(2);
  });

  it('should unfreeze all', () => {
    const api = createMockGridApi();
    const { result } = renderHook(() => useFreezePanes(api));
    act(() => {
      result.current.freezeBoth(1, 2);
    });
    act(() => {
      result.current.unfreeze();
    });
    expect(result.current.frozenRows).toBe(0);
    expect(result.current.frozenCols).toBe(0);
    expect(result.current.isFrozen).toBe(false);
  });

  it('should not freeze if gridApi is null', () => {
    const { result } = renderHook(() => useFreezePanes(null));
    act(() => {
      result.current.freezeTopRow();
    });
    expect(result.current.frozenRows).toBe(0);
  });
});
