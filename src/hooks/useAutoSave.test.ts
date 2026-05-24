/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call onSave after delay when data changes', () => {
    const onSave = vi.fn();
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, { delay: 1000, onSave, enabled: true }),
      { initialProps: { data: { name: 'test' } } }
    );

    rerender({ data: { name: 'updated' } });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onSave).toHaveBeenCalledWith({ name: 'updated' });
  });

  it('should debounce multiple rapid changes', () => {
    const onSave = vi.fn();
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, { delay: 500, onSave, enabled: true }),
      { initialProps: { data: { name: 'a' } } }
    );

    rerender({ data: { name: 'b' } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ data: { name: 'c' } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ data: { name: 'd' } });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ name: 'd' });
  });

  it('should not save when enabled is false', () => {
    const onSave = vi.fn();
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, { delay: 1000, onSave, enabled: false }),
      { initialProps: { data: { name: 'test' } } }
    );

    rerender({ data: { name: 'updated' } });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('should allow force save when data has changed', () => {
    const onSave = vi.fn();
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, { delay: 5000, onSave, enabled: true }),
      { initialProps: { data: { name: 'original' } } }
    );

    // Change data so forceSave detects a difference
    rerender({ data: { name: 'changed' } });
    act(() => {
      result.current.forceSave();
    });
    expect(onSave).toHaveBeenCalledWith({ name: 'changed' });
  });
});
