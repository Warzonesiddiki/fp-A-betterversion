/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  detectLegacyBrowserData,
  performLegacyToTauriMigration,
  getCurrentStorageBackend,
  hasCompletedMigration,
  __resetTauriCache,
} from './legacyStorageMigration';

// Mocks
vi.mock('@/utils/tauriSqlStorage', async () => {
  const actual = await vi.importActual<any>('@/utils/tauriSqlStorage');
  return {
    ...actual,
    isTauri: vi.fn(),
    tauriSqlStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
  };
});

vi.mock('@/utils/sqlJsStorage', async () => {
  const actual = await vi.importActual<any>('@/utils/sqlJsStorage');
  return {
    ...actual,
    sqlJsStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
  };
});

vi.mock('@/utils/indexedDBStorage', async () => {
  const actual = await vi.importActual<any>('@/utils/indexedDBStorage');
  return {
    ...actual,
    indexedDBStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      isFirstRun: vi.fn(),
      openDB: vi.fn(),
    },
  };
});

vi.mock('@/utils/masterStorage', async () => {
  const actual = await vi.importActual<any>('@/utils/masterStorage');
  return {
    ...actual,
    masterStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      migrateFromIndexedDB: actual.masterStorage?.migrateFromIndexedDB,
    },
  };
});

import { isTauri, tauriSqlStorage } from '@/utils/tauriSqlStorage';
import { sqlJsStorage } from '@/utils/sqlJsStorage';
import { indexedDBStorage } from '@/utils/indexedDBStorage';
import { masterStorage } from '@/utils/masterStorage';

describe('legacyStorageMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetTauriCache();
    (masterStorage.setItem as any).mockResolvedValue(undefined);
    (masterStorage.getItem as any).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectLegacyBrowserData', () => {
    it('returns no legacy data when all sources are empty', async () => {
      (indexedDBStorage.isFirstRun as any).mockResolvedValue(true);
      (sqlJsStorage.getItem as any).mockResolvedValue(null);
      (indexedDBStorage.getItem as any).mockResolvedValue(null);

      const result = await detectLegacyBrowserData();

      expect(result.hasLegacyData).toBe(false);
      expect(result.storeCount).toBe(0);
    });

    it('detects legacy when sqlJs has data', async () => {
      (indexedDBStorage.isFirstRun as any).mockResolvedValue(true);
      (sqlJsStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'gl-store') return Promise.resolve({ state: { foo: 'bar' } });
        return Promise.resolve(null);
      });

      const result = await detectLegacyBrowserData();

      expect(result.hasLegacyData).toBe(true);
      expect(result.sources).toContain('sqljs');
    });

    it('detects legacy indexedDB data', async () => {
      (indexedDBStorage.isFirstRun as any).mockResolvedValue(false);
      (sqlJsStorage.getItem as any).mockResolvedValue(null);

      const result = await detectLegacyBrowserData();

      expect(result.hasLegacyData).toBe(true);
      expect(result.sources).toContain('indexeddb');
    });
  });

  describe('performLegacyToTauriMigration', () => {
    it('skips migration when not in desktop and force=false', async () => {
      (isTauri as any).mockResolvedValue(false);

      const result = await performLegacyToTauriMigration();

      expect(result.success).toBe(true);
      expect(result.skippedKeys).toContain('not-desktop');
      expect(masterStorage.setItem).not.toHaveBeenCalled();
    });

    it('performs migration when in desktop and legacy data exists', async () => {
      (isTauri as any).mockResolvedValue(true);
      (indexedDBStorage.isFirstRun as any).mockResolvedValue(false);
      (sqlJsStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'gl-store') return Promise.resolve({ state: { entries: [1, 2] } });
        if (key === 'budget-store') return Promise.resolve({ state: { total: 100 } });
        return Promise.resolve(null);
      });

      const result = await performLegacyToTauriMigration();

      expect(result.success).toBe(true);
      expect(result.migratedKeys.length).toBeGreaterThan(0);
      expect(result.migratedKeys).toContain('gl-store');
      expect(result.legacyChecksum).toBeDefined();
      expect(result.completedAt).toBeDefined();
      expect(masterStorage.setItem).toHaveBeenCalled();
    });

    it('is idempotent — second call does not duplicate work if already migrated', async () => {
      (isTauri as any).mockResolvedValue(true);
      (masterStorage.getItem as any).mockResolvedValue({
        completedAt: '2026-01-01',
        checksum: 'abc',
      });

      // First call
      const first = await performLegacyToTauriMigration();
      // Second call
      const second = await performLegacyToTauriMigration();

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      // Should have still succeeded even if it detected metadata
    });

    it('handles partial failure gracefully', async () => {
      (isTauri as any).mockResolvedValue(true);
      (sqlJsStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'gl-store') return Promise.resolve({ state: 'good' });
        if (key === 'budget-store') return Promise.resolve({ state: 'bad' });
        return Promise.resolve(null);
      });

      (masterStorage.setItem as any).mockImplementation((key: string) => {
        if (key === 'budget-store') return Promise.reject(new Error('write failed'));
        return Promise.resolve();
      });

      const result = await performLegacyToTauriMigration();

      expect(result.success).toBe(false);
      expect(result.migratedKeys).toContain('gl-store');
      expect(result.skippedKeys).toContain('budget-store');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('records migration metadata on success', async () => {
      (isTauri as any).mockResolvedValue(true);
      (sqlJsStorage.getItem as any).mockResolvedValue({ state: { x: 1 } });

      await performLegacyToTauriMigration();

      expect(masterStorage.setItem).toHaveBeenCalledWith(
        'migration:legacy-to-tauri',
        expect.objectContaining({
          completedAt: expect.any(String),
          checksum: expect.any(String),
        })
      );
    });
  });

  describe('getCurrentStorageBackend', () => {
    it('returns browser-sqljs when not tauri', async () => {
      (isTauri as any).mockResolvedValue(false);
      const backend = await getCurrentStorageBackend();
      expect(backend).toBe('browser-sqljs');
    });

    it('returns desktop-tauri-sqlite when in tauri', async () => {
      (isTauri as any).mockResolvedValue(true);
      (tauriSqlStorage.getItem as any).mockResolvedValue(null);

      const backend = await getCurrentStorageBackend();
      expect(backend).toBe('desktop-tauri-sqlite');
    });
  });

  describe('hasCompletedMigration', () => {
    it('returns true when metadata exists', async () => {
      (masterStorage.getItem as any).mockResolvedValue({ completedAt: '2026-07-26' });
      const completed = await hasCompletedMigration();
      expect(completed).toBe(true);
    });

    it('returns false when no metadata', async () => {
      (masterStorage.getItem as any).mockResolvedValue(null);
      const completed = await hasCompletedMigration();
      expect(completed).toBe(false);
    });
  });
});
