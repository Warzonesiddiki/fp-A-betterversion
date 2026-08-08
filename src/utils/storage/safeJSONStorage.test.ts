import { describe, it, expect, vi } from 'vitest';
import { safeJSONStorage } from './safeJSONStorage';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

const storageValue = (state: unknown): StorageValue<unknown> => ({
  state,
  version: 0,
});

describe('safeJSONStorage', () => {
  it('getItem returns null for null/undefined backing values', async () => {
    const backing: PersistStorage<unknown, unknown> = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const storage = safeJSONStorage(backing);
    expect(await storage.getItem('key')).toBeNull();
    (backing.getItem as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    expect(await storage.getItem('key')).toBeNull();
  });

  it('getItem returns the backing value when present', async () => {
    const value = storageValue({ a: 1 });
    const backing: PersistStorage<unknown, unknown> = {
      getItem: vi.fn().mockResolvedValue(value),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const storage = safeJSONStorage(backing);
    expect(await storage.getItem('key')).toEqual(value);
  });

  it('getItem swallows backing failures and returns null', async () => {
    const backing: PersistStorage<unknown, unknown> = {
      getItem: vi.fn().mockRejectedValue(new Error('boom')),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const storage = safeJSONStorage(backing);
    await expect(storage.getItem('key')).resolves.toBeNull();
  });

  it('setItem forwards the value and swallows failures', async () => {
    const setItem = vi.fn().mockResolvedValue(undefined);
    const backing: PersistStorage<unknown, unknown> = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem,
      removeItem: vi.fn(),
    };
    const storage = safeJSONStorage(backing);
    const value = storageValue({ a: 2 });
    await storage.setItem('key', value);
    expect(setItem).toHaveBeenCalledWith('key', value);

    setItem.mockRejectedValueOnce(new Error('disk full'));
    await expect(storage.setItem('key', value)).resolves.toBeUndefined();
  });

  it('removeItem forwards the name and swallows failures', async () => {
    const removeItem = vi.fn().mockResolvedValue(undefined);
    const backing: PersistStorage<unknown, unknown> = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn(),
      removeItem,
    };
    const storage = safeJSONStorage(backing);
    await storage.removeItem('key');
    expect(removeItem).toHaveBeenCalledWith('key');

    removeItem.mockRejectedValueOnce(new Error('gone'));
    await expect(storage.removeItem('key')).resolves.toBeUndefined();
  });
});
