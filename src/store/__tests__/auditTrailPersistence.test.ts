/**
 * N-0003 regression suite — the compliance trail must survive.
 *
 * Audit ZCFA-2026-07-29-002 finding N-0003:
 *   `auditTrailStore` was one of only two stores with NO `persist()` wrapper
 *   and was absent from `BACKUP_STORE_KEYS`. Every SOX / SOC 2 / GDPR Art. 30
 *   record therefore evaporated on page reload, and no backup ever contained
 *   the audit trail. That also made the F-0015 SHA-256 chain worthless: an
 *   attacker did not need to forge the chain, they only needed to refresh.
 *
 * These tests pin three things:
 *   1. the store is registered for persistence AND for backup,
 *   2. entries + chainHead round-trip through masterStorage,
 *   3. the restored chain still verifies (integrity survives the round trip).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  useAuditTrailStore,
  AUDIT_CHAIN_GENESIS_HASH,
  type ExtendedAuditEntry,
} from '../auditTrailStore';
import {
  PERSISTED_STORE_KEYS,
  BACKUP_STORE_KEYS,
  BACKUP_EXCLUDED_KEYS,
} from '@/utils/persistedStores';

const AUDIT_KEY = 'audit-trail-store';

const reset = () =>
  useAuditTrailStore.setState({ entries: [], chainHead: AUDIT_CHAIN_GENESIS_HASH } as never);

describe('N-0003: audit trail registration', () => {
  it('is registered as a persisted store', () => {
    expect(PERSISTED_STORE_KEYS).toContain(AUDIT_KEY);
  });

  it('is included in backups (compliance evidence must be recoverable)', () => {
    expect(BACKUP_STORE_KEYS).toContain(AUDIT_KEY);
    expect(BACKUP_EXCLUDED_KEYS).not.toContain(AUDIT_KEY);
  });
});

describe('N-0003: audit trail survives a persistence round trip', () => {
  beforeEach(reset);

  it('serialised state carries entries AND the chain head', () => {
    const s = useAuditTrailStore.getState();
    s.recordWrite({
      entityType: 'journal',
      entityId: 'J1',
      description: 'post 1',
      newValue: { amt: 100 },
    } as never);
    s.recordWrite({
      entityType: 'journal',
      entityId: 'J2',
      description: 'post 2',
      newValue: { amt: 200 },
    } as never);

    const { entries, chainHead } = useAuditTrailStore.getState();
    expect(entries).toHaveLength(2);
    expect(chainHead).not.toBe(AUDIT_CHAIN_GENESIS_HASH);

    // Simulate what the persist middleware writes and reads back.
    const snapshot = JSON.parse(JSON.stringify({ entries, chainHead })) as {
      entries: ExtendedAuditEntry[];
      chainHead: string;
    };

    reset();
    expect(useAuditTrailStore.getState().entries).toHaveLength(0);

    useAuditTrailStore.setState(snapshot as never);

    const rehydrated = useAuditTrailStore.getState();
    expect(rehydrated.entries).toHaveLength(2);
    expect(rehydrated.chainHead).toBe(chainHead);
  });

  it('the integrity chain STILL VERIFIES after rehydration', () => {
    const s = useAuditTrailStore.getState();
    for (let i = 0; i < 5; i++) {
      s.recordWrite({
        entityType: 'journal',
        entityId: `J${i}`,
        description: `post ${i}`,
        newValue: { amt: i * 100 },
      } as never);
    }
    expect(useAuditTrailStore.getState().verifyIntegrity().valid).toBe(true);

    const { entries, chainHead } = useAuditTrailStore.getState();
    const snapshot = JSON.parse(JSON.stringify({ entries, chainHead }));

    reset();
    useAuditTrailStore.setState(snapshot as never);

    const verdict = useAuditTrailStore.getState().verifyIntegrity();
    expect(verdict.valid).toBe(true);
    expect(verdict.entryCount).toBe(5);
    expect(verdict.headIntact).toBe(true);
  });

  it('tampering with a RESTORED trail is still detected', () => {
    const s = useAuditTrailStore.getState();
    s.recordWrite({
      entityType: 'journal',
      entityId: 'J1',
      description: 'original',
      newValue: { amt: 100 },
    } as never);
    s.recordWrite({
      entityType: 'journal',
      entityId: 'J2',
      description: 'second',
      newValue: { amt: 200 },
    } as never);

    const { entries, chainHead } = useAuditTrailStore.getState();
    const snapshot = JSON.parse(JSON.stringify({ entries, chainHead })) as {
      entries: ExtendedAuditEntry[];
      chainHead: string;
    };

    // Attacker edits the backup file before restoring it.
    (snapshot.entries[0] as { newValue: unknown }).newValue = { amt: 999_999 };

    reset();
    useAuditTrailStore.setState(snapshot as never);

    expect(useAuditTrailStore.getState().verifyIntegrity().valid).toBe(false);
  });

  it('an empty restored trail reports the genesis head, not a broken chain', () => {
    reset();
    const verdict = useAuditTrailStore.getState().verifyIntegrity();
    expect(verdict.valid).toBe(true);
    expect(verdict.entryCount).toBe(0);
  });
});
