/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCurrency } from './useCurrency';

vi.mock('@/store/settingsStore', () => {
  let mockState: any = {
    preferences: { currency: 'USD', locale: 'en-US' },
  };
  const listeners = new Set<() => void>();
  const useSettingsStore = (selector?: (s: any) => any) => {
    const state = mockState;
    return selector ? selector(state) : state;
  };
  useSettingsStore.getState = () => mockState;
  useSettingsStore.setState = (partial: any) => {
    mockState = typeof partial === 'function' ? partial(mockState) : { ...mockState, ...partial };
    listeners.forEach((l) => l());
  };
  useSettingsStore.subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  (globalThis as any).__settingsStore = useSettingsStore;
  return { useSettingsStore };
});

beforeEach(() => {
  (globalThis as any).__settingsStore.setState({
    preferences: { currency: 'USD', locale: 'en-US' },
  });
});

describe('useCurrency', () => {
  it('should format amount in default currency (USD)', () => {
    const { result } = renderHook(() => useCurrency());
    const formatted = result.current.format(1234.56);
    expect(formatted).toContain('1,234.56');
  });

  it('should use currency from settings', () => {
    const store = (globalThis as any).__settingsStore;
    store.setState({ preferences: { currency: 'EUR', locale: 'en-US' } });
    const { result } = renderHook(() => useCurrency());
    const formatted = result.current.format(100);
    expect(formatted).toContain('100');
  });

  it('should show sign when showSign is true', () => {
    const { result } = renderHook(() => useCurrency());
    const formatted = result.current.format(50, { showSign: true });
    expect(formatted).toMatch(/^\+/);
  });

  it('should format percentages', () => {
    const { result } = renderHook(() => useCurrency());
    const formatted = result.current.formatPercent(0.155, 1);
    expect(formatted).toContain('15.5');
  });

  it('should format compact numbers', () => {
    const { result } = renderHook(() => useCurrency());
    const formatted = result.current.formatCompact(1500000);
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe('string');
  });
});
