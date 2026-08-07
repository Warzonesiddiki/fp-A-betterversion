/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePersistence } from './usePersistence';
import { masterStorage } from '@/utils/masterStorage';

// Mock dependencies
vi.mock('@/utils/masterStorage', () => ({
  masterStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const mockMasterStorage = vi.mocked(masterStorage);
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

describe('usePersistence', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorageMock.clear();
  });

  const options = { key: 'test-key' };

  it('should initialize with isLoading=true and then load data', async () => {
    // Arrange
    mockMasterStorage.getItem.mockResolvedValue(
      JSON.stringify({ _data: { value: 'test' }, _version: 1 }) as any
    );

    // Act
    const { result } = renderHook(() => usePersistence({ ...options, version: 1 }));

    // Assert
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({ value: 'test' });
    expect(result.current.error).toBeNull();
  });

  // --- masterStorage (default) ---
  describe('with masterStorage', () => {
    const dbOptions = { ...options, storage: 'master' as const, version: 1 };

    it('should save data to masterStorage', async () => {
      const { result } = renderHook(() => usePersistence(dbOptions));

      await act(async () => {
        await result.current.save({ value: 'new data' });
      });

      const expected = JSON.stringify({ _data: { value: 'new data' }, _version: 1 });
      expect(mockMasterStorage.setItem).toHaveBeenCalledWith('test-key', expected as any);
      expect(result.current.data).toEqual({ value: 'new data' });
    });

    it('should clear data from masterStorage', async () => {
      const { result } = renderHook(() => usePersistence(dbOptions));
      await act(async () => {
        await result.current.clear();
      });
      expect(mockMasterStorage.removeItem).toHaveBeenCalledWith('test-key');
      expect(result.current.data).toBeNull();
    });
  });

  // --- localStorage ---
  describe('with localStorage', () => {
    const lsOptions = { ...options, storage: 'localstorage' as const, version: 1 };

    it('should save data to localStorage', async () => {
      const { result } = renderHook(() => usePersistence(lsOptions));

      await act(async () => {
        await result.current.save({ value: 'ls data' });
      });

      const expected = JSON.stringify({ _data: { value: 'ls data' }, _version: 1 });
      expect(localStorageMock.getItem('test-key')).toEqual(expected);
      expect(result.current.data).toEqual({ value: 'ls data' });
    });

    it('should load data from localStorage', async () => {
      const stored = JSON.stringify({ _data: { value: 'stored ls data' }, _version: 1 });
      localStorageMock.setItem('test-key', stored);

      const { result } = renderHook(() => usePersistence(lsOptions));

      await waitFor(() => {
        expect(result.current.data).toEqual({ value: 'stored ls data' });
      });
    });

    it('should clear data from localStorage', async () => {
      const { result } = renderHook(() => usePersistence(lsOptions));
      await act(async () => {
        await result.current.clear();
      });
      expect(localStorageMock.getItem('test-key')).toBeNull();
      expect(result.current.data).toBeNull();
    });
  });

  // --- Migration ---
  describe('migration', () => {
    it('should migrate data when version differs', async () => {
      // Arrange
      const oldData = { _data: { old: 'format' }, _version: 1 };
      localStorageMock.setItem('test-key', JSON.stringify(oldData));

      const migrate = vi.fn((old, oldVersion) => {
        expect(old).toEqual(oldData);
        expect(oldVersion).toBe(1);
        return { _data: { new: 'format' }, _version: 2 };
      });

      const migrationOptions = {
        key: 'test-key',
        storage: 'localstorage' as const,
        version: 2,
        migrate,
      };

      // Act
      const { result } = renderHook(() => usePersistence(migrationOptions));

      // Assert
      await waitFor(() => {
        expect(migrate).toHaveBeenCalledTimes(1);
        expect(result.current.data).toEqual({ old: 'format' });
      });
    });

    it('should not migrate data when versions match', async () => {
      const data = { _data: { value: 'test' }, _version: 2 };
      localStorageMock.setItem('test-key', JSON.stringify(data));
      const migrate = vi.fn();
      const migrationOptions = {
        key: 'test-key',
        storage: 'localstorage' as const,
        version: 2,
        migrate,
      };

      const { result } = renderHook(() => usePersistence(migrationOptions));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(migrate).not.toHaveBeenCalled();
      expect(result.current.data).toEqual({ value: 'test' });
    });
  });

  // --- Error Handling ---
  describe('error handling', () => {
    it('should set an error if loading fails', async () => {
      mockMasterStorage.getItem.mockRejectedValue(new Error('DB read fail'));
      const { result } = renderHook(() => usePersistence(options));
      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load data');
      });
    });

    it('should set an error if saving fails', async () => {
      mockMasterStorage.setItem.mockRejectedValue(new Error('DB write fail'));
      const { result } = renderHook(() => usePersistence(options));
      await act(async () => {
        await result.current.save({ value: 'new data' });
      });
      expect(result.current.error).toBe('Failed to save data');
    });

    it('should set an error if clearing fails', async () => {
      mockMasterStorage.removeItem.mockRejectedValue(new Error('DB clear fail'));
      const { result } = renderHook(() => usePersistence(options));
      await act(async () => {
        await result.current.clear();
      });
      expect(result.current.error).toBe('Failed to clear data');
    });
  });
});
