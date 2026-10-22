/**
 * Q5 stage 4 — the hydrate gate (DEC-057).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `GLEntry.debit/credit/netChange/amount` are now `Money`. Every row already on
 * a user's disk was written while they were `number` (major units). Rehydrating
 * those rows without a conversion step would put an IEEE-754 double where a
 * `Money` is declared: `moneyPlus` would throw on the first render, or — worse,
 * if any read fell back to a default — the ledger would silently report zero.
 *
 * So hydration is gated at the one door into the store (`persist.merge`):
 *
 *   1. every persisted amount is re-encoded to exact `Money` minor units;
 *   2. a row whose amount is NOT representable at `LEDGER_SCALE` (a sub-cent
 *      value, an unparseable string, a non-finite number) is KEPT VERBATIM in
 *      `quarantinedEntries` — never rounded, never dropped, never zeroed;
 *   3. only the representable half reaches `entries`, so no `Money` aggregate
 *      can ever mix in a float.
 *
 * The twin requirement: the SAME ledger, once as pre-flip numbers and once as
 * `Money`, must hydrate to the SAME state. A test that only checked the `Money`
 * input would pass even if the number path produced zeros.
 *
 * Values are asserted, not just shapes — `{ minor: 500000 }`, not "an object".
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GLEntry, GLState } from '@/types';
import { asMoney, isMoneyValue } from '@/utils/money';
import { describeQuarantinedRows } from '@/utils/ledgerHydration';

// The store's storage backend; merge itself never touches it, but importing
// the store pulls the module in.
vi.mock('@/utils/tauriSqlStorage', () => ({
  tauriSqlStorage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
  isTauri: async () => false,
}));

/** One GL row, with money fields supplied by the caller (number OR Money). */
function row(
  id: string,
  amounts: { debit: unknown; credit: unknown; netChange?: unknown; amount?: unknown }
): GLEntry {
  return {
    id,
    accountId: `acct-${id}`,
    accountCode: '1010',
    accountName: 'Cash',
    period: '2024-01',
    periodName: 'Jan 2024',
    date: '2024-01-01',
    debit: amounts.debit,
    credit: amounts.credit,
    netChange: amounts.netChange ?? amounts.debit,
    amount: amounts.amount ?? amounts.credit,
    description: '',
    reference: '',
  } as unknown as GLEntry;
}

const MONEY_FIELDS = ['debit', 'credit', 'netChange', 'amount'] as const;

/** Run the store's real persisted-state merge over a fake persisted envelope. */
async function hydrate(persistedEntries: unknown[]): Promise<GLState> {
  const { useGLStore } = await import('./glStore');
  const merge = useGLStore.persist.getOptions().merge;
  expect(merge, 'persist.merge must be configured — it is the hydrate gate').toBeTypeOf('function');
  return merge!(
    { entries: persistedEntries, importHistory: [] } as unknown as Partial<GLState>,
    useGLStore.getState()
  ) as GLState;
}

