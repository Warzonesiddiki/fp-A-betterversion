/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFirstRun } from './useFirstRun';

const mockGetItem = vi.fn();
const mockSetItem = vi.fn();
const mockRemoveItem = vi.fn();

vi.mock('@/utils/masterStorage', () => ({
  masterStorage: {
    getItem: (...args: any[]) => mockGetItem(...args),
    setItem: (...args: any[]) => mockSetItem(...args),
    removeItem: (...args: any[]) => mockRemoveItem(...args),
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useFirstRun', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should return false if localStorage has setup-complete', async () => {
    localStorageMock.setItem('finplan-setup-complete', 'true');
    const { result } = renderHook(() => useFirstRun());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isFirstRun).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetItem).not.toHaveBeenCalled();
  });

  it('should check masterStorage if localStorage is empty', async () => {
    mockGetItem.mockResolvedValue(null);
    const { result } = renderHook(() => useFirstRun());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isFirstRun).toBe(true);
    expect(mockGetItem).toHaveBeenCalledWith('finplan-setup-complete');
  });

  it('should complete setup and update state', async () => {
    const { result } = renderHook(() => useFirstRun());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.completeSetup();
    });

    expect(result.current.isFirstRun).toBe(false);
    expect(localStorageMock.getItem('finplan-setup-complete')).toBe('true');
    expect(mockSetItem).toHaveBeenCalledWith('finplan-setup-complete', '"true"');
  });

  it('should reset setup and update state', async () => {
    localStorageMock.setItem('finplan-setup-complete', 'true');
    const { result } = renderHook(() => useFirstRun());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.resetSetup();
    });

    expect(result.current.isFirstRun).toBe(true);
    expect(localStorageMock.getItem('finplan-setup-complete')).toBeNull();
    expect(mockRemoveItem).toHaveBeenCalledWith('finplan-setup-complete');
  });
});
