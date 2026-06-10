/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePeriods } from './usePeriods';

vi.mock('@/store/glStore', () => {
  let mockState: any = { entries: [] };
  const listeners = new Set<() => void>();
  const useGLStore = (selector?: (s: any) => any) => {
    const state = mockState;
    return selector ? selector(state) : state;
  };
  useGLStore.getState = () => mockState;
  useGLStore.setState = (partial: any) => {
    mockState = typeof partial === 'function' ? partial(mockState) : { ...mockState, ...partial };
    listeners.forEach((l) => l());
  };
  useGLStore.subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  (globalThis as any).__glStore = useGLStore;
  return { useGLStore };
});

beforeEach(() => {
  (globalThis as any).__glStore.setState({ entries: [] });
});

describe('usePeriods', () => {
  it('should return empty array when no entries', () => {
    const { result } = renderHook(() => usePeriods());
    expect(result.current).toEqual([]);
  });

  it('should derive periods from entry dates', () => {
    const store = (globalThis as any).__glStore;
    store.setState({
      entries: [
        { date: '2025-01-15', amount: 100 },
        { date: '2025-02-20', amount: 200 },
        { date: '2025-01-25', amount: 150 },
      ],
    });
    const { result } = renderHook(() => usePeriods());
    expect(result.current.length).toBe(2);
    expect(result!.current[0]!.name).toBe('January');
    expect(result!.current[1]!.name).toBe('February');
  });

  it('should handle invalid dates gracefully', () => {
    const store = (globalThis as any).__glStore;
    store.setState({
      entries: [{ date: 'invalid', amount: 100 }],
    });
    const { result } = renderHook(() => usePeriods());
    expect(result.current).toEqual([]);
  });

  it('should sort periods chronologically', () => {
    const store = (globalThis as any).__glStore;
    store.setState({
      entries: [
        { date: '2025-03-10', amount: 100 },
        { date: '2025-01-05', amount: 200 },
      ],
    });
    const { result } = renderHook(() => usePeriods());
    expect(result!.current[0]!.name).toBe('January');
    expect(result!.current[1]!.name).toBe('March');
  });

  it('should skip entries without dates', () => {
    const store = (globalThis as any).__glStore;
    store.setState({
      entries: [{ amount: 100 }, { date: '2025-06-15', amount: 200 }],
    });
    const { result } = renderHook(() => usePeriods());
    expect(result.current.length).toBe(1);
    expect(result!.current[0]!.name).toBe('June');
  });
});
