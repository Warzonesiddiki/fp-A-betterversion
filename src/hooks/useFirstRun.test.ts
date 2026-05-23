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

describe('useFirstRun', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return false if localStorage has setup-complete', async () => {
    localStorage.setItem('finplan-setup-complete', 'true');
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
    expect(localStorage.getItem('finplan-setup-complete')).toBe('true');
    expect(mockSetItem).toHaveBeenCalledWith('finplan-setup-complete', '"true"');
  });

  it('should reset setup and update state', async () => {
    localStorage.setItem('finplan-setup-complete', 'true');
    const { result } = renderHook(() => useFirstRun());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.resetSetup();
    });

    expect(result.current.isFirstRun).toBe(true);
    expect(localStorage.getItem('finplan-setup-complete')).toBeNull();
    expect(mockRemoveItem).toHaveBeenCalledWith('finplan-setup-complete');
  });
});
