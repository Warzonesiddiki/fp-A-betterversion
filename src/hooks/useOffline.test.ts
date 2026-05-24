/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOffline } from './useOffline';

describe('useOffline', () => {
  it('should reflect initial online status', () => {
    const { result } = renderHook(() => useOffline());
    expect(result.current.isOnline).toBe(navigator.onLine);
  });

  it('should update status when going offline and online', () => {
    const { result } = renderHook(() => useOffline());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
  });
});
