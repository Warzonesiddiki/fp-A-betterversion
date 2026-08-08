// =============================================================================
// auditTrailStore — branch coverage sweep
//
// Covers the store actions the main suite leaves untouched: recordUpdate /
// recordDelete / recordRead / recordBulk, pagination/selection actions,
// revertToState RBAC gate (allowed + denied + missing entry), refreshEntries,
// filterByGdprAccess, verifyIntegrity edge cases (missing hash, link break,
// head truncation) and export paths with PII redaction.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enableMapSet } from 'immer';
import {
  useAuditTrailStore,
  redactPII,
  GDPR_AUDIT_VIEW_ROLES,
  canonicalizeForHash,
  computeAuditEntryHash,
  selectCanViewGdprAudit,
  AUDIT_CHAIN_GENESIS_HASH,
} from './auditTrailStore';
import type { ExtendedAuditEntry } from '@/types/audit';

enableMapSet();

vi.mock('@/utils/masterStorage', () => ({
  masterStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
}));

let idCounter = 0;
vi.mock('@/utils/cryptoId', () => ({
  randomId: (prefix = 'id') => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  },
}));
vi.mock('@/utils/sha256', () => ({
  sha256Hex: (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
    const hex = (h >>> 0).toString(16).padStart(8, '0');
    return hex.repeat(8);
  },
}));
vi.mock('@/utils/spreadsheetSanitize', () => ({
  sanitizeSpreadsheetText: (s: unknown) => (typeof s === 'string' ? s : s),
}));

