import React, { useState, useMemo } from 'react';
import { History, RotateCcw, Filter, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AllocationResult, AllocationMethod } from '@/engines/AllocationEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AllocationHistoryEntry {
  id: string;
  ruleName: string;
  method: AllocationMethod;
  sourceAccount: string;
  result: AllocationResult;
  executedAt: string;
  executedBy: string;
  status: 'applied' | 'rejected' | 'pending';
}

export interface AllocationHistoryProps {
  entries: AllocationHistoryEntry[];
  onRerun?: (entry: AllocationHistoryEntry) => void;
  onViewDetail?: (entry: AllocationHistoryEntry) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const METHOD_LABELS: Record<AllocationMethod, string> = {
  direct: 'Direct',
  driver: 'Driver',
  'step-down': 'Step-Down',
  reciprocal: 'Reciprocal',
};

const STATUS_STYLES: Record<string, string> = {
  applied: 'bg-green-500/10 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

const HistoryRow: React.FC<{
  entry: AllocationHistoryEntry;
  onRerun?: (entry: AllocationHistoryEntry) => void;
  onViewDetail?: (entry: AllocationHistoryEntry) => void;
}> = ({ entry, onRerun, onViewDetail }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border border-[var(--border-subtle)] rounded-md overflow-hidden"
      role="region"
      aria-label="AllocationHistory"
    >
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
        )}

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--text-primary)] truncate">
            {entry.ruleName}
          </span>

          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
              STATUS_STYLES[entry.status]
            )}
          >
            {entry.status}
          </span>

          <span className="text-[10px] text-slate-500">{METHOD_LABELS[entry.method]}</span>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs font-medium text-blue-400">
            {formatCurrency(entry.result.totalAllocated)}
          </span>
          <span className="text-[10px] text-slate-500">
            {entry.result.allocations.length} targets
          </span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(entry.executedAt)}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 flex flex-col gap-3">
          {/* Meta info */}
          <div className="grid grid-cols-4 gap-3 text-[10px]">
            <div>
              <span className="text-slate-500 block">Source</span>
              <span className="text-[var(--text-primary)]">{entry.sourceAccount}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Method</span>
              <span className="text-[var(--text-primary)]">{METHOD_LABELS[entry.method]}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Executed By</span>
              <span className="text-[var(--text-primary)]">{entry.executedBy}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Rule ID</span>
              <span className="text-[var(--text-primary)] font-mono">{entry.result.ruleId}</span>
            </div>
          </div>

          {/* Allocation breakdown */}
          <div className="overflow-x-auto rounded border border-[var(--border-subtle)]">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-surface)]">
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500" scope="col">
                    Target
                  </th>
                  <th className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500" scope="col">
                    Amount
                  </th>
                  <th className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500" scope="col">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {entry.result.allocations.map((alloc) => (
                  <tr key={alloc.target} className="border-t border-[var(--border-subtle)]">
                    <td className="px-2 py-1 text-xs text-[var(--text-primary)]">{alloc.target}</td>
                    <td className="px-2 py-1 text-xs text-right text-[var(--text-primary)]">
                      {formatCurrency(alloc.amount)}
                    </td>
                    <td className="px-2 py-1 text-xs text-right text-[var(--text-secondary)]">
                      {alloc.percentage.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit trail */}
          <p className="text-[10px] text-slate-500 italic">{entry.result.auditComment}</p>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => onRerun?.(entry)}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              <RotateCcw className="h-3 w-3" />
              Re-run
            </button>
            <button
              type="button"
              onClick={() => onViewDetail?.(entry)}
              className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:border-gray-400"
            >
              View Full Detail
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AllocationHistory: React.FC<AllocationHistoryProps> = ({
  entries,
  onRerun,
  onViewDetail,
  className,
}) => {
  const [methodFilter, setMethodFilter] = useState<AllocationMethod | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (methodFilter !== 'all' && e.method !== methodFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (
        searchTerm &&
        !e.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !e.sourceAccount.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [entries, methodFilter, statusFilter, searchTerm]);

  const totalCount = entries.length;
  const appliedCount = entries.filter((e) => e.status === 'applied').length;
  const totalValue = entries
    .filter((e) => e.status === 'applied')
    .reduce((s, e) => s + e.result.totalAllocated, 0);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Allocation History</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span>{totalCount} total</span>
          <span>{appliedCount} applied</span>
          <span className="text-blue-400 font-medium">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as AllocationMethod | 'all')}
            className="h-7 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 text-[10px] text-[var(--text-primary)] outline-none"
          >
            <option value="all">All Methods</option>
            <option value="direct">Direct</option>
            <option value="driver">Driver</option>
            <option value="step-down">Step-Down</option>
            <option value="reciprocal">Reciprocal</option>
          </select>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-7 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 text-[10px] text-[var(--text-primary)] outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="applied">Applied</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="h-7 flex-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 text-[10px] text-[var(--text-primary)] outline-none placeholder:text-slate-600"
        />
      </div>

      {/* Entries */}
      <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-4">
            {entries.length === 0
              ? 'No allocations executed yet.'
              : 'No allocations match the current filters.'}
          </p>
        ) : (
          filtered.map((entry) => (
            <HistoryRow
              key={entry.id}
              entry={entry}
              onRerun={onRerun}
              onViewDetail={onViewDetail}
            />
          ))
        )}
      </div>
    </div>
  );
};
