// src/store/auditTrailIntegrity.test.ts
// F-0015 / KAV-11 regression gate: SHA-256 hash-chained audit trail with a
// working verifier. Proves the chain is recomputable (the old simpleHash
// never was), that it binds previousValue/newValue, and that mutation,
// deletion (middle / head / tail), and reordering are all detected.

import { describe, it, expect, beforeEach } from 'vitest';

import {
  useAuditTrailStore,
  AUDIT_CHAIN_GENESIS_HASH,
  computeAuditEntryHash,
  canonicalizeForHash,
  type ExtendedAuditEntry,
} from './auditTrailStore';
import { useAuthStore } from './authStore';
import { sha256Hex } from '@/utils/sha256';

// W6-P0-14: seedDemoData is guarded by audit:create — authenticate an
// Admin-scope user for the seed-path test.
function authenticateSeedUser() {
  useAuthStore.setState({
    user: {
      id: 'seed-test-user',
      email: 'seed-test@finplan.local',
      firstName: 'Seed',
      lastName: 'Tester',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'finance',
      departmentName: 'Finance',
      entityId: 'entity-001',
      status: 'Active',
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: false,
      permissions: ['audit:create', 'audit:read'],
    },
    isAuthenticated: true,
  });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const cellId = {
  cube: 'gl',
  coords: { account: '1000' },
  measure: 'value',
  sectorId: 'revenue',
  scenarioId: 'Actual',
  periodId: '2026Q2',
  lineItemId: 'revenue',
};

const input = {
  cellId,
  userId: 'controller@finplan.io',
  operation: 'write' as const,
  dataType: 'number' as const,
  previousValue: 1000,
  newValue: 1100,
};

const resetStore = () =>
  useAuditTrailStore.setState({
    entries: [],
    chainHead: AUDIT_CHAIN_GENESIS_HASH,
    currentUserRole: 'viewer',
  });

const recordThree = (): [string, string, string] => {
  const s = useAuditTrailStore.getState();
  const id1 = s.recordWrite(input);
  const id2 = s.recordUpdate({
    ...input,
    operation: 'update',
    previousValue: 1100,
    newValue: 1200,
  });
  const id3 = s.recordDelete({
    ...input,
    operation: 'delete',
    previousValue: 1200,
    newValue: null,
  });
  return [id1, id2, id3];
};

/** Replace the entries array outside the store API — the attacker's move. */
const attackerSetEntries = (entries: ExtendedAuditEntry[]) =>
  useAuditTrailStore.setState({ entries });

beforeEach(resetStore);

// ---------------------------------------------------------------------------
// Chain construction
// ---------------------------------------------------------------------------

describe('F-0015 chain construction', () => {
  it('first entry chains to the genesis hash and carries a 256-bit digest', () => {
    useAuditTrailStore.getState().recordWrite(input);
    const { entries, chainHead } = useAuditTrailStore.getState();
    expect(entries).toHaveLength(1);
    const entry = entries[0]!;
    expect(entry.prevHash).toBe(AUDIT_CHAIN_GENESIS_HASH);
    expect(entry.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(chainHead).toBe(entry.hash);
  });

  it('hash is recomputable from the STORED record (F-0015 defect #1 root fix)', () => {
    // The old simpleHash covered fresh uid()/now() values, not the stored
    // ones — no verifier could ever recompute it. The new hash must reproduce
    // exactly from the stored fields, including the financial delta.
    useAuditTrailStore.getState().recordWrite(input);
    const entry = useAuditTrailStore.getState().entries[0]!;
    expect(entry.hash).toBe(computeAuditEntryHash(entry));
    expect(entry.id).toMatch(/.+/); // stored id is what the hash covers
  });

  it('binds previousValue and newValue into the digest (financial delta protected)', () => {
    const s = useAuditTrailStore.getState();
    s.recordWrite({ ...input, newValue: 1100 });
    const a = useAuditTrailStore.getState().entries[0]!;
    resetStore();
    s.recordWrite({ ...input, newValue: 1100.01 });
    const b = useAuditTrailStore.getState().entries[0]!;
    // Same logical event except the 1-cent difference → different digest.
    expect(a.hash).not.toBe(b.hash);
  });

  it('each entry links to its predecessor in append order', () => {
    recordThree();
    const { entries, chainHead } = useAuditTrailStore.getState();
    const [e3, e2, e1] = entries; // newest-first
    expect(e1!.prevHash).toBe(AUDIT_CHAIN_GENESIS_HASH);
    expect(e2!.prevHash).toBe(e1!.hash);
    expect(e3!.prevHash).toBe(e2!.hash);
    expect(chainHead).toBe(e3!.hash);
  });

  it('canonicalizeForHash sorts keys recursively (stable recompute across construction order)', () => {
    expect(canonicalizeForHash({ b: 1, a: { d: [3, null], c: 2 } })).toBe(
      '{"a":{"c":2,"d":[3,null]},"b":1}'
    );
  });
});

// ---------------------------------------------------------------------------
// KAV-11: verifier — known answers + tamper detection
// ---------------------------------------------------------------------------

describe('KAV-11 audit chain integrity', () => {
  it('KAV-11.0 known answer: fixed entry hashes to a hand-computed preimage', () => {
    // Canonical preimage constructed BY HAND below; if the serializer or the
    // chaining rule changes, this literal comparison fails loudly.
    const fixed: ExtendedAuditEntry = {
      id: 'entry-0001',
      cellId: { cube: 'gl', coords: { account: '1000' }, measure: 'value' },
      userId: 'controller@finplan.io',
      operation: 'write',
      dataType: 'number',
      previousValue: 1000,
      newValue: 1100,
      approvalStatus: 'auto',
      source: 'manual',
      timestamp: 1770000000000,
      prevHash: AUDIT_CHAIN_GENESIS_HASH,
    };
    const handCanonical =
      '{"approvalStatus":"auto","cellId":{"coords":{"account":"1000"},"cube":"gl","measure":"value"},' +
      '"dataType":"number","id":"entry-0001","newValue":1100,"operation":"write","previousValue":1000,' +
      '"source":"manual","timestamp":1770000000000,"userId":"controller@finplan.io"}';
    const expected = sha256Hex(`${AUDIT_CHAIN_GENESIS_HASH}|${handCanonical}`);
    expect(computeAuditEntryHash(fixed)).toBe(expected);
  });

  it('KAV-11.1 intact chain verifies clean across write/update/delete/bulk/revert', () => {
    const s = useAuditTrailStore.getState();
    recordThree();
    s.recordBulk([
      { ...input, operation: 'bulk', newValue: 2000 },
      { ...input, operation: 'bulk', newValue: 2100 },
    ]);
    s.setCurrentUserRole('admin');
    const revertTarget = useAuditTrailStore.getState().entries[3]!.id;
    s.revertToState(revertTarget);
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v).toEqual({
      valid: true,
      entryCount: 6,
      tamperedEntryIds: [],
      chainBreaks: [],
      headIntact: true,
    });
  });

  it('KAV-11.2 seeded demo data verifies clean (seed path is chained too)', () => {
    authenticateSeedUser();
    useAuditTrailStore.getState().seedDemoData();
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.valid).toBe(true);
    expect(v.entryCount).toBe(50);
  });

  it('KAV-11.3 mutating a stored newValue is detected, links stay intact', () => {
    const [, id2] = recordThree();
    const entries = useAuditTrailStore.getState().entries;
    attackerSetEntries(entries.map((e) => (e.id === id2 ? { ...e, newValue: 999999 } : e)));
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.valid).toBe(false);
    expect(v.tamperedEntryIds).toEqual([id2]);
    expect(v.chainBreaks).toEqual([]);
    expect(v.headIntact).toBe(true);
  });

  it('KAV-11.4 rewriting the stored hash desynchronises the successor link', () => {
    const [, id2, id3] = recordThree();
    const entries = useAuditTrailStore.getState().entries;
    attackerSetEntries(entries.map((e) => (e.id === id2 ? { ...e, hash: 'f'.repeat(64) } : e)));
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.valid).toBe(false);
    expect(v.tamperedEntryIds).toEqual([id2]);
    expect(v.chainBreaks).toHaveLength(1);
    expect(v.chainBreaks[0]!.entryId).toBe(id3);
  });

  it('KAV-11.5 deleting a mid-chain entry is detected at the successor link', () => {
    const [id1, id2, id3] = recordThree();
    const entries = useAuditTrailStore.getState().entries;
    attackerSetEntries(entries.filter((e) => e.id !== id2));
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.valid).toBe(false);
    expect(v.tamperedEntryIds).toEqual([]);
    expect(v.chainBreaks).toHaveLength(1);
    expect(v.chainBreaks[0]!.entryId).toBe(id3);
    expect(v.chainBreaks[0]!.expectedPrevHash).toBe(
      useAuditTrailStore.getState().entries.find((e) => e.id === id1)!.hash
    );
  });

  it('KAV-11.6 truncating the NEWEST entries breaks the head check', () => {
    recordThree();
    const entries = useAuditTrailStore.getState().entries;
    attackerSetEntries(entries.slice(1)); // drop newest (entries[0])
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.valid).toBe(false);
    expect(v.tamperedEntryIds).toEqual([]);
    expect(v.chainBreaks).toEqual([]);
    expect(v.headIntact).toBe(false);
  });

  it('KAV-11.7 deleting the OLDEST entry breaks the genesis link', () => {
    const [id1, id2] = recordThree();
    const entries = useAuditTrailStore.getState().entries;
    attackerSetEntries(entries.filter((e) => e.id !== id1));
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.valid).toBe(false);
    expect(v.chainBreaks).toHaveLength(1);
    expect(v.chainBreaks[0]!.entryId).toBe(id2);
    expect(v.chainBreaks[0]!.expectedPrevHash).toBe(AUDIT_CHAIN_GENESIS_HASH);
  });

  it('KAV-11.8 reordering two entries is detected', () => {
    recordThree();
    const [e3, e2, e1] = useAuditTrailStore.getState().entries;
    attackerSetEntries([e2!, e3!, e1!]); // swap newest and middle
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.valid).toBe(false);
    expect(v.chainBreaks.length).toBeGreaterThan(0);
    expect(v.headIntact).toBe(false);
  });

  it('KAV-11.9 empty trail verifies clean; wiped trail with stale head fails closed', () => {
    expect(useAuditTrailStore.getState().verifyIntegrity().valid).toBe(true);
    recordThree();
    // Attacker wipes the trail but cannot reset chainHead via store API.
    useAuditTrailStore.setState({ entries: [] });
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.valid).toBe(false);
    expect(v.headIntact).toBe(false);
  });

  it('KAV-11.10 legacy entries without hash material are reported as tampered', () => {
    recordThree();
    const entries = useAuditTrailStore.getState().entries;
    attackerSetEntries(
      entries.map((e, i) =>
        i === 1 ? ({ ...e, hash: undefined, prevHash: undefined } as ExtendedAuditEntry) : e
      )
    );
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.valid).toBe(false);
    expect(v.tamperedEntryIds).toHaveLength(1);
  });
});
