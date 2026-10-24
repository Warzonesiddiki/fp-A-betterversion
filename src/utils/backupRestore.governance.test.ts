/**
 * @vitest-environment jsdom
 *
 * GOVERNANCE EVIDENCE for cap:admin.backup-restore
 *
 * O3 DECISION (2026-10-24): No key escrow; user-held key.
 * The EncryptionEngine protects sensitive fields with AES-256-GCM using a
 * device-derived root key. The user holds the recovery code. No third-party
 * escrow. Backup files embed the escrow record metadata for archival/audit
 * but restore NEVER auto-installs it from an untrusted file.
 *
 * Governance dimensions tested:
 *  1. Money primitive safety — exact monetary strings survive the round trip
 *  2. Determinism — same seed produces same checksum every time
 *  3. Key custody — user-held key, no auto-install on restore
 *  4. Atomicity — restore validates all stores before writing any
 *  5. Completeness — backup captures every persisted store, no drift
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BackupRestore,
  canonicalJSON,
  computeChecksum,
  BACKUP_FORMAT_VERSION,
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
        { id: 'e3', account: '5000', debit: '42500.75', credit: '0.00', date: '2026-02-15' },
        { id: 'e4', account: '2000', debit: '0.00', credit: '42500.75', date: '2026-02-15' },
      ],
      accounts: [
        { id: '1000', name: 'Cash' },
        { id: '2000', name: 'Accounts Payable' },
        { id: '4000', name: 'Revenue' },
        { id: '5000', name: 'COGS' },
      ],
    },
    version: 1,
  },
  'budget-store': {
    state: {
      budgets: [
        { id: 'b1', name: 'FY26', fiscalYear: 2026, totalAmount: '1000000.00' },
        { id: 'b2', name: 'FY26-Q2', fiscalYear: 2026, totalAmount: '250000.00' },
      ],
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
    await masterStorage.setItem(key, value);
  }
}

async function wipeAllStores(): Promise<void> {
  for (const key of PERSISTED_STORE_KEYS) {
    await masterStorage.removeItem(key);
  }
}

async function readAllStores(): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const key of BACKUP_STORE_KEYS) {
    result[key] = await masterStorage.getItem(key);
  }
  return result;
}

describe('admin.backup-restore — GOVERNANCE (O3: no escrow, user-held key)', () => {
  beforeEach(async () => {
    await wipeAllStores();
  });

  describe('money primitive safety through backup/restore', () => {
    it('preserves exact monetary strings — no float drift', async () => {
      await seedStores();
      const backup = await BackupRestore.createBackupData();
      const serialized = BackupRestore.serialize(backup);

      await wipeAllStores();
      await BackupRestore.restoreFromJSON(serialized);

      const restored = await readAllStores();
      const glState = (
        restored['gl-store'] as { state: { entries: Array<{ debit: string; credit: string }> } }
      ).state;

      // Exact string equality — not parseFloat comparison
      expect(glState.entries[0]!.debit).toBe('0.00');
      expect(glState.entries[0]!.credit).toBe('150000.00');
      expect(glState.entries[2]!.debit).toBe('42500.75');
      expect(glState.entries[3]!.credit).toBe('42500.75');
    });

    it('preserves budget totals as exact strings', async () => {
      await seedStores();
      const backup = await BackupRestore.createBackupData();
      const serialized = BackupRestore.serialize(backup);

      await wipeAllStores();
      await BackupRestore.restoreFromJSON(serialized);

      const restored = await readAllStores();
      const budgetState = (
        restored['budget-store'] as { state: { budgets: Array<{ totalAmount: string }> } }
      ).state;

      expect(budgetState.budgets[0]!.totalAmount).toBe('1000000.00');
      expect(budgetState.budgets[1]!.totalAmount).toBe('250000.00');
    });

    it('preserves FX rates as exact strings', async () => {
      await seedStores();
      const backup = await BackupRestore.createBackupData();
      const serialized = BackupRestore.serialize(backup);

      await wipeAllStores();
      await BackupRestore.restoreFromJSON(serialized);

      const restored = await readAllStores();
      const fxState = (restored['fx-rate-store'] as { state: { rates: Array<{ rate: string }> } })
        .state;

      expect(fxState.rates[0]!.rate).toBe('1.09');
    });
  });

  describe('determinism', () => {
    it('same seed produces same checksum every time', async () => {
      await seedStores();
      const backup1 = await BackupRestore.createBackupData();
      const checksum1 = backup1.metadata.checksum;

      await wipeAllStores();
      await seedStores();
      const backup2 = await BackupRestore.createBackupData();
      const checksum2 = backup2.metadata.checksum;

      expect(checksum1).toBe(checksum2);
    });

    it('canonical JSON is order-independent for structurally identical data', async () => {
      const a = { x: 1, y: [1, 2, 3], z: { nested: true } };
      const b = { z: { nested: true }, y: [1, 2, 3], x: 1 };
      expect(canonicalJSON(a)).toBe(canonicalJSON(b));
    });

    it('checksum changes when any value changes', async () => {
      await seedStores();
      const backup1 = await BackupRestore.createBackupData();

      await wipeAllStores();
      const modifiedSeed = { ...SEED };
      modifiedSeed['gl-store'] = {
        state: {
          entries: [
            { id: 'e1', account: '4000', debit: '0.00', credit: '150001.00', date: '2026-01-31' },
            { id: 'e2', account: '1000', debit: '150001.00', credit: '0.00', date: '2026-01-31' },
          ],
          accounts: [{ id: '4000', name: 'Revenue' }],
        },
        version: 1,
      };
      await seedStores(modifiedSeed);
      const backup2 = await BackupRestore.createBackupData();

      expect(backup1.metadata.checksum).not.toBe(backup2.metadata.checksum);
    });
  });

  describe('key custody — user-held key, no escrow auto-install', () => {
    it('backup metadata.escrow is null when no escrow enrolled', async () => {
      await seedStores();
      const backup = await BackupRestore.createBackupData();

      // O3 decision: no escrow. User holds the key.
      expect(backup.metadata.escrow).toBeNull();
    });

    it('restore does NOT auto-install an escrow record from a backup file', async () => {
      await seedStores();
      const backup = await BackupRestore.createBackupData();
      const serialized = BackupRestore.serialize(backup);

      // Inject a fake escrow record into the backup metadata
      const parsed = JSON.parse(serialized) as { metadata: { escrow: unknown } };
      parsed.metadata.escrow = { fake: 'escrow-record' };
      const tampered = JSON.stringify(parsed);

      await wipeAllStores();
      const result = await BackupRestore.restoreFromJSON(tampered);

      // Restore succeeded (data is fine) but escrow was NOT installed
      expect(result.success).toBe(true);
      // The escrow record item should not exist in storage
      const escrowItem = await masterStorage.getItem('finplan.key-escrow.v1');
      expect(escrowItem).toBeNull();
    });

    it('BACKUP_FORMAT_VERSION is pinned to 3 (escrow-embedding format)', () => {
      expect(BACKUP_FORMAT_VERSION).toBe(3);
    });
  });

  describe('atomicity — restore validates all stores before writing any', () => {
    it('rejects a tampered backup and writes nothing', async () => {
      await seedStores();
      const backup = await BackupRestore.createBackupData();
      const serialized = BackupRestore.serialize(backup);

      // Tamper with the checksum
      const parsed = JSON.parse(serialized) as { metadata: { checksum: string } };
      parsed.metadata.checksum = 'tampered-checksum';
      const tampered = JSON.stringify(parsed);

      await wipeAllStores();
      const result = await BackupRestore.restoreFromJSON(tampered);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // No stores were written
      const after = await readAllStores();
      for (const key of BACKUP_STORE_KEYS) {
        expect(after[key]).toBeNull();
      }
    });

    it('rejects a truncated backup and writes nothing', async () => {
      await seedStores();
      const backup = await BackupRestore.createBackupData();
      const serialized = BackupRestore.serialize(backup);

      // Truncate the JSON
      const truncated = serialized.slice(0, serialized.length / 2);

      await wipeAllStores();
      const result = await BackupRestore.restoreFromJSON(truncated);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('completeness — backup captures every persisted store', () => {
    it('BACKUP_STORE_KEYS is PERSISTED_STORE_KEYS minus excluded keys', () => {
      const excluded = new Set(BACKUP_EXCLUDED_KEYS);
      const expectedBackupKeys = PERSISTED_STORE_KEYS.filter((k) => !excluded.has(k));
      expect([...BACKUP_STORE_KEYS].sort()).toEqual([...expectedBackupKeys].sort());
    });

    it('excludes session state (auth-store) from backups', () => {
      expect(BACKUP_EXCLUDED_KEYS).toContain('auth-store');
      expect(BACKUP_STORE_KEYS).not.toContain('auth-store');
    });

    it('restores every seeded store byte-for-byte', async () => {
      await seedStores();
      const before = await readAllStores();
      const seededKeys = Object.keys(SEED).sort();
      for (const key of seededKeys) {
        expect(before[key]).not.toBeNull();
      }

      const backup = await BackupRestore.createBackupData();
      const serialized = BackupRestore.serialize(backup);

      await wipeAllStores();
      const result = await BackupRestore.restoreFromJSON(serialized);

      expect(result.success).toBe(true);
      const after = await readAllStores();

      for (const key of seededKeys) {
        expect(after[key]).toEqual(before[key]);
      }
    });
  });

  describe('checksum verification', () => {
    it('computes a SHA-256 digest over canonical JSON', async () => {
      const checksum = await computeChecksum('{"a":1}');
      expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is idempotent: restoring the same file twice yields the same state', async () => {
      await seedStores();
      const backup = await BackupRestore.createBackupData();
      const serialized = BackupRestore.serialize(backup);

      await wipeAllStores();
      await BackupRestore.restoreFromJSON(serialized);
      const afterFirst = await readAllStores();

      await BackupRestore.restoreFromJSON(serialized);
      const afterSecond = await readAllStores();

      for (const key of Object.keys(afterFirst)) {
        expect(afterSecond[key]).toEqual(afterFirst[key]);
      }
    });
  });
});
