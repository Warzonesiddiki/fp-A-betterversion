import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { AccountBreakdownRow } from './accountOverview';

interface AccountOverviewCardProps {
  rows: readonly AccountBreakdownRow[];
}

function netChangeClass(netChange: number): string | undefined {
  if (netChange > 0) return 'text-[#16A34A]';
  if (netChange < 0) return 'text-[#DC2626]';
  return undefined;
}

export function AccountOverviewCard({ rows }: AccountOverviewCardProps) {
  const fmt = useCurrencyFormatter();

  const columns: Column<AccountBreakdownRow>[] = [
    { key: 'accountCode', header: 'Account Code', sortable: true },
    { key: 'accountName', header: 'Account Name', sortable: true },
    {
      key: 'debit',
      header: 'Debit',
      align: 'right',
      sortable: true,
      render: (_, r) => fmt.currency(r.debit),
    },
    {
      key: 'credit',
      header: 'Credit',
      align: 'right',
      sortable: true,
      render: (_, r) => fmt.currency(r.credit),
    },
    {
      key: 'netChange',
      header: 'Net Change',
      align: 'right',
      sortable: true,
      render: (_, r) => (
        <span className={netChangeClass(r.netChange)}>{fmt.currency(r.netChange)}</span>
      ),
    },
    {
      key: 'transactions',
      header: 'Transactions',
      align: 'right',
      sortable: true,
      render: (_, r) => fmt.number(r.transactions),
    },
  ];

  return (
    <Card aria-label="Account Overview" aria-live="polite">
      <CardHeader>
        <CardTitle id="account-overview-title">Account Overview</CardTitle>
      </CardHeader>
      <CardContent aria-labelledby="account-overview-title">
        {rows.length > 0 ? (
          <DataTable
            columns={columns}
            data={[...rows]}
            sortable
            caption="Account overview table"
            ariaLabel="Account overview data table for insurance sector"
          />
        ) : (
          <p className="text-[var(--text-muted)]">No account data available.</p>
        )}
      </CardContent>
    </Card>
  );
}
