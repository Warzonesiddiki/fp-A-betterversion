import { Layers, FileText, BookOpen, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { roundTo, sumMoney } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import type { SummaryRow, DetailRow, JournalEntry } from './DrillThroughChain';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
/**
 * GAP-1 (F-0006) — exact-decimal journal-entry totals.
 *
 * Previously `data.reduce((sum, e) => sum + e.debit, 0)` — raw IEEE-754 float
 * addition. Debit/credit totals feed the footer `Total` row rendered to users
 * as financial truth (a balanced journal requires totalDebit === totalCredit
 * to the cent). Exported so *.money.test.ts can pin exact known answers.
 */
export function computeJournalTotals(data: readonly Pick<JournalEntry, 'debit' | 'credit'>[]): {
  totalDebit: number;
  totalCredit: number;
} {
  const totalDebit = roundTo(sumMoney(data.map((e) => e.debit)));
  const totalCredit = roundTo(sumMoney(data.map((e) => e.credit)));
  return { totalDebit, totalCredit };
}

function varianceColor(value: number): string {
  if (Math.abs(value) < 0.01) return 'text-[var(--text-tertiary)]';
  return value > 0 ? 'text-[var(--text-positive)]' : 'text-[var(--color-error)]';
}

// --- Summary Table ---

export function SummaryTable({
  data,
  onSelect,
}: {
  data: readonly SummaryRow[];
  onSelect: (row: SummaryRow) => void;
}) {
  const fmt = useCurrencyFormatter();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="grid" aria-label="Summary view">
        <thead>
          <tr className="border-b border-[var(--border-default)] text-left">
            <th className="px-4 py-3 font-medium text-[var(--text-secondary)]" scope="col">
              Category
            </th>
            <th
              className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]"
              scope="col"
            >
              Actual
            </th>
            <th
              className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]"
              scope="col"
            >
              Budget
            </th>
            <th
              className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]"
              scope="col"
            >
              Variance
            </th>
            <th
              className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]"
              scope="col"
            >
              Var %
            </th>
            <th className="w-10 px-4 py-3" scope="col" />
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-hover)]"
              onClick={() => onSelect(row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(row);
                }
              }}
              tabIndex={0}
              role="row"
              aria-label={`${row.category}: actual ${fmt.currency0(row.actual)}, budget ${fmt.currency0(row.budget)}`}
            >
              <td className="flex items-center gap-2 px-4 py-3 font-medium text-[var(--text-primary)]">
                <Layers className="h-4 w-4 text-[var(--text-accent)]" />
                {row.category}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[var(--text-primary)]">
                {fmt.currency0(row.actual)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[var(--text-secondary)]">
                {fmt.currency0(row.budget)}
              </td>
              <td className={cn('px-4 py-3 text-right tabular-nums', varianceColor(row.variance))}>
                {fmt.currency0(row.variance)}
              </td>
              <td className={cn('px-4 py-3 text-right tabular-nums', varianceColor(row.variance))}>
                {formatPercent(row.variancePct, 1)}
              </td>
              <td className="px-4 py-3 text-right">
                <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Detail Table ---

export function DetailTable({
  data,
  category,
  onSelect,
}: {
  data: readonly DetailRow[];
  category: string;
  onSelect: (row: DetailRow) => void;
}) {
  const fmt = useCurrencyFormatter();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <FileText className="h-4 w-4" />
        <span>
          Showing line items for <strong className="text-[var(--text-primary)]">{category}</strong>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid" aria-label="Detail view">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-left">
              <th className="px-4 py-3 font-medium text-[var(--text-secondary)]" scope="col">
                Line Item
              </th>
              <th className="px-4 py-3 font-medium text-[var(--text-secondary)]" scope="col">
                Account
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]"
                scope="col"
              >
                Actual
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]"
                scope="col"
              >
                Budget
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]"
                scope="col"
              >
                Variance
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]"
                scope="col"
              >
                Var %
              </th>
              <th className="w-10 px-4 py-3" scope="col" />
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-[var(--border-subtle)] transition-colors',
                  row.entries && row.entries.length > 0
                    ? 'cursor-pointer hover:bg-[var(--surface-hover)]'
                    : ''
                )}
                onClick={() => {
                  if (row.entries && row.entries.length > 0) onSelect(row);
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === 'Enter' || e.key === ' ') &&
                    row.entries &&
                    row.entries.length > 0
                  ) {
                    e.preventDefault();
                    onSelect(row);
                  }
                }}
                tabIndex={row.entries && row.entries.length > 0 ? 0 : -1}
                role="row"
              >
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{row.lineItem}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-tertiary)]">
                  {row.accountCode}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--text-primary)]">
                  {fmt.currency0(row.actual)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--text-secondary)]">
                  {fmt.currency0(row.budget)}
                </td>
                <td
                  className={cn('px-4 py-3 text-right tabular-nums', varianceColor(row.variance))}
                >
                  {fmt.currency0(row.variance)}
                </td>
                <td
                  className={cn('px-4 py-3 text-right tabular-nums', varianceColor(row.variance))}
                >
                  {formatPercent(row.variancePct, 1)}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.entries && row.entries.length > 0 && (
                    <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Journal Entry Table ---

export function JournalEntryTable({
  data,
  lineItem,
}: {
  data: readonly JournalEntry[];
  lineItem: string;
}) {
  const fmt = useCurrencyFormatter();
  const { totalDebit, totalCredit } = computeJournalTotals(data);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <BookOpen className="h-4 w-4" />
        <span>
          Journal entries for <strong className="text-[var(--text-primary)]">{lineItem}</strong>
        </span>
        <span className="ml-auto text-xs text-[var(--text-tertiary)]">
          {data.length} {data.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid" aria-label="Journal entries">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-left">
              <th className="px-4 py-3 font-medium text-[var(--text-secondary)]" scope="col">
                Date
              </th>
              <th className="px-4 py-3 font-medium text-[var(--text-secondary)]" scope="col">
                Account
              </th>
              <th className="px-4 py-3 font-medium text-[var(--text-secondary)]" scope="col">
                Description
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]"
                scope="col"
              >
                Debit
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]"
                scope="col"
              >
                Credit
              </th>
              <th className="px-4 py-3 font-medium text-[var(--text-secondary)]" scope="col">
                Reference
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-hover)]"
                role="row"
              >
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-primary)]">
                  {entry.date}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-tertiary)]">
                  {entry.accountCode}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{entry.description}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--text-primary)]">
                  {entry.debit > 0 ? fmt.currency0(entry.debit) : ''}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--text-primary)]">
                  {entry.credit > 0 ? fmt.currency0(entry.credit) : ''}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-tertiary)]">
                  {entry.reference}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--border-default)] font-medium">
              <td colSpan={3} className="px-4 py-3 text-right text-[var(--text-secondary)]">
                Total
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[var(--text-primary)]">
                {fmt.currency0(totalDebit)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[var(--text-primary)]">
                {fmt.currency0(totalCredit)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
