import { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeftRight,
  Check,
  X,
  Pencil,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AllocationResult, AllocationEntry } from '@/engines/AllocationEngine';
import { AllocationJournalTable } from './AllocationJournalTable';
import type { JournalEntry } from './AllocationJournalTable';
import { formatPercent as formatPercentLocal } from '@/utils/financialFormatting';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { JournalEntry };

export interface AllocationPreviewProps {
  result: AllocationResult | AllocationResult[];
  sourceLabel?: string;
  sourceAmount?: number;
  onAccept?: (entries: JournalEntry[]) => void;
  onReject?: () => void;
  onModify?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatAllocPct(value: number): string {
  return formatPercentLocal(value, 2);
}

function generateJournalEntries(results: AllocationResult[], sourceLabel: string): JournalEntry[] {
  const entries: JournalEntry[] = [];
  for (const result of results) {
    for (const alloc of result.allocations) {
      entries.push({
        id: `je-${result.ruleId}-${alloc.target}-${Date.now()}`,
        debitAccount: alloc.target,
        creditAccount: sourceLabel,
        amount: alloc.amount,
        memo: result.auditComment,
        timestamp: result.timestamp,
      });
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Subcomponent: Before/After Bar
// ---------------------------------------------------------------------------

function BeforeAfterBar({
  before,
  after,
  label,
}: {
  before: number;
  after: number;
  label: string;
}) {
  const max = Math.max(before, after, 1);
  const isIncrease = after > before;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-secondary)] truncate">{label}</span>
        <span className="text-[10px] font-medium text-[var(--text-primary)]">
          {formatCurrency(after)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex-1 h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden flex">
          {before > 0 && (
            <div
              className="h-full bg-slate-500/40 transition-all"
              style={{ width: `${(before / max) * 100}%` }}
            />
          )}
          <div
            className={cn('h-full transition-all', isIncrease ? 'bg-blue-500' : 'bg-green-500')}
            style={{ width: `${((after - before) / max) * 100}%` }}
          />
        </div>
        {isIncrease ? (
          <TrendingUp className="h-3 w-3 text-blue-400 shrink-0" />
        ) : after < before ? (
          <TrendingDown className="h-3 w-3 text-green-400 shrink-0" />
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AllocationPreview({
  result,
  sourceLabel = 'Source Account',
  sourceAmount = 0,
  onAccept,
  onReject,
  onModify,
  className,
}: AllocationPreviewProps) {
  const [accepted, setAccepted] = useState(false);

  const results = useMemo<AllocationResult[]>(
    () => (Array.isArray(result) ? result : [result]),
    [result]
  );
  const allAllocations = useMemo<AllocationEntry[]>(
    () => results.flatMap((r) => r.allocations),
    [results]
  );
  const totalAllocated = useMemo(
    () => allAllocations.reduce((s, a) => s + a.amount, 0),
    [allAllocations]
  );
  const journalEntries = useMemo(
    () => generateJournalEntries(results, sourceLabel),
    [results, sourceLabel]
  );

  const remaining = sourceAmount - totalAllocated;
  const isBalanced = Math.abs(remaining) < 0.01;

  const byTarget = useMemo(() => {
    const map = new Map<string, number>();
    for (const alloc of allAllocations)
      map.set(alloc.target, (map.get(alloc.target) ?? 0) + alloc.amount);
    return map;
  }, [allAllocations]);

  const handleAccept = () => {
    setAccepted(true);
    onAccept?.(journalEntries);
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)]',
        accepted && 'border-green-500/50',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Allocation Preview</h3>
        </div>
        <span className="text-[10px] text-slate-500">
          {results.length} rule{results.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div className="rounded-md border border-[var(--border-subtle)] p-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Source</span>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {formatCurrency(sourceAmount)}
          </p>
          <p className="text-[10px] text-slate-500">{sourceLabel}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-500" />
        <div className="rounded-md border border-[var(--border-subtle)] p-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Allocated</span>
          <p className="text-sm font-semibold text-blue-400">{formatCurrency(totalAllocated)}</p>
          <p className="text-[10px] text-slate-500">
            {allAllocations.length} target{allAllocations.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {!isBalanced && sourceAmount > 0 && (
        <div
          className={cn(
            'rounded-md px-3 py-2 text-xs',
            remaining > 0
              ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          )}
        >
          <ArrowLeftRight className="inline h-3.5 w-3.5 mr-1" />
          {remaining > 0 ? 'Remaining' : 'Over-allocated'}: {formatCurrency(Math.abs(remaining))}
        </div>
      )}

      {byTarget.size > 0 && sourceAmount > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-400">Before / After</span>
          {Array.from(byTarget.entries()).map(([target, amount]) => (
            <BeforeAfterBar key={target} before={0} after={amount} label={target} />
          ))}
        </div>
      )}

      {allAllocations.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-[var(--border-subtle)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <th
                  className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase"
                  scope="col"
                >
                  Target
                </th>
                <th
                  className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase"
                  scope="col"
                >
                  Percentage
                </th>
                <th
                  className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase"
                  scope="col"
                >
                  Amount
                </th>
                <th
                  className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase"
                  scope="col"
                >
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody>
              {allAllocations.map((entry, i) => {
                const effPct =
                  sourceAmount > 0 ? (entry.amount / sourceAmount) * 100 : entry.percentage;
                return (
                  <tr
                    key={`${entry.target}-${i}`}
                    className={cn(
                      'border-t border-[var(--border-subtle)]',
                      i % 2 !== 0 && 'bg-[var(--bg-elevated)]/30'
                    )}
                  >
                    <td className="px-3 py-1.5 text-xs text-[var(--text-primary)] font-medium">
                      {entry.target}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-right text-[var(--text-secondary)]">
                      {formatAllocPct(entry.percentage)}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-right text-[var(--text-primary)] font-medium">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="w-20 h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden ml-auto">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${Math.min(effPct, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <td className="px-3 py-2 text-xs font-semibold text-[var(--text-primary)]">
                  Total
                </td>
                <td className="px-3 py-2 text-xs text-right font-semibold text-[var(--text-primary)]">
                  {formatAllocPct(allAllocations.reduce((s, e) => s + e.percentage, 0))}
                </td>
                <td className="px-3 py-2 text-xs text-right font-semibold text-blue-400">
                  {formatCurrency(totalAllocated)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {journalEntries.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-400">Journal Entries</span>
          <AllocationJournalTable entries={journalEntries} />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400">Audit Trail</span>
        {results.map((r) => (
          <div key={r.ruleId} className="flex items-start gap-2 text-[10px] text-slate-500">
            <span className="font-mono text-[var(--text-secondary)] shrink-0">[{r.ruleId}]</span>
            <span className="italic">{r.auditComment}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
        {!accepted ? (
          <>
            <button
              type="button"
              onClick={handleAccept}
              className="flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <Check className="h-3.5 w-3.5" /> Accept & Post
            </button>
            <button
              type="button"
              onClick={onModify}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <Pencil className="h-3.5 w-3.5" /> Modify
            </button>
            <button
              type="button"
              onClick={onReject}
              className="flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <Check className="h-4 w-4" /> Accepted - {journalEntries.length} journal entries posted
          </div>
        )}
      </div>
    </div>
  );
}
