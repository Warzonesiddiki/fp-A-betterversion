/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDensity, densityClass } from './useDensity';

vi.mock('@/store/settingsStore', () => {
  let mockState: any = {
    preferences: { density: 'comfortable' },
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
    preferences: { density: 'comfortable' },
  });
});

describe('useDensity', () => {
  it('should return comfortable by default', () => {
    const { result } = renderHook(() => useDensity());
    expect(result.current).toBe('comfortable');
  });

  it('should return compact when set', () => {
    const store = (globalThis as any).__settingsStore;
    store.setState({ preferences: { density: 'compact' } });
    const { result } = renderHook(() => useDensity());
    expect(result.current).toBe('compact');
  });
});

describe('densityClass', () => {
  it('should return compact value when compact', () => {
    expect(densityClass('compact', 'p-1', 'p-4')).toBe('p-1');
  });

  it('should return comfortable value when comfortable', () => {
    expect(densityClass('comfortable', 'p-1', 'p-4')).toBe('p-4');
  });

  it('should return empty string for comfortable with no comfortableValue', () => {
    expect(densityClass('comfortable', 'p-1')).toBe('');
  });
});
