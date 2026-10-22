/**
 * Q5 stage 4 precondition — the ledger hydration policy (DEC-054).
 *
 * The property under test is not "sub-cent rows are rejected" (they are not),
 * it is **nothing is lost and nothing is rounded**: every input row appears in
 * exactly one half of the partition, the values in the quarantined half are the
 * exact values that came off disk, and a ledger that contains one bad row still
 * loads every other row.
 */
import { describe, expect, it } from 'vitest';
import {
  classifyLedgerRow,
  describeQuarantinedRows,
  LEDGER_MONEY_FIELDS,
  partitionLedgerRows,
  quarantinedFieldCounts,
} from './ledgerHydration';
import { asMoney, moneyToMinor } from './money';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'e-1',
    accountCode: '1000',
    debit: 100,
    credit: 0,
    netChange: 100,
    amount: 100,
    ...overrides,
  };
}

describe('classifyLedgerRow', () => {
  it('accepts whole-cent and negative amounts', () => {
    expect(classifyLedgerRow(row())).toBeNull();
    expect(
      classifyLedgerRow(row({ debit: 0, credit: 100, netChange: -100, amount: -100 }))
    ).toBeNull();
    expect(
      classifyLedgerRow(row({ debit: 0.01, credit: 0, netChange: 0.01, amount: 0.01 }))
    ).toBeNull();
    expect(
      classifyLedgerRow(
        row({ debit: 1234567.89, credit: 0, netChange: 1234567.89, amount: 1234567.89 })
      )
    ).toBeNull();
  });

  it('names the exact field and value that cannot be represented', () => {
    const issues = classifyLedgerRow(row({ debit: 0.004, credit: 0, netChange: 0, amount: 0.004 }));
    expect(issues).toEqual([
      { field: 'debit', canonical: '0.004', reason: 'sub-cent' },
      { field: 'amount', canonical: '0.004', reason: 'sub-cent' },
    ]);
  });

  it('reports EVERY offending field, not just the first', () => {
    // A report that stops at the first problem sends the user back twice.
    const issues = classifyLedgerRow(
      row({ debit: 0.001, credit: 0.002, netChange: 0.003, amount: 0.004 })
    );
    expect(issues?.map((i) => i.field)).toEqual([...LEDGER_MONEY_FIELDS]);
  });

  it('accepts the canonical string form a persisted `$d:` value decodes to', () => {
    expect(classifyLedgerRow(row({ debit: '0.004' }))).not.toBeNull();
    expect(classifyLedgerRow(row({ debit: '100.00' }))).toBeNull();
  });

  it('accepts an already-converted Money value', () => {
    expect(classifyLedgerRow(row({ debit: asMoney(100), amount: asMoney(100) }))).toBeNull();
  });

  it('treats an absent field as absent, never as zero or as an error', () => {
    expect(classifyLedgerRow({ id: 'x', debit: 10 })).toBeNull();
    expect(classifyLedgerRow({ id: 'x', debit: 10, credit: null })).toBeNull();
  });

  it('classifies non-finite and unparseable values with a distinct reason', () => {
    expect(classifyLedgerRow(row({ debit: Number.NaN }))?.[0]).toMatchObject({
      field: 'debit',
      reason: 'non-finite',
    });
    expect(classifyLedgerRow(row({ debit: Number.POSITIVE_INFINITY }))?.[0]).toMatchObject({
      field: 'debit',
      reason: 'non-finite',
    });
    expect(classifyLedgerRow(row({ debit: 'not-a-number' }))?.[0]).toMatchObject({
      field: 'debit',
      reason: 'unparseable',
    });
  });
});

