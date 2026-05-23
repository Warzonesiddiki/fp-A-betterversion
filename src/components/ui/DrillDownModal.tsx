import { useMemo } from 'react';
import { useGLStore } from '@/store/glStore';
import { Modal } from './Modal';
import { DataTable } from './DataTable';
import { format } from 'date-fns';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  accountPrefix?: string;
  startDate?: string;
  endDate?: string;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function DrillDownModal({
  isOpen,
  onClose,
  title,
  accountPrefix,
  startDate,
  endDate,
}: DrillDownModalProps) {
  const { entries } = useGLStore();

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchAccount = accountPrefix ? (e.accountCode || '').startsWith(accountPrefix) : true;
      const matchStart = startDate ? e.date >= startDate : true;
      const matchEnd = endDate ? e.date <= endDate : true;
      return matchAccount && matchStart && matchEnd;
    });
  }, [entries, accountPrefix, startDate, endDate]);

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (info: { getValue: () => string | number | Date }) =>
        format(new Date(info.getValue()), 'MMM d, yyyy'),
    },
    { header: 'Account', accessorKey: 'accountCode' },
    { header: 'Description', accessorKey: 'description' },
    {
      header: 'Debit',
      accessorKey: 'debit',
      cell: (info: { getValue: () => number }) => formatCurrency(info.getValue()),
    },
    {
      header: 'Credit',
      accessorKey: 'credit',
      cell: (info: { getValue: () => number }) => formatCurrency(info.getValue()),
    },
    {
      header: 'Net',
      id: 'net',
      cell: (info: { row: { original: Record<string, number> } }) => {
        const row = info.row.original;
        return formatCurrency(row.debit - row.credit);
      },
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm text-slate-400">
          <span>{filteredEntries.length} transactions found</span>
          {accountPrefix && <span>Filtering by Account: {accountPrefix}*</span>}
        </div>
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <DataTable data={filteredEntries} columns={columns} pageSize={10} />
        </div>
      </div>
    </Modal>
  );
}
