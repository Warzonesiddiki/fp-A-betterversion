import { describe, it, expect } from 'vitest';
import {
  AuditTrailEngine,
  type AuditEntry,
  type AuditAction,
  type EntityType,
} from './AuditTrailEngine';

// =============================================================================
// TEST HELPERS
// =============================================================================

function makeEntry(
  overrides: Partial<AuditEntry> = {},
  index: number = 0,
  prevHash: string = '00000000'
): AuditEntry {
  const id = overrides.id ?? 'e' + index;
  const entry = AuditTrailEngine.createEntry({
    id,
    timestamp: overrides.timestamp ?? '2026-06-15T10:00:0' + index + 'Z',
    action: overrides.action ?? 'create',
    entityType: overrides.entityType ?? 'account',
    entityId: overrides.entityId ?? 'acc-1',
    userId: overrides.userId ?? 'user-1',
    userName: overrides.userName ?? 'Alice',
    prevHash,
    details: overrides.details ?? {},
    ipAddress: overrides.ipAddress ?? '127.0.0.1',
  });
  return entry;
}

function makeChain(count: number): AuditEntry[] {
  const chain: AuditEntry[] = [];
  for (let i = 0; i < count; i++) {
    const prev = chain[i - 1]?.hash ?? '00000000';
    chain.push(makeEntry({ id: 'e' + i }, i, prev));
  }
  return chain;
}

// =============================================================================
// TESTS (15 tests, ≥10 minimum per Leader spec)
// =============================================================================

describe('AuditTrailEngine', () => {
  it('1. computeEntryHash is deterministic', () => {
    const e = {
      id: 'a',
      timestamp: '2026-01-01T00:00:00Z',
      action: 'create' as AuditAction,
      entityType: 'account' as EntityType,
      entityId: '1',
      userId: 'u',
      userName: 'U',
      prevHash: '00000000',
      details: {},
      ipAddress: '127.0.0.1',
    };
    const h1 = AuditTrailEngine.computeEntryHash(e);
    const h2 = AuditTrailEngine.computeEntryHash(e);
    expect(h1).toBe(h2);
  });

  it('2. createEntry links to prevHash and computes its own hash', () => {
    const e = makeEntry({ id: 'a' }, 0, '00000000');
    expect(e.prevHash).toBe('00000000');
    expect(e.hash).not.toBe('00000000');
    expect(e.hash).toHaveLength(8);
  });

  it('3. verifyChain returns tampered=false for valid chain', () => {
    const chain = makeChain(5);
    const r = AuditTrailEngine.verifyChain(chain);
    expect(r.tampered).toBe(false);
    expect(r.tamperedEntries).toEqual([]);
  });

  it('4. verifyChain detects broken chain link', () => {
    const chain = makeChain(3);
    // Tamper: change the prevHash of entry 2
    const broken: AuditEntry = { ...chain[2], prevHash: 'deadbeef' };
    const tamperedChain = [chain[0], chain[1], broken];
    const r = AuditTrailEngine.verifyChain(tamperedChain);
    expect(r.tampered).toBe(true);
    expect(r.brokenChains.length).toBe(1);
  });

  it('5. verifyChain detects tampered entry hash', () => {
    const chain = makeChain(3);
    // Tamper: change details of entry 1 (hash will be different but prevHash still links)
    const tampered: AuditEntry = { ...chain[1], details: { tampered: true } };
    const r = AuditTrailEngine.verifyChain([chain[0], tampered, chain[2]]);
    expect(r.tampered).toBe(true);
    expect(r.tamperedEntries).toContain('e1');
  });

  it('6. buildMerkleRoot is deterministic for same input', () => {
    const chain = makeChain(4);
    const r1 = AuditTrailEngine.buildMerkleRoot(chain);
    const r2 = AuditTrailEngine.buildMerkleRoot(chain);
    expect(r1).toBe(r2);
  });

  it('7. buildMerkleRoot handles odd-length chain (duplicate last)', () => {
    const chain = makeChain(3);
    const root = AuditTrailEngine.buildMerkleRoot(chain);
    expect(root).toHaveLength(8);
  });

  it('8. buildMerkleRoot returns "00000000" for empty chain', () => {
    expect(AuditTrailEngine.buildMerkleRoot([])).toBe('00000000');
  });

  it('9. generateMerkleProof returns null for missing entry', () => {
    const chain = makeChain(3);
    expect(AuditTrailEngine.generateMerkleProof(chain, 'nonexistent')).toBeNull();
  });

  it('10. generateMerkleProof and verifyMerkleProof round-trip', () => {
    const chain = makeChain(8);
    for (const e of chain) {
      const proof = AuditTrailEngine.generateMerkleProof(chain, e.id);
      expect(proof).not.toBeNull();
      expect(AuditTrailEngine.verifyMerkleProof(proof!)).toBe(true);
    }
  });

  it('11. query filters by entityId', () => {
    const chain = [
      makeEntry({ id: 'a', entityId: '1' }),
      makeEntry({ id: 'b', entityId: '2' }),
      makeEntry({ id: 'c', entityId: '1' }),
    ];
    const r = AuditTrailEngine.query(chain, { entityId: '1' });
    expect(r.length).toBe(2);
    expect(r.map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('12. queryByUser filters by userId', () => {
    const chain = [makeEntry({ id: 'a', userId: 'alice' }), makeEntry({ id: 'b', userId: 'bob' })];
    const r = AuditTrailEngine.queryByUser(chain, 'alice');
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('a');
  });

  it('13. queryByAction filters by action', () => {
    const chain = [
      makeEntry({ id: 'a', action: 'create' }),
      makeEntry({ id: 'b', action: 'delete' }),
      makeEntry({ id: 'c', action: 'create' }),
    ];
    const r = AuditTrailEngine.queryByAction(chain, 'delete');
    expect(r.length).toBe(1);
  });

  it('14. exportForSOX returns summary with merkle root and verification', () => {
    const chain = makeChain(5);
    const r = AuditTrailEngine.exportForSOX(chain, '2026-06-15T00:00:00Z', '2026-06-15T23:59:59Z');
    expect(r.totalEntries).toBe(5);
    expect(r.merkleRoot).toHaveLength(8);
    expect(r.chainVerified).toBe(true);
    expect(r.entriesByAction.create).toBe(5);
  });

  it('15. summarizeByEntityType counts by type', () => {
    const chain = [
      makeEntry({ id: 'a', entityType: 'account' }),
      makeEntry({ id: 'b', entityType: 'budget' }),
      makeEntry({ id: 'c', entityType: 'account' }),
    ];
    const r = AuditTrailEngine.summarizeByEntityType(chain);
    expect(r.account).toBe(2);
    expect(r.budget).toBe(1);
  });
});
