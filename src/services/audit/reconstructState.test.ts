// src/services/audit/reconstructState.test.ts
// Phase 12 tail (R-009): audit-trail state reconstruction. Proves any prior
// cell state can be rebuilt from the append-only trail alone, that the
// rebuild refuses a tampered trail (fail-closed, F-0015 chain), and that
// never-written cells are ABSENT — never zero-filled.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { reconstructState, cellKeyFor } from './reconstructState';
import {
  useAuditTrailStore,
  AUDIT_CHAIN_GENESIS_HASH,
  type ExtendedAuditEntry,
} from '@/store/auditTrailStore';
import { setClock, resetClock } from '@/utils/clock';

const cellA = {
  cube: 'gl',
  coords: { account: '1000' },
  measure: 'value',
  sectorId: 'revenue',
  scenarioId: 'Actual',
  periodId: '2026Q2',
  lineItemId: 'revenue',
};
const cellB = { ...cellA, coords: { account: '4010' }, lineItemId: 'sales' };

const base = {
  userId: 'controller@finplan.io',
  dataType: 'number' as const,
};

function resetStore() {
  useAuditTrailStore.setState({
    entries: [],
    chainHead: AUDIT_CHAIN_GENESIS_HASH,
    currentUserRole: 'viewer',
  });
}

function trail(): { entries: ExtendedAuditEntry[]; chainHead: string } {
  const s = useAuditTrailStore.getState();
  return { entries: s.entries, chainHead: s.chainHead };
}

beforeEach(() => {
  resetStore();
});
afterEach(() => {
  resetClock();
});

describe('reconstructState (R-009)', () => {
  it('rebuilds final state from the trail alone', () => {
    setClock('2026-01-01T09:00:00.000Z');
    const s = useAuditTrailStore.getState();
    s.recordWrite({ ...base, cellId: cellA, operation: 'write', newValue: 1000 });
    s.recordWrite({ ...base, cellId: cellB, operation: 'write', newValue: 500 });
    setClock('2026-01-02T09:00:00.000Z');
    useAuditTrailStore.getState().recordUpdate({
      ...base,
      cellId: cellA,
      operation: 'update',
      previousValue: 1000,
      newValue: 1250,
    });

    const { entries, chainHead } = trail();
    const result = reconstructState(entries, { expectedHead: chainHead });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cells.get(cellKeyFor(cellA))).toBe(1250);
    expect(result.cells.get(cellKeyFor(cellB))).toBe(500);
    expect(result.applied).toBe(3);
  });

  it('rebuilds an earlier point in time with asOf (later writes excluded)', () => {
    setClock('2026-01-01T09:00:00.000Z');
    useAuditTrailStore
      .getState()
      .recordWrite({ ...base, cellId: cellA, operation: 'write', newValue: 1000 });
    setClock('2026-01-03T09:00:00.000Z');
    useAuditTrailStore.getState().recordUpdate({
      ...base,
      cellId: cellA,
      operation: 'update',
      previousValue: 1000,
      newValue: 1250,
    });

    const { entries, chainHead } = trail();
    const asOf = Date.parse('2026-01-02T00:00:00.000Z');
    const result = reconstructState(entries, { asOf, expectedHead: chainHead });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cells.get(cellKeyFor(cellA))).toBe(1000);
    expect(result.applied).toBe(1);
  });

  it('deleted cells are absent after reconstruction — not zero', () => {
    const s = useAuditTrailStore.getState();
    s.recordWrite({ ...base, cellId: cellA, operation: 'write', newValue: 1000 });
    useAuditTrailStore.getState().recordDelete({
      ...base,
      cellId: cellA,
      operation: 'delete',
      previousValue: 1000,
      newValue: null,
    });

    const { entries, chainHead } = trail();
    const result = reconstructState(entries, { expectedHead: chainHead });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cells.has(cellKeyFor(cellA))).toBe(false);
    // A cell that was never written is likewise absent (missing ≠ zero).
    expect(result.cells.has(cellKeyFor(cellB))).toBe(false);
  });

  it('read entries do not change reconstructed state', () => {
    const s = useAuditTrailStore.getState();
    s.recordWrite({ ...base, cellId: cellA, operation: 'write', newValue: 42 });
    useAuditTrailStore
      .getState()
      .recordRead({ ...base, cellId: cellA, operation: 'read', newValue: 42 });

    const { entries, chainHead } = trail();
    const result = reconstructState(entries, { expectedHead: chainHead });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cells.get(cellKeyFor(cellA))).toBe(42);
    expect(result.applied).toBe(1);
  });

  it('REFUSES to reconstruct from a tampered trail (value mutation)', () => {
    useAuditTrailStore
      .getState()
      .recordWrite({ ...base, cellId: cellA, operation: 'write', newValue: 1000 });
    const { entries, chainHead } = trail();
    const tampered = entries.map((e) => ({ ...e, newValue: 999999 }));
    const result = reconstructState(tampered, { expectedHead: chainHead });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.breaks.length).toBeGreaterThan(0);
    expect(result.breaks[0]!.reason).toMatch(/hash/);
  });

  it('REFUSES a truncated trail when the expected head is supplied', () => {
    const s = useAuditTrailStore.getState();
    s.recordWrite({ ...base, cellId: cellA, operation: 'write', newValue: 1000 });
    useAuditTrailStore
      .getState()
      .recordWrite({ ...base, cellId: cellB, operation: 'write', newValue: 500 });
    const { entries, chainHead } = trail();
    // Attacker drops the NEWEST entry (stored first) but the head is pinned.
    const truncated = entries.slice(1);
    const result = reconstructState(truncated, { expectedHead: chainHead });
    expect(result.ok).toBe(false);
  });

  it('an empty trail reconstructs to an empty state (valid, not an error)', () => {
    const result = reconstructState([], { expectedHead: AUDIT_CHAIN_GENESIS_HASH });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cells.size).toBe(0);
    expect(result.applied).toBe(0);
  });
});
