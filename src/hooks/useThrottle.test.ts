/**
 * @vitest-environment jsdom
 */
import 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThrottle } from './useThrottle';

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value', () => {
    const { result } = renderHook(() => useThrottle('hello', 100));
    expect(result.current).toBe('hello');
  });

  it('should throttle value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, interval }: { value: string; interval: number }) => useThrottle(value, interval),
      { initialProps: { value: 'a', interval: 100 } }
    );

    expect(result.current).toBe('a');

    rerender({ value: 'b', interval: 100 });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('b');
  });

  it('should use initial value as first throttle value', () => {
    const { result } = renderHook(() => useThrottle(42, 200));
    expect(result.current).toBe(42);
  });
});
