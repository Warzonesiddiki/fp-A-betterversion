import { describe, it, expect, vi } from 'vitest';
import { tauriSqlStorage, isTauri } from '../tauriSqlStorage';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn().mockResolvedValue([{ value: JSON.stringify({ user: 'test' }) }]),
    execute: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn().mockResolvedValue(mockDb),
  },
}));

describe('tauriSqlStorage', () => {
  it('getItem returns parsed value', async () => {
    const value = await tauriSqlStorage.getItem('test-key');
    expect(value).toEqual({ user: 'test' });
  });

  it('setItem does not throw', async () => {
    await expect(tauriSqlStorage.setItem('test-key', { state: 123 })).resolves.toBeUndefined();
  });

  it('removeItem does not throw', async () => {
    await expect(tauriSqlStorage.removeItem('test-key')).resolves.toBeUndefined();
  });

  it('getItem handles empty result', async () => {
    mockDb.select.mockResolvedValueOnce([]);
    const value = await tauriSqlStorage.getItem('missing-key');
    expect(value).toBeNull();
  });

  it('isTauri returns false in test environment', async () => {
    const result = await isTauri();
    expect(result).toBe(false);
  });

  it('isTauri returns true when __TAURI__ is present', async () => {
    (globalThis as any).__TAURI__ = true;
    const result = await isTauri();
    expect(result).toBe(true);
    delete (globalThis as any).__TAURI__;
  });
});
