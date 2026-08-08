import { describe, it, expect, beforeEach, vi } from 'vitest';
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
  masterStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
}));

// Deterministic IDs so hashes are stable across runs.
let idCounter = 0;
vi.mock('@/utils/cryptoId', () => ({
  randomId: (prefix = 'id') => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  },
}));
vi.mock('@/utils/sha256', () => ({
  sha256Hex: (s: string) => {
    // Simple deterministic hash stub — must be injective on inputs for chain tests.
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
    const hex = (h >>> 0).toString(16).padStart(8, '0');
    return hex.repeat(8); // 64 hex chars to match sha256 length
  },
}));
vi.mock('@/utils/spreadsheetSanitize', () => ({
  sanitizeSpreadsheetText: (s: unknown) => (typeof s === 'string' ? s : s),
}));

describe('auditTrailStore', () => {
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

  it('recordWrite appends an entry with id, previousHash linkage and timestamp', () => {
    const id = useAuditTrailStore.getState().recordWrite(baseInput());
    expect(id).toMatch(/^id-/); // randomId stub returns id-N
    const entries = useAuditTrailStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(id);
    expect(entries[0].prevHash).toBe(AUDIT_CHAIN_GENESIS_HASH);
    expect(typeof entries[0].timestamp).toBe('number');
  });

  it('recordBulk appends multiple entries in a single batch and links the chain', () => {
    const ids = useAuditTrailStore
      .getState()
      .recordBulk([
        baseInput({ newValue: 1 }),
        baseInput({ newValue: 2 }),
        baseInput({ newValue: 3 }),
      ]);
    expect(ids).toHaveLength(3);
    // entries are unshift newest-first, so reverse for chronological order
    const entries = [...useAuditTrailStore.getState().entries].reverse();
    expect(entries).toHaveLength(3);
    expect(entries[0].prevHash).toBe(AUDIT_CHAIN_GENESIS_HASH);
    expect(entries[1].prevHash).toBe(entries[0].hash);
    expect(entries[2].prevHash).toBe(entries[1].hash);
  });

  it('chainHead reflects the hash of the latest entry', () => {
    useAuditTrailStore.getState().recordWrite(baseInput({ newValue: 1 }));
    const { entries, chainHead } = useAuditTrailStore.getState();
    // entries[0] is newest-first
    expect(chainHead).toBe(entries[0].hash);
  });

  it('verifyIntegrity reports valid for an intact chain', () => {
    useAuditTrailStore
      .getState()
      .recordBulk([
        baseInput({ newValue: 1 }),
        baseInput({ newValue: 2 }),
        baseInput({ newValue: 3 }),
      ]);
    const result = useAuditTrailStore.getState().verifyIntegrity();
    expect(result.valid).toBe(true);
    expect(result.entryCount).toBe(3);
    expect(result.tamperedEntryIds).toHaveLength(0);
    expect(result.chainBreaks).toHaveLength(0);
    expect(result.headIntact).toBe(true);
  });

  it('verifyIntegrity flags a tampered entry', () => {
    useAuditTrailStore
      .getState()
      .recordBulk([
        baseInput({ newValue: 1 }),
        baseInput({ newValue: 2 }),
        baseInput({ newValue: 3 }),
      ]);
    // Mutate via setState to bypass immer's freezing
    const entries = [...useAuditTrailStore.getState().entries];
    const tampered = { ...entries[1], newValue: 9999 };
    useAuditTrailStore.setState({ entries: [entries[0], tampered, entries[2]] });
    const result = useAuditTrailStore.getState().verifyIntegrity();
    expect(result.valid).toBe(false);
    expect(result.tamperedEntryIds).toContain(entries[1].id);
  });

  it('setFilter + clearFilters updates filter state', () => {
    const state = useAuditTrailStore.getState();
    state.setFilter('userId', 'u2');
    expect(useAuditTrailStore.getState().filters.userId).toBe('u2');
    state.clearFilters();
    // defaultFilters resets to undefined (not null)
    expect(useAuditTrailStore.getState().filters.userId).toBeUndefined();
    expect(useAuditTrailStore.getState().filters.operation).toBeUndefined();
  });

  it('setSort toggles direction when same field is selected', () => {
    const state = useAuditTrailStore.getState();
    state.setSort('userId');
    expect(useAuditTrailStore.getState().sortField).toBe('userId');
    const dir1 = useAuditTrailStore.getState().sortDir;
    state.setSort('userId');
    expect(useAuditTrailStore.getState().sortDir).not.toBe(dir1);
  });

  it('setPageSize resets to page 1 and clamps pages', () => {
    useAuditTrailStore
      .getState()
      .recordBulk(Array.from({ length: 80 }, (_, i) => baseInput({ newValue: i })));
    const s = useAuditTrailStore.getState();
    s.setPage(3);
    s.setPageSize(50);
    expect(useAuditTrailStore.getState().pageSize).toBe(50);
    expect(useAuditTrailStore.getState().currentPage).toBe(1);
  });

  it('redactPII redacts email-formatted userId and metadata emails', () => {
    const entry = {
      userId: 'alice@example.com',
      metadata: { note: 'plain-text-note', contact: 'longname@example.com' },
    } as unknown as ExtendedAuditEntry;
    const redacted = redactPII(entry);
    expect(redacted.userId).toContain('***');
    expect(redacted.userId).not.toBe('alice@example.com');
    // Email-formatted metadata strings are redacted (local part truncated).
    expect(redacted.metadata?.contact).toContain('***');
    expect(redacted.metadata?.contact).not.toBe('longname@example.com');
    // Non-email metadata strings pass through unchanged.
    expect(redacted.metadata?.note).toBe('plain-text-note');
  });

  it('selectCanViewGdprAudit permits admin/compliance/dpo only', () => {
    useAuditTrailStore.setState({ currentUserRole: 'admin' });
    expect(selectCanViewGdprAudit(useAuditTrailStore.getState())).toBe(true);
    useAuditTrailStore.setState({ currentUserRole: 'viewer' });
    expect(selectCanViewGdprAudit(useAuditTrailStore.getState())).toBe(false);
    for (const role of GDPR_AUDIT_VIEW_ROLES) {
      useAuditTrailStore.setState({ currentUserRole: role });
      expect(selectCanViewGdprAudit(useAuditTrailStore.getState())).toBe(true);
    }
  });

  it('exportToJSON returns parseable JSON', () => {
    useAuditTrailStore.getState().recordWrite(baseInput({ newValue: 42 }));
    const json = useAuditTrailStore.getState().exportToJSON();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });

  it('exportToCSV returns a CSV with a header row', () => {
    useAuditTrailStore.getState().recordWrite(baseInput({ newValue: 7 }));
    const csv = useAuditTrailStore.getState().exportToCSV();
    expect(csv).toMatch(/id/);
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(2);
  });

  it('setCurrentUserRole updates role for RBAC gating', () => {
    useAuditTrailStore.getState().setCurrentUserRole('auditor');
    expect(useAuditTrailStore.getState().currentUserRole).toBe('auditor');
  });

  it('recordRead produces a read-typed entry', () => {
    const id = useAuditTrailStore.getState().recordRead(baseInput({ operation: 'read' }));
    const entry = useAuditTrailStore.getState().entries.find((e) => e.id === id);
    expect(entry?.operation).toBe('read');
  });

  it('canonicalizeForHash and computeAuditEntryHash produce deterministic strings', () => {
    const a = canonicalizeForHash({ x: 1, y: [1, 2] });
    const b = canonicalizeForHash({ y: [1, 2], x: 1 });
    expect(a).toBe(b);
    const fakeEntry = { id: 'aud-1', previousHash: AUDIT_CHAIN_GENESIS_HASH } as ExtendedAuditEntry;
    const h1 = computeAuditEntryHash(fakeEntry);
    const h2 = computeAuditEntryHash(fakeEntry);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });
});
