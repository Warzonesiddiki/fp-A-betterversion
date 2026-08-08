// =============================================================================
// auditTrailStore — memoized selectors sweep
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enableMapSet } from 'immer';
import {
  useAuditTrailStore,
  selectFilteredEntries,
  selectPagedEntries,
  selectTotalPages,
  selectStats,
  selectCanViewGdprAudit,
  AUDIT_CHAIN_GENESIS_HASH,
  type State,
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

function makeEntry(over: Partial<ExtendedAuditEntry>): ExtendedAuditEntry {
  return {
    id: 'e1',
    timestamp: '2024-01-01T00:00:00.000Z',
    cellId: {
      sectorId: 's1',
      scenarioId: 'base',
      periodId: '2024-01',
      lineItemId: 'li-1',
    },
    userId: 'u1',
    operation: 'write',
    dataType: 'number',
    previousValue: null,
    newValue: 1,
    approvalStatus: 'approved',
    source: 'manual',
    metadata: { note: 'hello world' },
    prevHash: undefined,
    hash: undefined,
    ...over,
  };
}

describe('auditTrailStore selectors', () => {
  beforeEach(() => {
    idCounter = 0;
    useAuditTrailStore.setState({
      entries: [
        makeEntry({
          id: 'e1',
          userId: 'u1',
          operation: 'write',
          timestamp: '2024-01-01T00:00:00.000Z',
          cellId: { sectorId: 's1', scenarioId: 'base', periodId: '2024-01', lineItemId: 'li-1' },
        }),
        makeEntry({
          id: 'e2',
          userId: 'u2',
          operation: 'read',
          timestamp: '2024-02-01T00:00:00.000Z',
          cellId: { sectorId: 's1', scenarioId: 'base', periodId: '2024-02', lineItemId: 'li-2' },
        }),
        makeEntry({
          id: 'e3',
          userId: 'u3',
          operation: 'update',
          timestamp: '2024-03-01T00:00:00.000Z',
          cellId: { sectorId: 's1', scenarioId: 'base', periodId: '2024-03', lineItemId: 'li-3' },
          source: 'gdpr',
        }),
      ],
      filters: {
        userId: null,
        operation: null,
        source: null,
        severity: null,
      },
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

  it('selectFilteredEntries returns all for admin with no filters', () => {
    expect(selectFilteredEntries(useAuditTrailStore.getState())).toHaveLength(3);
  });

  it('excludes gdpr entries for non-privileged roles', () => {
    useAuditTrailStore.getState().setCurrentUserRole('analyst');
    const filtered = selectFilteredEntries(useAuditTrailStore.getState());
    expect(filtered.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('filters by userId, operation, source, dataType, approvalStatus, transactionId, dateRange, valueRange, fullText, hasVersion, hasConsent and cellId', () => {
    const base = useAuditTrailStore.getState();
    const set = (patch: Partial<State['filters']>) =>
      useAuditTrailStore.setState({ filters: { ...base.filters, ...patch } });

    set({ userId: 'u2' });
    expect(selectFilteredEntries(useAuditTrailStore.getState()).map((e) => e.id)).toEqual(['e2']);

    set({ userId: null, operation: ['read', 'update'] as never });
    expect(
      selectFilteredEntries(useAuditTrailStore.getState())
        .map((e) => e.id)
        .sort()
    ).toEqual(['e2', 'e3']);

    set({ operation: null, source: 'gdpr' });
    expect(selectFilteredEntries(useAuditTrailStore.getState()).map((e) => e.id)).toEqual(['e3']);

    set({ source: null, dataType: ['number'] as never });
    expect(selectFilteredEntries(useAuditTrailStore.getState())).toHaveLength(3);

    set({ dataType: null, approvalStatus: ['rejected'] as never });
    expect(selectFilteredEntries(useAuditTrailStore.getState())).toHaveLength(0);

    set({ approvalStatus: null, cellId: 'li-2' });
    expect(selectFilteredEntries(useAuditTrailStore.getState()).map((e) => e.id)).toEqual(['e2']);

    set({ cellId: null, dateRange: ['2024-02-01', '2024-03-31'] as never });
    // string comparison keeps e2 and e3 (order is irrelevant here)
    const dateRangeIds = selectFilteredEntries(useAuditTrailStore.getState())
      .map((e) => e.id)
      .sort();
    expect(dateRangeIds).toEqual(['e2', 'e3']);

    set({ dateRange: null, valueRange: [1, 1] as never });
    expect(selectFilteredEntries(useAuditTrailStore.getState())).toHaveLength(3);

    set({ valueRange: null, fullTextSearch: 'hello' });
    // metadata JSON for every entry contains 'hello world' → all three match
    expect(selectFilteredEntries(useAuditTrailStore.getState()).length).toBe(3);

    set({ fullTextSearch: null, hasVersion: true });
    expect(selectFilteredEntries(useAuditTrailStore.getState())).toHaveLength(0);

    set({ hasVersion: null, hasConsent: true });
    expect(selectFilteredEntries(useAuditTrailStore.getState())).toHaveLength(0);

    set({ hasConsent: null, transactionId: 'tx-1' });
    expect(selectFilteredEntries(useAuditTrailStore.getState())).toHaveLength(0);

    set({ transactionId: null });
  });

  it('sorting respects setSort toggle semantics for every field', () => {
    const store = useAuditTrailStore.getState();
    // default desc by timestamp: string sort desc → latest string first
    store.setSort('timestamp');
    expect(useAuditTrailStore.getState().sortDir).toBe('asc'); // toggled from desc

    store.setSort('timestamp'); // toggle back to desc
    expect(useAuditTrailStore.getState().sortDir).toBe('desc');

    store.setSort('userId');
    expect(useAuditTrailStore.getState().sortField).toBe('userId');
    expect(useAuditTrailStore.getState().sortDir).toBe('desc'); // new field starts desc

    useAuditTrailStore.setState({ sortDir: 'asc', sortField: 'operation' });
    const byOp = selectFilteredEntries(useAuditTrailStore.getState()).map((e) => e.id);
    expect(byOp).toEqual(['e2', 'e3', 'e1']); // read, update, write

    useAuditTrailStore.setState({ sortDir: 'asc', sortField: 'approvalStatus' });
    useAuditTrailStore.setState({
      entries: [
        makeEntry({ id: 'e1', userId: 'u1', operation: 'write', approvalStatus: 'approved' }),
        makeEntry({ id: 'e2', userId: 'u2', operation: 'read', approvalStatus: 'approved' }),
        makeEntry({ id: 'e3', userId: 'u3', operation: 'update', approvalStatus: 'approved' }),
      ],
    });
    // all approved → stable original order
    expect(selectFilteredEntries(useAuditTrailStore.getState()).map((e) => e.id)).toEqual([
      'e1',
      'e2',
      'e3',
    ]);

    useAuditTrailStore.setState({ sortDir: 'asc', sortField: 'cellId' });
    expect(selectFilteredEntries(useAuditTrailStore.getState()).map((e) => e.id)).toEqual([
      'e1',
      'e2',
      'e3',
    ]);
  });

  it('selectPagedEntries paginates and selectTotalPages clamps to >= 1', () => {
    useAuditTrailStore.setState({ currentPage: 1, pageSize: 2 });
    expect(selectPagedEntries(useAuditTrailStore.getState())).toHaveLength(2);
    expect(selectTotalPages(useAuditTrailStore.getState())).toBe(2);

    useAuditTrailStore.setState({ currentPage: 2 });
    expect(selectPagedEntries(useAuditTrailStore.getState())).toHaveLength(1);

    useAuditTrailStore.setState({ currentPage: 5 });
    expect(selectPagedEntries(useAuditTrailStore.getState())).toHaveLength(0);

    useAuditTrailStore.setState({ entries: [] });
    expect(selectTotalPages(useAuditTrailStore.getState())).toBe(1);
  });

  it('selectStats aggregates users, cells, operations and approvals', () => {
    useAuditTrailStore.setState({
      entries: [
        makeEntry({
          id: 'e1',
          userId: 'u1',
          operation: 'write',
          approvalStatus: 'approved',
          cellId: { sectorId: 's1', scenarioId: 'base', periodId: '2024-01', lineItemId: 'li-1' },
        }),
        makeEntry({
          id: 'e2',
          userId: 'u1',
          operation: 'write',
          approvalStatus: 'approved',
          cellId: { sectorId: 's1', scenarioId: 'base', periodId: '2024-02', lineItemId: 'li-2' },
        }),
        makeEntry({
          id: 'e3',
          userId: 'u2',
          operation: 'read',
          approvalStatus: 'auto',
          cellId: { sectorId: 's1', scenarioId: 'base', periodId: '2024-03', lineItemId: 'li-3' },
        }),
      ],
      currentPage: 1,
      pageSize: 25,
    });
    const stats = selectStats(useAuditTrailStore.getState());
    expect(stats.total).toBe(3);
    expect(stats.uniqueUsers).toBe(2);
    expect(stats.uniqueCells).toBe(3);
    expect(stats.operationCounts.write).toBe(2);
    expect(stats.operationCounts.read).toBe(1);
    expect(stats.operationCounts.delete).toBe(0);
    expect(stats.approvalCounts.approved).toBe(2);
    expect(stats.approvalCounts.auto).toBe(1);
    expect(stats.approvalCounts.pending).toBe(0);
    expect(stats.topUsers[0]).toEqual({ userId: 'u1', count: 2 });
  });

  it('selectCanViewGdprAudit gates on role', () => {
    expect(selectCanViewGdprAudit(useAuditTrailStore.getState())).toBe(true);
    useAuditTrailStore.getState().setCurrentUserRole('analyst');
    expect(selectCanViewGdprAudit(useAuditTrailStore.getState())).toBe(false);
  });
});
