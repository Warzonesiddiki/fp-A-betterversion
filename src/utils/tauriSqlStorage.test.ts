/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to create mock functions before vi.mock hoisting
const { mockSelect, mockExecute, mockLoad } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockExecute: vi.fn(),
  mockLoad: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: mockLoad,
  },
}));

import { tauriSqlStorage, isTauri } from './tauriSqlStorage';

describe('isTauri', () => {
  it('should return a promise that resolves to a boolean', async () => {
    const result = await isTauri();
    expect(typeof result).toBe('boolean');
  });

  it('should return false in jsdom (no Tauri runtime)', async () => {
    // In a jsdom test environment, neither __TAURI_INTERNALS nor __TAURI__
    // are present on the window object, so isTauri() returns false.
    const result = await isTauri();
    expect(result).toBe(false);
  });

  it('should not throw when called', async () => {
    await expect(isTauri()).resolves.toBeDefined();
  });
});

// F-05 browser-beta contract: outside a Tauri runtime the storage is a
// no-op — it never touches @tauri-apps/plugin-sql and never throws.
describe('tauriSqlStorage (non-Tauri browser)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as Record<string, unknown>).__TAURI__;
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  it('getItem is a no-op returning null without touching the plugin', async () => {
    mockLoad.mockResolvedValue({ select: mockSelect, execute: mockExecute });

    const result = await tauriSqlStorage.getItem('ui-store');

    expect(result).toBeNull();
    expect(mockLoad).not.toHaveBeenCalled();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('setItem is a no-op in a browser', async () => {
    mockLoad.mockResolvedValue({ select: mockSelect, execute: mockExecute });

    await tauriSqlStorage.setItem('ui-store', { state: { theme: 'dark' }, version: 1 });

    expect(mockLoad).not.toHaveBeenCalled();
    expect(mockExecute).not.toHaveBeenCalled();
  });
});

describe('tauriSqlStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The Tauri runtime flag makes getDb() take the lazy @tauri-apps/plugin-sql
    // path (mocked above), mirroring the desktop runtime.
    (window as unknown as Record<string, unknown>).__TAURI__ = true;
    mockLoad.mockResolvedValue({
      select: mockSelect,
      execute: mockExecute,
    });
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).__TAURI__;
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  describe('getItem', () => {
    it('should return parsed value when row exists', async () => {
      const storedValue = { state: { theme: 'dark' }, version: 1 };
      mockSelect.mockResolvedValue([{ value: JSON.stringify(storedValue) }]);

      const result = await tauriSqlStorage.getItem('ui-store');

      expect(mockSelect).toHaveBeenCalledWith('SELECT value FROM stores WHERE id = $1', [
        'ui-store',
      ]);
      expect(result).toEqual(storedValue);
    });

    it('should return null when no row exists', async () => {
      mockSelect.mockResolvedValue([]);

      const result = await tauriSqlStorage.getItem('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockSelect.mockRejectedValue(new Error('DB error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await tauriSqlStorage.getItem('broken');
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON gracefully', async () => {
      mockSelect.mockResolvedValue([{ value: 'not-json' }]);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await tauriSqlStorage.getItem('corrupt');
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('setItem', () => {
    it('should insert/upsert value into stores table', async () => {
      const value = { state: { data: 'test' }, version: 1 };

      await tauriSqlStorage.setItem('budget-store', value);

      expect(mockExecute).toHaveBeenCalledWith(
        'INSERT INTO stores (id, value) VALUES ($1, $2) ON CONFLICT(id) DO UPDATE SET value = $2',
        ['budget-store', JSON.stringify(value)]
      );
    });

    it('should stringify the value', async () => {
      const value = { state: { nested: { deep: true } }, version: 2 };

      await tauriSqlStorage.setItem('store', value);

      expect(mockExecute).toHaveBeenCalledWith(expect.any(String), [
        'store',
        JSON.stringify(value),
      ]);
    });

    it('should not throw on error (logs to console)', async () => {
      mockExecute.mockRejectedValue(new Error('Write failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await tauriSqlStorage.setItem('store', { state: {} });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('should delete row from stores table', async () => {
      await tauriSqlStorage.removeItem('old-store');

      expect(mockExecute).toHaveBeenCalledWith('DELETE FROM stores WHERE id = $1', ['old-store']);
    });

    it('should not throw on error (logs to console)', async () => {
      mockExecute.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await tauriSqlStorage.removeItem('store');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('database connection', () => {
    it('should reuse database connection (dbInstance cached at module level)', async () => {
      // The module-level dbInstance is cached after the first getDb() call.
      // Since mockLoad was already called in earlier tests, subsequent calls
      // should not trigger another load.
      mockSelect.mockResolvedValue([]);
      mockExecute.mockResolvedValue(undefined);

      const loadCallsBefore = mockLoad.mock.calls.length;

      await tauriSqlStorage.getItem('store1');
      await tauriSqlStorage.setItem('store2', { state: {} });
      await tauriSqlStorage.removeItem('store3');

      // No additional load calls since dbInstance is cached
      expect(mockLoad.mock.calls.length).toBe(loadCallsBefore);
    });

    it('should work correctly with cached connection', async () => {
      mockSelect.mockResolvedValue([{ value: '{"cached": true}' }]);

      const result = await tauriSqlStorage.getItem('test');
      expect(result).toEqual({ cached: true });
    });
  });
});
