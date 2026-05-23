/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // still initial

    // Advance time by 250ms
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial'); // still initial

    // Advance time by another 250ms
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('updated'); // now updated

    vi.useRealTimers();
  });

  it('should cancel previous timer on value change', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    rerender({ value: 'first-update', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe('initial');

    rerender({ value: 'second-update', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe('initial'); // still initial because first timer was cancelled

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('second-update');

    vi.useRealTimers();
  });

  it('should update immediately if delay is 0', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 0 },
    });

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 0 });
    expect(result.current).toBe('updated');
  });
});
