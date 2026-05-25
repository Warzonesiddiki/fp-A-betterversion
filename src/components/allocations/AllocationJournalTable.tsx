import { cn } from '@/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JournalEntry {
  id: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  memo: string;
  timestamp: string;
}

export interface AllocationJournalTableProps {
  entries: JournalEntry[];
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AllocationJournalTable({ entries, className }: AllocationJournalTableProps) {
  return (
    <div
      className={cn('overflow-x-auto rounded-md border border-[var(--border-subtle)]', className)}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">
              Account
            </th>
            <th className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase">
              Debit
            </th>
            <th className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase">
              Credit
            </th>
            <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">
              Memo
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((je, i) => (
            <tr
              key={je.id}
              className={cn(
                'border-t border-[var(--border-subtle)]',
                i % 2 !== 0 && 'bg-[var(--bg-elevated)]/30'
              )}
            >
              <td className="px-3 py-1.5 text-xs text-[var(--text-primary)]">
                <div className="flex flex-col">
                  <span className="font-medium">DR {je.debitAccount}</span>
                  <span className="text-[10px] text-slate-500">CR {je.creditAccount}</span>
                </div>
              </td>
              <td className="px-3 py-1.5 text-xs text-right text-green-400 font-medium">
                {formatCurrency(je.amount)}
              </td>
              <td className="px-3 py-1.5 text-xs text-right text-red-400 font-medium">
                {formatCurrency(je.amount)}
              </td>
              <td className="px-3 py-1.5 text-[10px] text-[var(--text-secondary)] max-w-[200px] truncate">
                {je.memo}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
