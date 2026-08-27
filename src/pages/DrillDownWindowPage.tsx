import { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { DataTable } from '@/components/ui/DataTable';
import { format } from 'date-fns';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { PageHeader } from '@/components/ui/PageHeader';
export default function DrillDownWindowPage() {
  const fmt = useCurrencyFormatter();
  const [searchParams] = useSearchParams();
  const entries = useGLStore((s) => s.entries);

  const title = searchParams.get('title') || 'Transactions';
  const accountPrefix = searchParams.get('accountPrefix') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  useEffect(() => {
    document.title = title;
  }, [title]);

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
    <div className="p-6 bg-slate-950 text-white min-h-screen">
      <div className="space-y-4">
        <PageHeader
          title={title}
          status={
            <span className="flex items-center gap-4 text-sm text-slate-400">
              <span>{filteredEntries.length} transactions found</span>
              {accountPrefix && <span>Filtering by Account: {accountPrefix}*</span>}
            </span>
          }
        />
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
          <DataTable
            data={filteredEntries}
            columns={columns}
            pageSize={15}
            caption="Detail data table"
            ariaLabel="Drill-down detail data table"
          />
        </div>
      </div>
    </div>
  );
}
