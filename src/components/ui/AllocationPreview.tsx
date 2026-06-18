import React, { useState, useCallback } from 'react';
import { Check, X, Pencil, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AllocationResult, AllocationEntry } from '@/engines/AllocationEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AllocationPreviewProps {
  result: AllocationResult;
  sourceLabel?: string;
  sourceAmount?: number;
  onAccept?: (result: AllocationResult) => void;
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

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

const AllocationRow: React.FC<{
  entry: AllocationEntry;
  sourceAmount: number;
  index: number;
}> = ({ entry, sourceAmount, index }) => {
  const effectivePct = sourceAmount > 0 ? (entry.amount / sourceAmount) * 100 : 0;

  return (
    <tr
      className={cn(
        'transition-colors hover:bg-[var(--bg-elevated)]',
        index % 2 === 0 ? 'bg-transparent' : 'bg-[var(--bg-elevated)]/50'
      )}
    >
      <td className="px-3 py-2 text-xs text-[var(--text-primary)] font-medium">{entry.target}</td>
      <td className="px-3 py-2 text-xs text-right text-[var(--text-secondary)]">
        {formatPercent(entry.percentage)}
      </td>
      <td className="px-3 py-2 text-xs text-right text-[var(--text-primary)] font-medium">
        {formatCurrency(entry.amount)}
      </td>
      <td className="px-3 py-2 text-xs text-right text-[var(--text-secondary)]">
        {formatPercent(effectivePct)}
      </td>
      <td className="px-3 py-2 text-right">
        {/* Visual bar */}
        <div className="flex items-center gap-2 justify-end">
          <div className="w-24 h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(effectivePct, 100)}%` }}
            />
          </div>
        </div>
      </td>
    </tr>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AllocationPreview: React.FC<AllocationPreviewProps> = ({
  result,
  sourceLabel = 'Source',
  sourceAmount = 0,
  onAccept,
  onReject,
  onModify,
  className,
}) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = useCallback(() => {
    setAccepted(true);
    onAccept?.(result);
  }, [onAccept, result]);

  const remaining = sourceAmount - result.totalAllocated;
  const isBalanced = Math.abs(remaining) < 0.01;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)]',
        accepted && 'border-green-500/50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Allocation Preview</h3>
        </div>
        <span className="text-[10px] text-slate-500">
          {new Date(result.timestamp).toLocaleString()}
        </span>
      </div>

      {/* Before / After Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1 rounded-md border border-[var(--border-subtle)] p-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Source</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {formatCurrency(sourceAmount)}
          </span>
          <span className="text-[10px] text-slate-500">{sourceLabel}</span>
        </div>

        <div className="flex flex-col items-center justify-center">
          <ArrowRight className="h-5 w-5 text-slate-500" />
        </div>

        <div className="flex flex-col gap-1 rounded-md border border-[var(--border-subtle)] p-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Allocated</span>
          <span className="text-sm font-semibold text-blue-400">
            {formatCurrency(result.totalAllocated)}
          </span>
          <span className="text-[10px] text-slate-500">
            {result.allocations.length} target{result.allocations.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Remaining indicator */}
      {!isBalanced && (
        <div
          className={cn(
            'rounded-md px-3 py-2 text-xs',
            remaining > 0
              ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          )}
        >
          {remaining > 0 ? 'Remaining' : 'Over-allocated'}: {formatCurrency(Math.abs(remaining))}
        </div>
      )}

      {/* Allocation Table */}
      {result.allocations.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-[var(--border-subtle)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <th
                  className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wide"
                  scope="col"
                >
                  Target
                </th>
                <th
                  className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wide"
                  scope="col"
                >
                  Percentage
                </th>
                <th
                  className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wide"
                  scope="col"
                >
                  Amount
                </th>
                <th
                  className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wide"
                  scope="col"
                >
                  Effective %
                </th>
                <th
                  className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wide"
                  scope="col"
                >
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody>
              {result.allocations.map((entry, i) => (
                <AllocationRow
                  key={entry.target}
                  entry={entry}
                  sourceAmount={sourceAmount}
                  index={i}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <td className="px-3 py-2 text-xs font-semibold text-[var(--text-primary)]">
                  Total
                </td>
                <td className="px-3 py-2 text-xs text-right font-semibold text-[var(--text-primary)]">
                  {formatPercent(result.allocations.reduce((s, e) => s + e.percentage, 0))}
                </td>
                <td className="px-3 py-2 text-xs text-right font-semibold text-blue-400">
                  {formatCurrency(result.totalAllocated)}
                </td>
                <td className="px-3 py-2 text-xs text-right font-semibold text-[var(--text-primary)]">
                  {sourceAmount > 0
                    ? formatPercent((result.totalAllocated / sourceAmount) * 100)
                    : '—'}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Journal Entry Preview */}
      {result.allocations.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-300">
            Journal Entries
          </span>
          <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 font-mono text-xs">
            {result.allocations.map((entry) => (
              <div key={entry.target} className="flex justify-between py-0.5">
                <span className="text-[var(--text-secondary)]">DR {entry.target}</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(entry.amount)}</span>
              </div>
            ))}
            <div className="border-t border-[var(--border-subtle)] mt-1 pt-1 flex justify-between">
              <span className="text-[var(--text-secondary)]">CR {sourceLabel}</span>
              <span className="text-[var(--text-primary)]">
                {formatCurrency(result.totalAllocated)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Audit Comment */}
      <div className="text-[10px] text-slate-500 italic">{result.auditComment}</div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
        {!accepted ? (
          <>
            <button
              type="button"
              onClick={handleAccept}
              className="flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              type="button"
              onClick={onModify}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-gray-400"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modify
            </button>
            <button
              type="button"
              onClick={onReject}
              className="flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <Check className="h-4 w-4" />
            Accepted
          </div>
        )}
      </div>
    </div>
  );
};
