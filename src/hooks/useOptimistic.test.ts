/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimistic } from './useOptimistic';

describe('useOptimistic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns current data initially', () => {
    const { result } = renderHook(() =>
      useOptimistic({
        currentData: [1, 2, 3],
        optimisticFn: (data: number[], id: number) => data.filter((d) => d !== id),
        mutateFn: async () => {},
      })
    );
    expect(result.current.data).toEqual([1, 2, 3]);
  });

  it('applies optimistic update immediately and reverts after sync mutation', async () => {
    const { result } = renderHook(() =>
      useOptimistic({
        currentData: [1, 2, 3],
        optimisticFn: (data: number[], id: number) => data.filter((d) => d !== id),
        mutateFn: async () => {},
      })
    );

    // Start mutation
    act(() => {
      result.current.mutate(2);
    });

    // After setOptimisticData but mutation hasn't resolved in microtask yet
    // Actually with sync async () => {}, it runs synchronously in next microtask
    // Let's check isPending
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toEqual([1, 3]);

    // Wait for the microtask
    await act(async () => {
      await Promise.resolve();
    });

    // After mutation completes, optimistic is cleared -> back to currentData
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(result.current.isPending).toBe(false);
  });

  it('sets isPending during mutation', async () => {
    const { result } = renderHook(() =>
      useOptimistic({
        currentData: [1, 2, 3],
        optimisticFn: (data: number[], id: number) => data.filter((d) => d !== id),
        mutateFn: () => new Promise<void>((resolve) => setTimeout(resolve, 1000)),
      })
    );

    act(() => {
      result.current.mutate(2);
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toEqual([1, 3]);
  });

  it('reverts optimistic update on error', async () => {
    const { result } = renderHook(() =>
      useOptimistic({
        currentData: [1, 2, 3],
        optimisticFn: (data: number[], id: number) => data.filter((d) => d !== id),
        mutateFn: async () => {
          throw new Error('Mutation failed');
        },
      })
    );

    // Start mutation - should show optimistic
    act(() => {
      result.current.mutate(2);
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toEqual([1, 3]);

    // Let the rejection settle
    await act(async () => {
      try {
        await Promise.resolve();
      } catch {
        // ignore
      }
    });

    // Should revert to original data
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Mutation failed');
  });

  it('calls onSuccess on successful mutation', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useOptimistic({
        currentData: [1, 2, 3],
        optimisticFn: (data: number[], id: number) => data.filter((d) => d !== id),
        mutateFn: async () => 'result',
        onSuccess,
      })
    );

    act(() => {
      result.current.mutate(2);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(onSuccess).toHaveBeenCalledWith('result');
  });

  it('calls onError on mutation failure', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useOptimistic({
        currentData: [1, 2, 3],
        optimisticFn: (data: number[], id: number) => data.filter((d) => d !== id),
        mutateFn: async () => {
          throw new Error('Failed');
        },
        onError,
      })
    );

    act(() => {
      result.current.mutate(2);
    });

    await act(async () => {
      try {
        await Promise.resolve();
      } catch {
        // ignore
      }
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('resets error with resetError', async () => {
    const { result } = renderHook(() =>
      useOptimistic({
        currentData: [1, 2, 3],
        optimisticFn: (data: number[], id: number) => data.filter((d) => d !== id),
        mutateFn: async () => {
          throw new Error('Failed');
        },
      })
    );

    act(() => {
      result.current.mutate(2);
    });

    await act(async () => {
      try {
        await Promise.resolve();
      } catch {
        // ignore
      }
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.resetError();
    });

    expect(result.current.error).toBeNull();
  });
});
