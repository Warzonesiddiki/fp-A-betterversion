import { useMemo } from 'react';
import { useGLStore } from '@/store/glStore';
import { Modal } from './Modal';
import { DataTable } from './DataTable';
import { format } from 'date-fns';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  accountPrefix?: string;
  startDate?: string;
  endDate?: string;
}
export function DrillDownModal({
  isOpen,
  onClose,
  title,
  accountPrefix,
  startDate,
  endDate,
}: DrillDownModalProps) {
  const fmt = useCurrencyFormatter();
  const entries = useGLStore((s) => s.entries);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchAccount = accountPrefix ? (e.accountCode || '').startsWith(accountPrefix) : true;
      const matchStart = startDate ? e.date >= startDate : true;
      const matchEnd = endDate ? e.date <= endDate : true;
      return matchAccount && matchStart && matchEnd;
    });
  }, [entries, accountPrefix, startDate, endDate]);

  const columns: Array<{
    header: string;
    key: string;
    render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  }> = [
    {
      header: 'Date',
      key: 'date',
      render: (_: unknown, row: Record<string, unknown>) =>
        format(new Date(row.date as string), 'MMM d, yyyy'),
    },
    { header: 'Account', key: 'accountCode' },
    { header: 'Description', key: 'description' },
    {
      header: 'Debit',
      key: 'debit',
      render: (v: unknown) => fmt.currency(v as number),
    },
    {
      header: 'Credit',
      key: 'credit',
      render: (v: unknown) => fmt.currency(v as number),
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm text-[var(--text-muted)]">
          <span>{filteredEntries.length} transactions found</span>
          {accountPrefix && <span>Filtering by Account: {accountPrefix}*</span>}
        </div>
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <DataTable
            data={filteredEntries}
            columns={columns}
            pageSize={10}
            caption={`General ledger drill-down transactions${accountPrefix ? ' filtered by account prefix ' + accountPrefix : ''}: ${filteredEntries.length} entries`}
            ariaLabel="Drill-down transactions table"
          />
        </div>
      </div>
    </Modal>
  );
}
