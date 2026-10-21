/**
 * Q5 stage 4 precondition (DEC-054) — the ledger hydration policy.
 *
 * Stage 4 changes `GLEntry.debit/credit/netChange/amount` to `Money`. That is
 * only safe if hydration can turn every persisted amount into a `Money` — and
 * it cannot: DEC-048 permits a stored row `{ debit: 0.004, credit: 0 }`, and
 * there is no `Money` equal to `0.004` at `LEDGER_SCALE` 2.
 *
 * The three ways to handle such a row, and why this module implements the
 * third:
 *
 *   1. **Round it on load** — rejected. Silently discards money (FR-006), and
 *      the value then disagrees with the file it was imported from.
 *   2. **Fail the whole load** — rejected. One legacy row would stop a real
 *      user's ledger from opening at all.
 *   3. **Quarantine the ROW** — this module. The row is kept, byte for byte,
 *      reported with its id and the exact offending value, and excluded from
 *      `Money`-typed aggregates. Nothing is dropped and nothing is rounded.
 *
 * Row-level rather than cell-level on purpose: an entry whose debit cannot be
 * represented has no meaningful net, so keeping half of it would manufacture a
 * second wrong number out of the first.
 *
 * This module is pure classification — it never mutates, never throws, and
 * never decides *when* to run. Before stage 4 lands it is used to explain a
 * refused derived view; after stage 4 lands it is the gate that keeps an
 * unrepresentable row out of `Money`-typed state.
 */
import { hasSubUnitPrecision, LEDGER_SCALE, toDecimal, type MoneyInput } from './money';

/** The `GLEntry` fields that carry money. Kept in one place so a new field is a compile error. */
export const LEDGER_MONEY_FIELDS = ['debit', 'credit', 'netChange', 'amount'] as const;

export type LedgerMoneyField = (typeof LEDGER_MONEY_FIELDS)[number];

/** One amount that cannot become a `Money` at the ledger's scale. */
export interface UnrepresentableAmount {
  readonly field: LedgerMoneyField;
  /** Canonical decimal string — the exact value, never rounded. */
  readonly canonical: string;
  readonly reason: 'sub-cent' | 'non-finite' | 'unparseable';
}

/** A row that must stay out of `Money`-typed state, with every offending field. */
export interface QuarantinedLedgerRow<T> {
  readonly row: T;
  /** Stable identity for reporting; falls back to the row index. */
  readonly rowId: string;
  readonly rowIndex: number;
  readonly issues: readonly UnrepresentableAmount[];
}

export interface LedgerHydrationPartition<T> {
  /** Rows whose every money field is exactly representable, in original order. */
  readonly representable: T[];
  /** Rows kept, never rounded, but excluded from `Money` aggregates. */
  readonly quarantined: readonly QuarantinedLedgerRow<T>[];
}

type MoneyFieldRow = Partial<Record<LedgerMoneyField, unknown>>;

function canonicalise(value: unknown): string | null {
  try {
    const decimal = toDecimal(value as MoneyInput);
    return decimal.isZero() ? '0' : decimal.toFixed();
  } catch {
    return null;
  }
}

/**
 * Classify one row's money fields. Returns `null` when every field can become a
 * `Money`, otherwise the exact list of fields that cannot (never a truncated
 * one — a report that hides the second bad field is a report that sends someone
 * back twice).
 */
export function classifyLedgerRow(row: MoneyFieldRow): UnrepresentableAmount[] | null {
  let issues: UnrepresentableAmount[] | null = null;
  for (const field of LEDGER_MONEY_FIELDS) {
    const value = row[field];
    // An absent field is not an invalid one: `Partial` rows and hand-built
    // fixtures legitimately omit fields, and hydration never invents them.
    if (value === undefined || value === null) continue;

    const canonical = canonicalise(value);
    if (canonical === null) {
      issues ??= [];
      issues.push({
        field,
        canonical: String(value),
        reason: typeof value === 'number' ? 'non-finite' : 'unparseable',
      });
      continue;
    }
    if (hasSubUnitPrecision(canonical)) {
      issues ??= [];
      issues.push({ field, canonical, reason: 'sub-cent' });
    }
  }
  return issues;
}

function identityOf(row: unknown, index: number): string {
  if (row !== null && typeof row === 'object') {
    const id = (row as { id?: unknown }).id;
    if (typeof id === 'string' && id.length > 0) return id;
  }
  return `#${index}`;
}

/**
 * Split persisted rows into what can become `Money` and what cannot.
 *
 * Guarantees, each covered by `ledgerHydration.test.ts`:
 *  - the two halves together hold every input row exactly once — nothing is
 *    dropped, and `representable.length + quarantined.length === entries.length`;
 *  - relative order is preserved on both sides;
 *  - no value is rounded, coerced or defaulted;
 *  - it never throws, because it runs during hydration.
 */
export function partitionLedgerRows<T extends MoneyFieldRow>(
  rows: readonly T[]
): LedgerHydrationPartition<T> {
  const representable: T[] = [];
  const quarantined: QuarantinedLedgerRow<T>[] = [];
  rows.forEach((row, rowIndex) => {
    const issues = classifyLedgerRow(row);
    if (issues === null) {
      representable.push(row);
      return;
    }
    quarantined.push({ row, rowId: identityOf(row, rowIndex), rowIndex, issues });
  });
  return { representable, quarantined };
}

/** Human-readable reason lines for a UI: one per offending amount, row-named. */
export function describeQuarantinedRows(
  quarantined: readonly QuarantinedLedgerRow<unknown>[]
): string[] {
  return quarantined.flatMap((entry) =>
    entry.issues.map(
      (issue) =>
        `Entry ${entry.rowId}: ${issue.field} ${issue.canonical} cannot be represented at ` +
        `${LEDGER_SCALE} decimal places`
    )
  );
}

/** Total money excluded from `Money` aggregates, by field. Never a silent subtraction. */
export function quarantinedFieldCounts(
  quarantined: readonly QuarantinedLedgerRow<unknown>[]
): Record<LedgerMoneyField, number> {
  const counts: Record<LedgerMoneyField, number> = {
    debit: 0,
    credit: 0,
    netChange: 0,
    amount: 0,
  };
  for (const entry of quarantined) {
    for (const issue of entry.issues) counts[issue.field] += 1;
  }
  return counts;
}
