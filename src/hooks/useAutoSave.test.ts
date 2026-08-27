/**
 * @vitest-environment jsdom
 */
import 'react';
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

  // --- Wave-7E hooks-data-loss P1 regressions ---
  describe('pending-save integrity', () => {
    it('flushes the pending save on unmount instead of dropping it', () => {
      const onSave = vi.fn();
      const { rerender, unmount } = renderHook(
        ({ data }) => useAutoSave(data, { delay: 10_000, onSave, enabled: true }),
        { initialProps: { data: { name: 'original' } } }
      );

      rerender({ data: { name: 'unmount-pending' } });
      expect(onSave).not.toHaveBeenCalled();

      unmount();

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ name: 'unmount-pending' });
    });

    it('flushes the pending save when the window fires beforeunload', () => {
      const onSave = vi.fn();
      const { rerender } = renderHook(
        ({ data }) => useAutoSave(data, { delay: 60_000, onSave, enabled: true }),
        { initialProps: { data: { name: 'original' } } }
      );

      rerender({ data: { name: 'closing' } });

      act(() => {
        window.dispatchEvent(new Event('beforeunload'));
      });

      expect(onSave).toHaveBeenCalledWith({ name: 'closing' });
    });

    it('flushes the pending save when the tab becomes hidden', () => {
      const onSave = vi.fn();
      const { rerender } = renderHook(
        ({ data }) => useAutoSave(data, { delay: 60_000, onSave, enabled: true }),
        { initialProps: { data: { name: 'original' } } }
      );

      try {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'hidden',
        });
        rerender({ data: { name: 'hidden-tab' } });

        act(() => {
          document.dispatchEvent(new Event('visibilitychange'));
        });

        expect(onSave).toHaveBeenCalledWith({ name: 'hidden-tab' });
      } finally {
        delete (document as unknown as Record<string, unknown>).visibilityState;
      }
    });

    it('does not flush on unload while autosave is disabled', () => {
      const onSave = vi.fn();
      const { rerender, unmount } = renderHook(
        ({ data }) => useAutoSave(data, { delay: 10_000, onSave, enabled: false }),
        { initialProps: { data: { name: 'original' } } }
      );

      rerender({ data: { name: 'never-saved' } });
      act(() => {
        window.dispatchEvent(new Event('beforeunload'));
      });
      unmount();

      expect(onSave).not.toHaveBeenCalled();
    });

    it('detects changes via an optional revision counter without re-serializing documents', () => {
      const onSave = vi.fn();
      const sharedDoc = { name: 'rev-doc', rows: Array.from({ length: 64 }, () => ({ v: 1 })) };
      const { rerender } = renderHook(
        ({ data, revision }) => useAutoSave(data, { delay: 1000, onSave, enabled: true, revision }),
        { initialProps: { data: sharedDoc, revision: 1 } }
      );

      // Same object identity, revision bumped by the writer — O(1) dirty detection.
      rerender({ data: sharedDoc, revision: 7 });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(sharedDoc);
    });

    it('does not re-save when a change carries identical content and settles back to idle', () => {
      const onSave = vi.fn();
      const { result, rerender } = renderHook(
        ({ data }) => useAutoSave(data, { delay: 500, onSave, enabled: true }),
        { initialProps: { data: { name: 'same' } } }
      );

      rerender({ data: { name: 'same' } }); // new reference, same content

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onSave).not.toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });
  });
});