describe('glStore hydrate gate (Q5 stage 4, DEC-057)', () => {
  beforeEach(async () => {
    const { useGLStore } = await import('./glStore');
    useGLStore.setState({ entries: [], quarantinedEntries: [] });
  });

  it('twins: the same ledger persisted as numbers or as Money hydrates identically', async () => {
    const asNumbers = [
      row('a', { debit: 500000, credit: 0, netChange: 500000, amount: 500000 }),
      row('b', { debit: 0, credit: 500000, netChange: -500000, amount: -500000 }),
      row('c', { debit: 0.01, credit: 0, netChange: 0.01, amount: 0.01 }),
    ];
    const asMoneyRows = [
      row('a', {
        debit: asMoney(500000),
        credit: asMoney(0),
        netChange: asMoney(500000),
        amount: asMoney(500000),
      }),
      row('b', {
        debit: asMoney(0),
        credit: asMoney(500000),
        netChange: asMoney(-500000),
        amount: asMoney(-500000),
      }),
      row('c', {
        debit: asMoney(0.01),
        credit: asMoney(0),
        netChange: asMoney(0.01),
        amount: asMoney(0.01),
      }),
    ];

    const fromNumbers = await hydrate(asNumbers);
    const fromMoney = await hydrate(asMoneyRows);

    expect(fromNumbers.entries).toHaveLength(3);
    expect(fromMoney.entries).toEqual(fromNumbers.entries);
    expect(fromNumbers.quarantinedEntries).toHaveLength(0);
    expect(fromMoney.quarantinedEntries).toHaveLength(0);

    // Exact minor units, not "some object". A one-cent error fails here.
    expect(fromNumbers.entries[0]!.debit).toEqual({ minor: 50_000_000 });
    expect(fromNumbers.entries[1]!.netChange).toEqual({ minor: -50_000_000 });
    expect(fromNumbers.entries[2]!.debit).toEqual({ minor: 1 });
  });

  it('produces Money, never a bare number, for every money field', async () => {
    // The failure this pins: if merge passed rows through unchanged, `debit`
    // would still be the number 1234.56 and the first `moneyPlus` would throw.
    const { entries } = await hydrate([
      row('a', { debit: 1234.56, credit: 0, netChange: 1234.56, amount: 1234.56 }),
    ]);
    for (const field of MONEY_FIELDS) {
      expect(isMoneyValue(entries[0]![field]), `${field} must hydrate as Money`).toBe(true);
    }
    expect(entries[0]!.debit).toEqual({ minor: 123_456 });
  });

  it('quarantines a sub-cent row verbatim: kept, named, never rounded into entries', async () => {
    const persisted = [
      row('ok', { debit: 10, credit: 0, netChange: 10, amount: 10 }),
      row('sub', { debit: 0.005, credit: 0, netChange: 0.005, amount: 0.005 }),
    ];
    const state = await hydrate(persisted);

    expect(state.entries.map((e) => e.id)).toEqual(['ok']);
    expect(state.quarantinedEntries).toHaveLength(1);
    const held = state.quarantinedEntries[0]!;
    expect(held.rowId).toBe('sub');
    // Verbatim: the sub-cent value is still 0.005, not 0.01 and not 0.
    expect((held.row as unknown as { debit: number }).debit).toBe(0.005);
    expect(held.issues.map((i) => [i.field, i.reason])).toEqual(
      expect.arrayContaining([
        ['debit', 'sub-cent'],
        ['netChange', 'sub-cent'],
      ])
    );
    // Nothing vanished: the two halves partition the persisted rows.
    expect(state.entries.length + state.quarantinedEntries.length).toBe(persisted.length);

    // The exclusion is nameable for the UI, not silent.
    const lines = describeQuarantinedRows(state.quarantinedEntries);
    expect(lines.some((line) => line.startsWith('Entry sub: debit'))).toBe(true);
  });

  it('a non-finite persisted amount is quarantined, not coerced to zero', async () => {
    // JSON cannot carry Infinity, but a legacy/plain-text envelope can, and
    // `asMoney` would throw on it mid-hydration if the row were not gated.
    const state = await hydrate([row('bad', { debit: Infinity, credit: 0 })]);
    expect(state.entries).toHaveLength(0);
    expect(state.quarantinedEntries).toHaveLength(1);
    expect(state.quarantinedEntries[0]!.issues[0]!.reason).toBe('non-finite');
  });

  it('ledgerScaleAudit reports BOTH halves: loaded quarantine + live rows', async () => {
    const { useGLStore } = await import('./glStore');
    const merged = await hydrate([
      row('ok', { debit: 10, credit: 0, netChange: 10, amount: 10 }),
      row('sub', { debit: 0.005, credit: 0, netChange: 0.005, amount: 0.005 }),
    ]);
    useGLStore.setState(merged);

    const audit = useGLStore.getState().ledgerScaleAudit();
    expect(audit.representable.map((e) => e.id)).toEqual(['ok']);
    // The load-time quarantine is not forgotten once state has settled.
    expect(audit.quarantined.map((q) => q.rowId)).toEqual(['sub']);
  });

  it('an empty or absent persisted ledger hydrates without inventing rows', async () => {
    const empty = await hydrate([]);
    expect(empty.entries).toEqual([]);
    expect(empty.quarantinedEntries).toEqual([]);

    const { useGLStore } = await import('./glStore');
    const merge = useGLStore.persist.getOptions().merge!;
    const absent = merge(undefined as unknown as Partial<GLState>, useGLStore.getState());
    expect((absent as GLState).entries).toEqual([]);
  });
});
