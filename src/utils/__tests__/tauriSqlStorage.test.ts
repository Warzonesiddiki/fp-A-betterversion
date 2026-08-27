import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

const WINDOW_ANY = window as unknown as Record<string, unknown>;

function enableTauriRuntime(): void {
  WINDOW_ANY.__TAURI_INTERNALS__ = {};
}

function disableTauriRuntime(): void {
  delete WINDOW_ANY.__TAURI__;
  delete WINDOW_ANY.__TAURI_INTERNALS__;
}

afterEach(() => {
  disableTauriRuntime();
  vi.clearAllMocks();
});

describe('isTauri', () => {
  it('returns false in test environment', async () => {
    disableTauriRuntime();
    expect(await isTauri()).toBe(false);
  });

  it('returns true when __TAURI_INTERNALS__ is present (Tauri v2)', async () => {
    enableTauriRuntime();
    expect(await isTauri()).toBe(true);
  });

  // Regression (lane B11 P0): pins the literal Tauri v2 contract. The legacy
  // `__TAURI__` key only exists with withGlobalTauri:true, which
  // tauri.conf.json does not set — it must NOT enable Tauri mode, otherwise
  // packaged desktop builds route stores to localStorage instead of SQLite.
  it('does NOT treat legacy __TAURI__ alone as a Tauri runtime', async () => {
    disableTauriRuntime();
    WINDOW_ANY.__TAURI__ = true;
    expect(await isTauri()).toBe(false);
    await expect(tauriSqlStorage.getItem('test-key')).resolves.toBeNull();
    expect(mockDb.select).not.toHaveBeenCalled();
  });
});

// F-05 browser-beta contract: outside a Tauri runtime the storage is a
// no-op — it never touches @tauri-apps/plugin-sql and never throws.
describe('tauriSqlStorage (non-Tauri browser)', () => {
  beforeEach(() => {
    disableTauriRuntime();
  });

  it('getItem is a no-op returning null without touching the plugin', async () => {
    const value = await tauriSqlStorage.getItem('test-key');
    expect(value).toBeNull();
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it('setItem and removeItem are no-ops in a browser', async () => {
    await expect(tauriSqlStorage.setItem('test-key', { state: 1 })).resolves.toBeUndefined();
    await expect(tauriSqlStorage.removeItem('test-key')).resolves.toBeUndefined();
    expect(mockDb.execute).not.toHaveBeenCalled();
  });
});

describe('tauriSqlStorage (Tauri runtime)', () => {
  beforeEach(() => {
    enableTauriRuntime();
  });

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
});
