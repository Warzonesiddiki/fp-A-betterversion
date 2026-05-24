import { describe, it, expect, vi } from 'vitest';
import {
  MIGRATIONS,
  CURRENT_VERSION,
  getDataVersion,
  setDataVersion,
  runMigrations,
} from '../dataMigration';

const { mockOpenDB } = vi.hoisted(() => ({
  mockOpenDB: vi.fn().mockRejectedValue(new Error('IndexedDB not available')),
}));
vi.mock('../indexedDBStorage', () => ({ openDB: mockOpenDB }));

describe('dataMigration', () => {
  it('exports CURRENT_VERSION', () => {
    expect(CURRENT_VERSION).toBe(1);
  });

  it('exports MIGRATIONS as array', () => {
    expect(Array.isArray(MIGRATIONS)).toBe(true);
  });

  it('getDataVersion returns 0 on error', async () => {
    const v = await getDataVersion();
    expect(v).toBe(0);
  });

  it('setDataVersion does not throw on error', async () => {
    await expect(setDataVersion(1)).resolves.toBeUndefined();
  });

  it('runMigrations propagates openDB error when version check passes', async () => {
    await expect(runMigrations()).rejects.toThrow('IndexedDB not available');
  });
});
