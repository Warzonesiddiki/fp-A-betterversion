/**
 * Q5 stage 4 — the quarantine surface (DEC-057).
 *
 * WHY THIS EXISTS
 * ---------------
 * The hydrate gate can hold a persisted row back from `Money`-typed state: a
 * row whose amount is not representable at `LEDGER_SCALE` (a sub-cent value, an
 * unparseable string, a non-finite number) is kept verbatim and excluded from
 * every `Money` aggregate. Correct — but until now *nothing on screen said so*.
 *
 * A silently smaller total is a wrong total that nobody can see. This notice is
 * the honest other half of the gate: it names how many rows are out, which
 * field put each one out, and the exact stored value, on the page whose totals
 * they are missing from.
 *
 * Copy rules: state the count and the reason, never soften it, and never imply
 * the rows were rounded or repaired — they were not.
 */
import { AlertTriangle } from 'lucide-react';

import { useGLStore } from '@/store/glStore';
import {
  describeQuarantinedRows,
  quarantinedFieldCounts,
  LEDGER_MONEY_FIELDS,
  type LedgerMoneyField,
  type QuarantinedLedgerRow,
} from '@/utils/ledgerHydration';
import { LEDGER_SCALE } from '@/utils/money';

/** Reasons shown in the expanded list before it is summarised. */
export const QUARANTINE_REASON_LIMIT = 20;

export interface QuarantineSummary {
  /** Rows held back — each counted once however many fields it offends. */
  readonly rowCount: number;
  /** Individual offending amounts across those rows. */
  readonly issueCount: number;
  /** One row-named line per offending amount, in hydration order. */
  readonly reasons: readonly string[];
  /** Offending amount count per money field. */
  readonly byField: Readonly<Record<LedgerMoneyField, number>>;
}

/**
 * Everything the notice renders, derived once. Pure so the copy is testable
 * without a DOM: a summary that miscounts is a summary that lies.
 */
export function summarizeQuarantinedLedger(
  quarantined: readonly QuarantinedLedgerRow<unknown>[]
): QuarantineSummary {
  return {
    rowCount: quarantined.length,
    issueCount: quarantined.reduce((total, entry) => total + entry.issues.length, 0),
    reasons: describeQuarantinedRows(quarantined),
    byField: quarantinedFieldCounts(quarantined),
  };
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export function LedgerQuarantineNotice({ className = '' }: { className?: string }) {
  const quarantined = useGLStore((s) => s.quarantinedEntries);
  if (quarantined.length === 0) return null;

  const summary = summarizeQuarantinedLedger(quarantined);
  const shown = summary.reasons.slice(0, QUARANTINE_REASON_LIMIT);
  const hidden = summary.reasons.length - shown.length;

  return (
    <section
      role="status"
      aria-label="Ledger rows excluded from totals"
      className={`rounded-lg border border-[var(--warning)] bg-[var(--warning-subtle)] px-4 py-3 text-sm text-[var(--warning)] ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-2">
          <p className="font-semibold">
            {summary.rowCount} ledger {plural(summary.rowCount, 'row', 'rows')} held back from the
            totals on this page
          </p>
          <p className="text-[var(--text-secondary)]">
            {plural(summary.rowCount, 'It was', 'They were')} loaded from a previous session with an
            amount that cannot be represented at {LEDGER_SCALE} decimal places. The{' '}
            {plural(summary.rowCount, 'row is', 'rows are')} stored exactly as saved — not rounded,
            not repaired — and excluded from every money total, so the figures here are smaller than
            the ledger on disk by that amount.
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
            {LEDGER_MONEY_FIELDS.filter((field) => summary.byField[field] > 0).map((field) => (
              <li key={field}>
                <span className="uppercase tracking-wide">{field}</span>{' '}
                <span className="tabular-nums">{summary.byField[field]}</span>
              </li>
            ))}
          </ul>
          <details className="text-xs">
            <summary className="cursor-pointer text-[var(--warning)]">
              Why each row was held back
            </summary>
            <ul className="mt-2 space-y-1 font-mono">
              {shown.map((reason, index) => (
                <li key={`${index}:${reason}`}>{reason}</li>
              ))}
              {hidden > 0 && <li className="font-sans">and {hidden} more</li>}
            </ul>
          </details>
        </div>
      </div>
    </section>
  );
}