describe('partitionLedgerRows — the losslessness guarantee', () => {
  it('accounts for every input row exactly once', () => {
    const rows = [
      row({ id: 'ok-1' }),
      row({ id: 'bad-1', debit: 0.004, amount: 0.004 }),
      row({ id: 'ok-2', debit: 250.5, netChange: 250.5, amount: 250.5 }),
      row({ id: 'bad-2', credit: 0.1 + 0.2 }),
    ];
    const partition = partitionLedgerRows(rows);

    expect(partition.representable.map((r) => r.id)).toEqual(['ok-1', 'ok-2']);
    expect(partition.quarantined.map((q) => q.rowId)).toEqual(['bad-1', 'bad-2']);
    // Nothing dropped, nothing duplicated.
    expect(partition.representable.length + partition.quarantined.length).toBe(rows.length);
  });

  it('keeps the quarantined row byte-exact — the value is never rounded', () => {
    // This is the whole point: 0.004 must survive as 0.004.
    const partition = partitionLedgerRows([row({ id: 'e-9', debit: 0.004, amount: 0.004 })]);
    const quarantined = partition.quarantined[0]!;

    expect(quarantined.row.debit).toBe(0.004);
    expect(quarantined.issues.map((i) => i.canonical)).toEqual(['0.004', '0.004']);
    // And it is still not representable as Money — the refusal is unchanged.
    expect(() => asMoney(0.004)).toThrow();
  });

  it('a float artefact is quarantined rather than silently accepted', () => {
    // 0.1 + 0.2 is 0.30000000000000004: the value a pre-DEC-048 build could store.
    const partition = partitionLedgerRows([row({ id: 'artefact', debit: 0.1 + 0.2 })]);
    expect(partition.representable).toHaveLength(0);
    expect(partition.quarantined[0]!.issues[0]!.canonical).toBe('0.30000000000000004');
  });

  it('records the original index so the row can be pointed at in the source file', () => {
    const partition = partitionLedgerRows([
      row({ id: 'a' }),
      row({ id: 'b' }),
      row({ id: 'bad', debit: 0.004 }),
    ]);
    expect(partition.quarantined[0]!.rowIndex).toBe(2);
  });

  it('falls back to the index when a row has no id', () => {
    const partition = partitionLedgerRows([{ debit: 0.004 }]);
    expect(partition.quarantined[0]!.rowId).toBe('#0');
  });

  it('an empty ledger is empty on both sides', () => {
    const partition = partitionLedgerRows([]);
    expect(partition.representable).toEqual([]);
    expect(partition.quarantined).toEqual([]);
  });

  it('a wholly-representable ledger quarantines nothing (no false positives)', () => {
    const rows = Array.from({ length: 50 }, (_, i) =>
      row({ id: `e-${i}`, debit: i / 100, credit: 0, netChange: i / 100, amount: i / 100 })
    );
    const partition = partitionLedgerRows(rows);
    expect(partition.representable).toHaveLength(50);
    expect(partition.quarantined).toHaveLength(0);
  });

  it('never throws — it runs during hydration', () => {
    const hostile = [
      { id: 'x', debit: Number.NaN },
      { id: 'y', debit: {} as unknown },
      { id: 'z', debit: Symbol('s') as unknown },
      { id: 'w', debit: [1, 2] as unknown },
    ];
    expect(() => partitionLedgerRows(hostile)).not.toThrow();
    expect(partitionLedgerRows(hostile).quarantined).toHaveLength(4);
  });

  it('preserves the representable half exactly as it was supplied', () => {
    const rows = [row({ id: 'keep', debit: 10.5, netChange: 10.5, amount: 10.5 })];
    const partition = partitionLedgerRows(rows);
    expect(partition.representable[0]).toBe(rows[0]);
  });
});

describe('reporting', () => {
  it('describes each offending amount as its own line, naming the entry and scale', () => {
    const partition = partitionLedgerRows([row({ id: 'e-42', debit: 0.004, amount: 0.004 })]);
    expect(describeQuarantinedRows(partition.quarantined)).toEqual([
      'Entry e-42: debit 0.004 cannot be represented at 2 decimal places',
      'Entry e-42: amount 0.004 cannot be represented at 2 decimal places',
    ]);
  });

  it('counts exclusions by field', () => {
    const partition = partitionLedgerRows([
      row({ id: 'a', debit: 0.004 }),
      row({ id: 'b', credit: 0.005, amount: 0.006 }),
    ]);
    expect(quarantinedFieldCounts(partition.quarantined)).toEqual({
      debit: 1,
      credit: 1,
      netChange: 0,
      amount: 1,
    });
  });
});

describe('the aggregate invariant stage 4 depends on', () => {
  it('a ledger with one unrepresentable row still yields a complete, balanced rest', () => {
    const rows = [
      row({ id: 'd1', debit: 100, credit: 0, netChange: 100, amount: 100 }),
      row({ id: 'c1', debit: 0, credit: 100, netChange: -100, amount: -100 }),
      row({ id: 'legacy', debit: 0.004, credit: 0, netChange: 0, amount: 0.004 }),
    ];
    const { representable, quarantined } = partitionLedgerRows(rows);

    const debitMinor = representable.reduce((sum, r) => sum + moneyToMinor(asMoney(r.debit)), 0);
    const creditMinor = representable.reduce((sum, r) => sum + moneyToMinor(asMoney(r.credit)), 0);
    expect(debitMinor).toBe(10000);
    expect(creditMinor).toBe(10000);
    expect(quarantined).toHaveLength(1);
    // The excluded row is reported, not silently netted out of the totals.
    expect(quarantinedFieldCounts(quarantined).debit).toBe(1);
  });
});
