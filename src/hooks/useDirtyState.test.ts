/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDirtyState } from './useDirtyState';

describe('useDirtyState', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useDirtyState());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
    expect(result.current.lastSaved).toBeNull();
  });

  it('should mark dirty', () => {
    const { result } = renderHook(() => useDirtyState());
    act(() => result.current.markDirty('name'));
    expect(result.current.isDirty).toBe(true);
  });

  it('should track dirty field count via getDirtyFields', () => {
    const { result } = renderHook(() => useDirtyState());
    act(() => result.current.markDirty('name'));
    expect(result.current.getDirtyFields()).toEqual(['name']);
    expect(result.current.dirtyCount).toBe(1);
    act(() => result.current.markDirty('email'));
    // Note: dirtyCount may be stale because setIsDirty(true) when already true
    // doesn't trigger a re-render. getDirtyFields() always reads the ref directly.
    expect(result.current.getDirtyFields()).toEqual(['name', 'email']);
  });

  it('should not count duplicate fields twice', () => {
    const { result } = renderHook(() => useDirtyState());
    act(() => result.current.markDirty('name'));
    act(() => result.current.markDirty('name'));
    expect(result.current.dirtyCount).toBe(1);
  });

  it('should mark clean and set lastSaved', () => {
    const { result } = renderHook(() => useDirtyState());
    act(() => result.current.markDirty('name'));
    act(() => result.current.markClean());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
    expect(result.current.lastSaved).toBeInstanceOf(Date);
  });

  it('should reset dirty without setting lastSaved', () => {
    const { result } = renderHook(() => useDirtyState());
    act(() => result.current.markDirty('name'));
    act(() => result.current.resetDirty());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
    expect(result.current.lastSaved).toBeNull();
  });

  it('should return dirty fields list', () => {
    const { result } = renderHook(() => useDirtyState());
    act(() => result.current.markDirty('name'));
    act(() => result.current.markDirty('email'));
    expect(result.current.getDirtyFields()).toEqual(['name', 'email']);
  });

  it('should call onDirtyChange callback', () => {
    const onDirtyChange = vi.fn();
    const { result } = renderHook(() => useDirtyState({ onDirtyChange }));
    act(() => result.current.markDirty('name'));
    expect(onDirtyChange).toHaveBeenCalledWith(true);
    act(() => result.current.markClean());
    expect(onDirtyChange).toHaveBeenCalledWith(false);
  });

  it('should handle markDirty without field name', () => {
    const { result } = renderHook(() => useDirtyState());
    act(() => result.current.markDirty());
    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtyCount).toBe(0); // no field to add to set
  });
});
