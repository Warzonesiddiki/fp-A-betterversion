/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoableAction } from './useUndoableAction';

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn((selector) => {
    const state = { addToast: vi.fn() };
    return selector ? selector(state) : state;
  }),
}));

describe('useUndoableAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useUndoableAction());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should execute an action and make undoable', () => {
    const { result } = renderHook(() => useUndoableAction());
    const action = vi.fn(() => 'result');
    const undo = vi.fn();
    const redo = vi.fn();

    let returnValue: unknown;
    act(() => {
      returnValue = result.current.execute({ action, undo, redo, description: 'Test action' });
    });

    expect(returnValue).toBe('result');
    expect(result.current.canUndo).toBe(true);
  });

  it('should undo an action', () => {
    const { result } = renderHook(() => useUndoableAction());
    const undo = vi.fn();
    const redo = vi.fn();

    act(() => {
      result.current.execute({ action: () => 'x', undo, redo, description: 'Test' });
    });

    act(() => {
      result.current.undo();
    });

    expect(undo).toHaveBeenCalled();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('should redo an action', () => {
    const { result } = renderHook(() => useUndoableAction());
    const undo = vi.fn();
    const redo = vi.fn();

    act(() => {
      result.current.execute({ action: () => 'x', undo, redo, description: 'Test' });
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.redo();
    });

    expect(redo).toHaveBeenCalled();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should clear redo stack on new action', () => {
    const { result } = renderHook(() => useUndoableAction());

    act(() => {
      result.current.execute({
        action: () => 1,
        undo: vi.fn(),
        redo: vi.fn(),
        description: 'First',
      });
    });
    act(() => {
      result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.execute({
        action: () => 2,
        undo: vi.fn(),
        redo: vi.fn(),
        description: 'Second',
      });
    });

    expect(result.current.canRedo).toBe(false);
  });

  it('should do nothing when undoing empty stack', () => {
    const { result } = renderHook(() => useUndoableAction());
    act(() => {
      result.current.undo();
    });
    expect(result.current.canUndo).toBe(false);
  });

  it('should do nothing when redoing empty stack', () => {
    const { result } = renderHook(() => useUndoableAction());
    act(() => {
      result.current.redo();
    });
    expect(result.current.canRedo).toBe(false);
  });

  it('should auto-expire undo after timeout', () => {
    const { result } = renderHook(() => useUndoableAction());

    act(() => {
      result.current.execute({
        action: () => 'x',
        undo: vi.fn(),
        redo: vi.fn(),
        description: 'Test',
        undoTimeout: 5000,
      });
    });

    expect(result.current.canUndo).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5001);
    });

    expect(result.current.canUndo).toBe(false);
  });
});
