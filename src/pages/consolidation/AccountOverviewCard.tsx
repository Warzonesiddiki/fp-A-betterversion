import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { AccountBreakdownRow } from './accountOverview';

interface AccountOverviewCardProps {
  accountBreakdown: AccountBreakdownRow[];
}

const columns: Column[] = [
  { key: 'accountCode', header: 'Account Code', sortable: true },
  { key: 'accountName', header: 'Account Name', sortable: true },
  { key: 'debit', header: 'Debit', align: 'right', sortable: true },
  { key: 'credit', header: 'Credit', align: 'right', sortable: true },
  { key: 'netChange', header: 'Net Change', align: 'right', sortable: true },
  { key: 'transactions', header: 'Transactions', align: 'right', sortable: true },
];

export const AccountOverviewCard: React.FC<AccountOverviewCardProps> = ({ accountBreakdown }) => {
  const tableData = useMemo(
    () =>
      accountBreakdown.map((row) => ({
        accountCode: row.accountCode,
        accountName: row.accountName,
        debit: formatCurrency(row.debit),
        credit: formatCurrency(row.credit),
        netChange: formatCurrency(row.netChange),
        transactions: formatNumber(row.transactions),
      })),
    [accountBreakdown]
  );

  return (
    <Card aria-label="Consolidated Accounts" aria-live="polite">
      <CardHeader>
        <CardTitle id="consolidated-title">Consolidated Accounts Overview</CardTitle>
      </CardHeader>
      <CardContent aria-labelledby="consolidated-title">
        {tableData.length > 0 ? (
          <DataTable
            columns={columns}
            data={tableData}
            sortable
            caption="Consolidation accounts table"
            ariaLabel="Consolidation accounts"
          />
        ) : (
          <p className="text-[var(--text-muted)]">No account data available.</p>
        )}
      </CardContent>
    </Card>
  );
};