describe('auditTrailStore — branch sweep', () => {
  beforeEach(() => {
    idCounter = 0;
    useAuditTrailStore.setState({
      entries: [],
      filters: { userId: null, operation: null, source: null, severity: null },
      currentPage: 1,
      pageSize: 25,
      sortField: 'timestamp',
      sortDir: 'desc',
      selectedEntryId: null,
      loading: false,
      currentUserRole: 'admin',
      chainHead: AUDIT_CHAIN_GENESIS_HASH,
    });
  });

  const baseInput = (overrides: Record<string, unknown> = {}) => ({
    cellId: { sheetId: 's1', row: 0, col: 0 },
    userId: 'u1',
    operation: 'write' as const,
    dataType: 'number' as const,
    newValue: 1,
    previousValue: null,
    ...overrides,
  });

  it('recordUpdate / recordDelete / recordRead append chained entries', () => {
    const store = useAuditTrailStore.getState();
    const upd = store.recordUpdate(
      baseInput({ operation: 'update', previousValue: 1, newValue: 2 })
    );
    const del = store.recordDelete(
      baseInput({ operation: 'delete', previousValue: 2, newValue: null })
    );
    const read = store.recordRead(baseInput({ operation: 'read' }));

    const entries = useAuditTrailStore.getState().entries;
    expect(entries).toHaveLength(3);
    // newest first
    expect(entries.map((e) => e.id)).toEqual([read, del, upd]);
    expect(entries[0]!.operation).toBe('read');
    expect(entries[1]!.operation).toBe('delete');
    expect(entries[2]!.operation).toBe('update');
    // chained: newest links to the previous entry's hash
    expect(entries[0]!.prevHash).toBe(entries[1]!.hash);
    expect(entries[1]!.prevHash).toBe(entries[2]!.hash);
  });

  it('recordBulk shares a transactionId across a batch and chains each entry', () => {
    const store = useAuditTrailStore.getState();
    const ids = store.recordBulk([
      baseInput({ operation: 'write', newValue: 10 }),
      baseInput({ operation: 'write', newValue: 20 }),
    ]);
    expect(ids).toHaveLength(2);

    const entries = useAuditTrailStore.getState().entries;
    expect(entries).toHaveLength(2);
    const txIds = new Set(entries.map((e) => e.metadata?.transactionId));
    expect(txIds.size).toBe(1);
    expect(entries[0]!.prevHash).toBe(entries[1]!.hash);
  });

  it('setPage / setPageSize / selectEntry update UI state', () => {
    const store = useAuditTrailStore.getState();
    store.setPage(3);
    expect(useAuditTrailStore.getState().currentPage).toBe(3);

    store.setPageSize(100);
    expect(useAuditTrailStore.getState().pageSize).toBe(100);
    expect(useAuditTrailStore.getState().currentPage).toBe(1);

    store.selectEntry('abc');
    expect(useAuditTrailStore.getState().selectedEntryId).toBe('abc');
    store.selectEntry(null);
    expect(useAuditTrailStore.getState().selectedEntryId).toBeNull();
  });

  it('revertToState is denied for non-privileged roles', () => {
    useAuditTrailStore.getState().setCurrentUserRole('analyst');
    expect(() => useAuditTrailStore.getState().revertToState('anything')).toThrow(
      /insufficient role/
    );
  });

  it('revertToState appends a chained revert entry for an existing entry', () => {
    const store = useAuditTrailStore.getState();
    const id = store.recordUpdate(baseInput({ previousValue: 1, newValue: 2 }));

    useAuditTrailStore.getState().revertToState(id);

    const entries = useAuditTrailStore.getState().entries;
    expect(entries).toHaveLength(2);
    const revert = entries[0]!;
    expect(revert.metadata?.revertedFrom).toBe(id);
    expect(revert.newValue).toBe(1); // reverted to previousValue
    expect(revert.approvalStatus).toBe('auto');
    // chained
    expect(revert.prevHash).toBe(entries[1]!.hash);
  });

  it('revertToState silently no-ops for a missing entry', () => {
    const before = useAuditTrailStore.getState().entries.length;
    useAuditTrailStore.getState().revertToState('missing-id');
    expect(useAuditTrailStore.getState().entries.length).toBe(before);
  });

  it('refreshEntries toggles loading state', async () => {
    const store = useAuditTrailStore.getState();
    store.refreshEntries();
    expect(useAuditTrailStore.getState().loading).toBe(true);
    await new Promise((r) => setTimeout(r, 350));
    expect(useAuditTrailStore.getState().loading).toBe(false);
  });

  it('filterByGdprAccess keeps gdpr/consent/breach entries only', () => {
    const store = useAuditTrailStore.getState();
    store.recordWrite(baseInput({ operation: 'write' }));
    const gdprId = store.recordWrite(baseInput({ operation: 'write', source: 'gdpr' }));
    const consentId = store.recordWrite(baseInput({ operation: 'write', consentId: 'c1' }));
    const breachId = store.recordWrite(baseInput({ operation: 'write', breachEventId: 'b1' }));

    const filtered = useAuditTrailStore
      .getState()
      .filterByGdprAccess(useAuditTrailStore.getState().entries);
    expect(filtered.map((e) => e.id).sort()).toEqual([gdprId, consentId, breachId].sort());
  });

  it('verifyIntegrity reports missing hash material as tampered', () => {
    const store = useAuditTrailStore.getState();
    const id = store.recordWrite(baseInput({ operation: 'write' }));
    // strip the hash → fail-closed tamper detection
    useAuditTrailStore.setState((s) => ({
      entries: s.entries.map((e) => (e.id === id ? { ...e, hash: undefined as never } : e)),
    }));
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.tamperedEntryIds).toContain(id);
    expect(v.valid).toBe(false);
  });

  it('verifyIntegrity detects a link break and head truncation', () => {
    const store = useAuditTrailStore.getState();
    store.recordWrite(baseInput({ operation: 'write' }));
    store.recordWrite(baseInput({ operation: 'write' }));
    const entries = useAuditTrailStore.getState().entries;

    // Tamper prevHash of the newest entry → link break + hash mismatch
    useAuditTrailStore.setState((s) => ({
      entries: s.entries.map((e, i) => (i === 0 ? { ...e, prevHash: 'deadbeef' } : e)),
    }));
    const v = useAuditTrailStore.getState().verifyIntegrity();
    expect(v.chainBreaks.length).toBeGreaterThan(0);
    expect(v.valid).toBe(false);

    // Truncate newest entry but leave chainHead → head not intact
    useAuditTrailStore.setState({
      entries: entries.slice(1),
    });
    const v2 = useAuditTrailStore.getState().verifyIntegrity();
    expect(v2.headIntact).toBe(false);
    expect(v2.valid).toBe(false);

    // Empty store with genesis head is valid
    useAuditTrailStore.setState({ entries: [], chainHead: AUDIT_CHAIN_GENESIS_HASH });
    const v3 = useAuditTrailStore.getState().verifyIntegrity();
    expect(v3.valid).toBe(true);
    expect(v3.headIntact).toBe(true);
  });

  it('exportToCSV redacts PII emails and exportToJSON is parseable', () => {
    const store = useAuditTrailStore.getState();
    store.recordWrite(baseInput({ operation: 'write', userId: 'sarah@example.com' }));

    const csv = useAuditTrailStore.getState().exportToCSV();
    expect(csv).not.toContain('sarah@example.com');
    expect(csv).toContain('id');

    const json = useAuditTrailStore.getState().exportToJSON();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });

  it('redactPII masks emails in userId and metadata', () => {
    const redacted = redactPII({
      id: 'e1',
      timestamp: 't',
      cellId: 's1!A1',
      userId: 'alice@finplan.com',
      approvalUserId: 'bob@finplan.com',
      operation: 'write',
      dataType: 'number',
      previousValue: 1,
      newValue: 2,
      approvalStatus: 'approved',
      source: 'manual',
      metadata: { email: 'carol@finplan.com', code: 'ABC-123' },
      prevHash: undefined,
      hash: undefined,
    });
    expect(redacted.userId).toBe('ali***@finplan.com');
    expect(redacted.approvalUserId).toBe('bob***@finplan.com');
    expect(redacted.metadata?.email).toBe('car***@finplan.com');
    expect(redacted.metadata?.code).toBe('ABC-123');
    // non-email values pass through unchanged
    expect(redactPII({ ...redacted, userId: 'no-email' }).userId).toBe('no-email');
  });

  it('GDPR_AUDIT_VIEW_ROLES and the RBAC selector agree', () => {
    expect(GDPR_AUDIT_VIEW_ROLES).toContain('admin');
    for (const role of ['admin', 'compliance', 'data-protection-officer']) {
      useAuditTrailStore.getState().setCurrentUserRole(role as never);
      expect(selectCanViewGdprAudit(useAuditTrailStore.getState())).toBe(true);
    }
    useAuditTrailStore.getState().setCurrentUserRole('analyst');
    expect(selectCanViewGdprAudit(useAuditTrailStore.getState())).toBe(false);
  });

  it('canonicalizeForHash and computeAuditEntryHash are deterministic', () => {
    const entry: ExtendedAuditEntry = {
      id: 'e1',
      timestamp: 't',
      cellId: 's1!A1',
      userId: 'u1',
      operation: 'write',
      dataType: 'number',
      previousValue: 1,
      newValue: 2,
      approvalStatus: 'approved',
      source: 'manual',
      metadata: { a: 1 },
      prevHash: undefined,
      hash: undefined,
    };
    const c1 = canonicalizeForHash(entry);
    const c2 = canonicalizeForHash(entry);
    expect(c1).toBe(c2);
    expect(computeAuditEntryHash(entry)).toMatch(/^[0-9a-f]{64}$/);
  });
});
