/**
 * @vitest-environment jsdom
 *
 * F-0010 / KAV-12 — backup and restore must be PROVEN, not documented.
 *
 * The audit's requirement is explicit: "seed data -> backup -> wipe -> restore
 * -> deep-equal all stores", with checksum verification, completing in bounded
 * time. The previous suite mocked IndexedDB and asserted call shapes, so it
 * could not have detected that backups were reading a database the application
 * never writes to.
 *
 * These tests exercise the REAL masterStorage path (sql.js mock backend from
 * src/test/setup.ts, the same one the stores use), so a backup that misses the
 * application's data fails here.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  BackupRestore,
  canonicalJSON,
  computeChecksum,
  BACKUP_FORMAT_VERSION,
  createRawEmergencyBackup,
  downloadRawEmergencyBackup,
} from './backupRestore';
import { PERSISTED_STORE_KEYS, BACKUP_STORE_KEYS, BACKUP_EXCLUDED_KEYS } from './persistedStores';
import { masterStorage } from './masterStorage';

/** Realistic financial fixtures — money as strings, per docs/architecture/money.md. */
const SEED: Record<string, unknown> = {
  'gl-store': {
    state: {
      entries: [
        { id: 'e1', account: '4000', debit: '0.00', credit: '150000.00', date: '2026-01-31' },
        { id: 'e2', account: '1000', debit: '150000.00', credit: '0.00', date: '2026-01-31' },
      ],
      accounts: [{ id: '4000', name: 'Revenue' }],
    },
    version: 1,
  },
  'budget-store': {
    state: {
      budgets: [{ id: 'b1', name: 'FY26', fiscalYear: 2026, totalAmount: '1000000.00' }],
    },
    version: 1,
  },
  'entity-store': {
    state: { entities: [{ id: 'ent-1', name: 'Parent', currency: 'USD', ownership: 100 }] },
    version: 1,
  },
  'fx-rate-store': {
    state: { rates: [{ from: 'EUR', to: 'USD', date: '2026-03-31', rate: '1.09' }] },
    version: 1,
  },
  'scenario-store': { state: { scenarios: [{ id: 's1', name: 'Base' }] }, version: 1 },
};

async function seedStores(seed: Record<string, unknown> = SEED): Promise<void> {
  for (const [key, value] of Object.entries(seed)) {
    await (masterStorage.setItem as (k: string, v: unknown) => Promise<void>)(key, value);
  }
}

async function wipeAllStores(): Promise<void> {
  for (const key of PERSISTED_STORE_KEYS) {
    await masterStorage.removeItem(key);
  }
}

