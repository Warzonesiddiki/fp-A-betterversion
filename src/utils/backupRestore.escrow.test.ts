/**
 * @vitest-environment jsdom
 *
 * Backup format v3: the key-escrow record is embedded in metadata; v2 files
 * remain fully readable (backward-compat), and restore NEVER auto-installs
 * an escrow record from an untrusted file.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { memSqlJs } = vi.hoisted(() => ({ memSqlJs: new Map<string, unknown>() }));

vi.mock('@/utils/sqlJsStorage', () => ({
  sqlJsStorage: {
    getItem: async (n: string) => (memSqlJs.has(n) ? memSqlJs.get(n) : null),
    setItem: async (n: string, v: unknown) => {
      memSqlJs.set(n, v);
    },
    removeItem: async (n: string) => {
      memSqlJs.delete(n);
    },
  },
}));
vi.mock('@/utils/tauriSqlStorage', () => ({
  tauriSqlStorage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
  isTauri: async () => false,
}));
vi.mock('@/utils/chunkedStorage', () => ({
  wrapChunkedStorage: (s: unknown) => s,
  __resetWorkerAvailabilityForTests: vi.fn(),
}));

import {
  BACKUP_FORMAT_VERSION,
  BackupRestore,
  canonicalJSON,
  computeChecksum,
  type BackupData,
} from './backupRestore';
import { ESCROW_RECORD_ITEM, enrollKeyEscrow } from './keyEscrow';
import { masterStorage } from './masterStorage';

let savedMasterStorageKey: string | undefined;

beforeEach(() => {
  savedMasterStorageKey = process.env.MASTER_STORAGE_KEY;
  delete process.env.MASTER_STORAGE_KEY;
  localStorage.clear();
  memSqlJs.clear();
});

afterEach(() => {
  if (savedMasterStorageKey === undefined) delete process.env.MASTER_STORAGE_KEY;
  else process.env.MASTER_STORAGE_KEY = savedMasterStorageKey;
});

async function makeV2Backup(): Promise<string> {
  const data = { 'gl-store': { state: { rows: [1, 2, 3] }, version: 0 } };
  const checksum = await computeChecksum(canonicalJSON(data));
  return JSON.stringify({
    metadata: {
      formatVersion: 2,
      appVersion: '1.0.0',
      exportedAt: '2026-01-01T00:00:00.000Z',
      storeSizes: {},
      checksum,
    },
    data,
  });
}

describe('BACKUP_FORMAT_VERSION', () => {
  it('is pinned to 3 for the escrow-embedding format', () => {
    expect(BACKUP_FORMAT_VERSION).toBe(3);
  });
});

describe('v3 export embeds the escrow record', () => {
  it('metadata.escrow is null when not enrolled', async () => {
    const backup = await BackupRestore.createBackupData();
    expect(backup.metadata.formatVersion).toBe(3);
    expect(backup.metadata.escrow ?? null).toBeNull();
  });

  it('metadata.escrow carries the enrolled record verbatim', async () => {
    await masterStorage.setItem('gl-store', { state: { rows: ['a'] }, version: 0 });
    await enrollKeyEscrow();

    const backup = await BackupRestore.createBackupData();
    expect(backup.metadata.escrow).not.toBeNull();
    expect(backup.metadata.escrow!.v).toBe(1);
    expect(backup.metadata.escrow!.iter).toBe(600_000);
    expect(backup.metadata.escrow!.wrappedKeyB64.length).toBeGreaterThan(0);
  }, 60_000);

  it('metadata checksum covers DATA only — mutating escrow metadata still restores', async () => {
    await masterStorage.setItem('gl-store', { state: { x: 1 }, version: 0 });
    const backup = await BackupRestore.createBackupData();
    const text = BackupRestore.serialize(backup);

    // Tamper ONLY the escrow metadata block.
    const parsed = JSON.parse(text) as BackupData;
    parsed.metadata.escrow = null;
    const tampered = JSON.stringify(parsed);

    const result = await BackupRestore.restoreFromJSON(tampered);
    expect(result.success).toBe(true);
  });
});

describe('restore compatibility', () => {
  it('reads a legacy v2 backup WITHOUT a version warning', async () => {
    const result = await BackupRestore.restoreFromJSON(await makeV2Backup());
    expect(result.success).toBe(true);
    expect(result.warnings.some((w) => w.includes('format version'))).toBe(false);
  });

  it('warns on unsupported future versions', async () => {
    const text = (await makeV2Backup()).replace('"formatVersion":2', '"formatVersion":99');
    const result = await BackupRestore.restoreFromJSON(text);
    expect(result.warnings.some((w) => w.includes('differs from'))).toBe(true);
  });

  it('v3 + escrow: informational warning only — restore does NOT install the record', async () => {
    await masterStorage.setItem('gl-store', { state: { rows: ['a'] }, version: 0 });
    const { keyId } = await enrollKeyEscrow();
    const backupText = BackupRestore.serialize(await BackupRestore.createBackupData());

    // Simulate a device whose escrow slot is empty (fresh install / reset).
    localStorage.removeItem(ESCROW_RECORD_ITEM);

    const result = await BackupRestore.restoreFromJSON(backupText);
    expect(result.success).toBe(true);
    expect(result.warnings.some((w) => w.includes('key-escrow record') && w.includes(keyId))).toBe(
      true
    );

    // The untrusted file must NOT rebind this device's recovery target.
    expect(localStorage.getItem(ESCROW_RECORD_ITEM)).toBeNull();
  }, 120_000);
});