async function readAllStores(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const key of BACKUP_STORE_KEYS) {
    const value = await masterStorage.getItem(key);
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

describe('F-0010 backup/restore', () => {
  beforeEach(async () => {
    await wipeAllStores();
  });

  describe('store registry cannot drift from the real persist() calls', () => {
    it('registers exactly the store keys used by zustand persist in src/store', () => {
      // Reading the source is deliberate: a hand-maintained list is only safe
      // if something fails when a new persisted store is added and forgotten.
      // A store missing here would be silently absent from every user backup.
      const storeDir = join(process.cwd(), 'src', 'store');
      const discovered = new Set<string>();
      for (const file of readdirSync(storeDir)) {
        if (!file.endsWith('.ts') || file.includes('.test.')) continue;
        const source = readFileSync(join(storeDir, file), 'utf8');
        for (const match of source.matchAll(/name:\s*'([a-z0-9-]+-(?:store|storage))'/g)) {
          discovered.add(match[1]!);
        }
      }

      expect(discovered.size, 'the scanner must find persisted stores').toBeGreaterThan(30);
      expect([...discovered].sort()).toEqual([...PERSISTED_STORE_KEYS].sort());
    });

    it('excludes session state from backups', () => {
      expect(BACKUP_EXCLUDED_KEYS).toContain('auth-store');
      expect(BACKUP_STORE_KEYS).not.toContain('auth-store');
    });
  });

  describe('KAV-12: seed -> backup -> wipe -> restore -> deep-equal', () => {
    it('restores every seeded store byte-for-byte', async () => {
      await seedStores();
      const before = await readAllStores();
      expect(Object.keys(before).sort()).toEqual(Object.keys(SEED).sort());

      const backup = await BackupRestore.createBackupData();
      const serialized = BackupRestore.serialize(backup);

      await wipeAllStores();
      const wiped = await readAllStores();
      expect(wiped, 'the wipe must actually remove data').toEqual({});

      const result = await BackupRestore.restoreFromJSON(serialized);
      expect(result.errors).toEqual([]);
      expect(result.success).toBe(true);
      expect(result.restoredStores.sort()).toEqual(Object.keys(SEED).sort());

      const after = await readAllStores();
      expect(after).toEqual(before);
    });

    it('preserves exact monetary strings through the round trip', async () => {
      await seedStores();
      const serialized = BackupRestore.serialize(await BackupRestore.createBackupData());
      await wipeAllStores();
      await BackupRestore.restoreFromJSON(serialized);

      // masterStorage.getItem returns the deserialized envelope object (zustand
      // persist v5 reads `.state` directly), so assert on the fields directly.
      const raw = await masterStorage.getItem('gl-store');
      const gl = raw as {
        state: { entries: Array<{ credit: string; debit: string }> };
      };
      expect(gl.state.entries[0]!.credit).toBe('150000.00');
      expect(gl.state.entries[1]!.debit).toBe('150000.00');
    });

    it('completes well inside the 15 second budget', async () => {
      await seedStores();
      const started = Date.now();
      const serialized = BackupRestore.serialize(await BackupRestore.createBackupData());
      await wipeAllStores();
      await BackupRestore.restoreFromJSON(serialized);
      expect(Date.now() - started).toBeLessThan(15000);
    });

    it('round-trips a large ledger without truncation', async () => {
      const entries = Array.from({ length: 5000 }, (_, i) => ({
        id: `e${i}`,
        account: '4000',
        debit: '0.00',
        credit: `${i}.05`,
        memo: 'bulk import row',
      }));
      await (masterStorage.setItem as (k: string, v: unknown) => Promise<void>)('gl-store', {
        state: { entries },
        version: 1,
      });

      const serialized = BackupRestore.serialize(await BackupRestore.createBackupData());
      await wipeAllStores();
      const result = await BackupRestore.restoreFromJSON(serialized);
      expect(result.success).toBe(true);

      const restored = (await masterStorage.getItem('gl-store')) as {
        state: { entries: unknown[] };
      };
      expect(restored.state.entries).toHaveLength(5000);
      expect(restored.state.entries[4999]).toEqual(entries[4999]);
    });

    it('is idempotent: restoring the same file twice yields the same state', async () => {
      await seedStores();
      const serialized = BackupRestore.serialize(await BackupRestore.createBackupData());
      await wipeAllStores();

      await BackupRestore.restoreFromJSON(serialized);
      const first = await readAllStores();
      await BackupRestore.restoreFromJSON(serialized);
      const second = await readAllStores();

      expect(second).toEqual(first);
    });
  });

  describe('checksum verification', () => {
    it('computes a SHA-256 digest over canonical JSON', async () => {
      const checksum = await computeChecksum(canonicalJSON({ a: 1 }));
      expect(checksum).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is order-independent for structurally identical data', async () => {
      // Insertion order must not change the digest, or a valid backup could be
      // rejected as corrupt.
      const a = await computeChecksum(canonicalJSON({ x: 1, y: { p: 1, q: 2 } }));
      const b = await computeChecksum(canonicalJSON({ y: { q: 2, p: 1 }, x: 1 }));
      expect(a).toBe(b);
    });

    it('changes when any value changes', async () => {
      const a = await computeChecksum(canonicalJSON({ total: '100.00' }));
      const b = await computeChecksum(canonicalJSON({ total: '100.01' }));
      expect(a).not.toBe(b);
    });

    it('rejects a tampered backup and writes nothing', async () => {
      await seedStores();
      const backup = await BackupRestore.createBackupData();

      // Alter a monetary value while keeping the original checksum. Backup
      // payloads are the deserialized persist envelopes (objects), so tamper
      // inside the nested state — exactly what an attacker editing the backup
      // file would do.
      const tampered = JSON.parse(BackupRestore.serialize(backup)) as typeof backup;
      const budgetStore = tampered.data['budget-store'] as {
        state: { budgets: Array<{ totalAmount: string }> };
      };
      budgetStore.state.budgets[0]!.totalAmount = '9999999.00';
      expect(budgetStore.state.budgets[0]!.totalAmount).toBe('9999999.00');

      await wipeAllStores();
      const result = await BackupRestore.restoreFromJSON(JSON.stringify(tampered));

      expect(result.success).toBe(false);
      expect(result.errors[0]).toMatch(/checksum mismatch/i);
      expect(result.restoredStores).toEqual([]);
      expect(await readAllStores(), 'a rejected restore must not write').toEqual({});
    });

    it('rejects a truncated backup', async () => {
      await seedStores();
      const backup = await BackupRestore.createBackupData();
      const truncated = JSON.parse(BackupRestore.serialize(backup)) as typeof backup;
      delete truncated.data['gl-store'];

      await wipeAllStores();
      const result = await BackupRestore.restoreFromJSON(JSON.stringify(truncated));

      expect(result.success).toBe(false);
      expect(result.errors[0]).toMatch(/checksum mismatch/i);
      expect(await readAllStores()).toEqual({});
    });
  });

  describe('malformed input', () => {
    it('reports invalid JSON without throwing', async () => {
      const result = await BackupRestore.restoreFromJSON('not json at all');
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Failed to parse backup');
    });

    it('reports a missing metadata/data envelope', async () => {
      const result = await BackupRestore.restoreFromJSON('{}');
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid backup format');
    });

    it('skips unknown stores with a warning instead of failing', async () => {
      const data = { 'not-a-real-store': { state: {} } };
      const payload = {
        metadata: {
          formatVersion: BACKUP_FORMAT_VERSION,
          appVersion: '1.0.0',
          exportedAt: new Date().toISOString(),
          storeSizes: {},
          checksum: await computeChecksum(canonicalJSON(data)),
        },
        data,
      };

      const result = await BackupRestore.restoreFromJSON(JSON.stringify(payload));
      expect(result.success).toBe(true);
      expect(result.skippedStores).toContain('not-a-real-store');
      expect(result.warnings.join(' ')).toMatch(/unknown store/i);
    });

    it('never restores session state even if a file contains it', async () => {
      const data = { 'auth-store': { state: { user: { role: 'Admin' } } } };
      const payload = {
        metadata: {
          formatVersion: BACKUP_FORMAT_VERSION,
          appVersion: '1.0.0',
          exportedAt: new Date().toISOString(),
          storeSizes: {},
          checksum: await computeChecksum(canonicalJSON(data)),
        },
        data,
      };

      const result = await BackupRestore.restoreFromJSON(JSON.stringify(payload));
      expect(result.skippedStores).toContain('auth-store');
      expect(await masterStorage.getItem('auth-store')).toBeNull();
    });
  });

  describe('write failures are surfaced, never swallowed', () => {
    it('reports a storage write failure during restore', async () => {
      await seedStores();
      const serialized = BackupRestore.serialize(await BackupRestore.createBackupData());
      await wipeAllStores();

      const spy = vi
        .spyOn(masterStorage, 'setItem')
        .mockRejectedValue(new Error('QuotaExceededError'));
      try {
        const result = await BackupRestore.restoreFromJSON(serialized);
        expect(result.success).toBe(false);
        expect(result.errors.join(' ')).toMatch(/Failed to restore/);
        expect(result.errors.join(' ')).toMatch(/QuotaExceeded/);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('integrity report', () => {
    it('lists populated and empty stores from the live backend', async () => {
      await seedStores();
      const report = await BackupRestore.checkIntegrity();

      expect(report.ok).toBe(true);
      expect(report.populatedStores.sort()).toEqual(Object.keys(SEED).sort());
      expect(report.emptyStores).not.toContain('gl-store');
      expect(report.emptyStores.length).toBeGreaterThan(0);
    });

    it('warns when there is nothing to back up', async () => {
      const report = await BackupRestore.checkIntegrity();
      expect(report.populatedStores).toEqual([]);
      expect(report.warnings.join(' ')).toMatch(/would be empty/i);
    });
  });

  describe('F-B4-11 raw emergency dump', () => {
    it('emits the emergency envelope with raw localStorage entries and no masterStorage reads', async () => {
      localStorage.setItem('finplan-sqljs-db', 'AAAAc3FsaXRlYmFzZTY0==');
      localStorage.setItem('finplan.storage-key.v1', 'ZGV2aWNla2V5');
      localStorage.setItem('legacy-store-key', '{"old":true}');
      const getItemSpy = vi.spyOn(masterStorage, 'getItem');

      try {
        const dump = await createRawEmergencyBackup();

        expect(dump.kind).toBe('finplan-emergency-dump');
        expect(dump.version).toBe(1);
        expect(new Date(dump.capturedAt).toString()).not.toBe('Invalid Date');

        const byKey = new Map(dump.entries.map((e) => [e.key, e.value]));
        // Raw bytes, not decrypted/parsed persist envelopes.
        expect(byKey.get('finplan-sqljs-db')).toBe('AAAAc3FsaXRlYmFzZTY0==');
        expect(byKey.get('finplan.storage-key.v1')).toBe('ZGV2aWNla2V5');
        expect(byKey.get('legacy-store-key')).toBe('{"old":true}');

        expect(getItemSpy, 'the dump must bypass masterStorage entirely').not.toHaveBeenCalled();
        expect(dump.errors).toEqual([]);
      } finally {
        getItemSpy.mockRestore();
        localStorage.removeItem('finplan-sqljs-db');
        localStorage.removeItem('finplan.storage-key.v1');
        localStorage.removeItem('legacy-store-key');
      }
    });

    it('collects per-key errors instead of throwing when a key is unreadable', async () => {
      localStorage.setItem('bad-key', 'unreachable');
      const getItemSpy = vi.spyOn(localStorage, 'getItem').mockImplementation((key: string) => {
        if (key === 'bad-key') throw new Error('permission denied');
        return null;
      });

      try {
        const dump = await createRawEmergencyBackup();

        expect(dump.errors.some((message) => /"bad-key".*permission denied/.test(message))).toBe(
          true
        );
        expect(dump.kind).toBe('finplan-emergency-dump');
      } finally {
        getItemSpy.mockRestore();
        localStorage.removeItem('bad-key');
      }
    });

    it('falls back to collected errors for the desktop SQLite backend while keeping raw entries', async () => {
      localStorage.setItem('finplan.storage-key.v1', 'ZGV2aWNla2V5');
      // Tauri v2 contract key (see isTauriRuntime) — the stale legacy
      // '__TAURI_INTERNALS' spelling silently stopped enabling Tauri mode.
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};

      try {
        const dump = await createRawEmergencyBackup();

        expect(dump.errors.some((message) => /Failed to read SQLite store/.test(message))).toBe(
          true
        );
        // Best-effort: the localStorage side of the dump still completed.
        expect(dump.entries.map((e) => e.key)).toContain('finplan.storage-key.v1');
      } finally {
        delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
        localStorage.removeItem('finplan.storage-key.v1');
      }
    });

    it('downloads the dump through a blob anchor like a regular backup export', async () => {
      const originalCreate = URL.createObjectURL;
      const originalRevoke = URL.revokeObjectURL;
      const createObjectURL = vi.fn(() => 'blob:emergency-dump');
      const revokeObjectURL = vi.fn();
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: createObjectURL,
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: revokeObjectURL,
      });
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      try {
        const dump = await downloadRawEmergencyBackup();

        expect(dump.kind).toBe('finplan-emergency-dump');
        expect(createObjectURL).toHaveBeenCalledTimes(1);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:emergency-dump');
        expect(clickSpy).toHaveBeenCalledTimes(1);
        const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
        expect(anchor.download).toMatch(/^finplan-emergency-dump-\d{4}-\d{2}-\d{2}\.json$/);
        expect(anchor.href).toBe('blob:emergency-dump');
      } finally {
        clickSpy.mockRestore();
        Object.defineProperty(URL, 'createObjectURL', {
          configurable: true,
          writable: true,
          value: originalCreate,
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
          configurable: true,
          writable: true,
          value: originalRevoke,
        });
      }
    });
  });
});
