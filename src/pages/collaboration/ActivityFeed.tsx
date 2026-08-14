import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useCollaborationStore } from '@/store/collaborationStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Activity, DollarSign, Users, TrendingUp } from 'lucide-react';
import type { GLEntry } from '@/types';
import { roundTo, sumMoney } from '@/utils/money';
import { PageHeader } from '@/components/ui/PageHeader';

function computeActivityStats(entries: readonly GLEntry[]) {
  const totalDebit = roundTo(sumMoney(entries.map((e) => e.debit)), 2);
  const totalCredit = roundTo(sumMoney(entries.map((e) => e.credit)), 2);
  const netChange = roundTo(sumMoney(entries.map((e) => e.netChange)), 2);
  const uniqueAccounts = new Set(entries.map((e) => e.accountCode)).size;

  const accountMap = new Map<
    string,
    { name: string; debit: number; credit: number; net: number; count: number }
  >();
  for (const e of entries) {
    const existing = accountMap.get(e.accountCode) ?? {
      name: e.accountName,
      debit: 0,
      credit: 0,
      net: 0,
      count: 0,
    };
    existing.debit += e.debit;
    existing.credit += e.credit;
    existing.net += e.netChange;
    existing.count += 1;
    accountMap.set(e.accountCode, existing);
  }

  const accountBreakdown = Array.from(accountMap.entries())
    .map(([code, data]) => ({
      accountCode: code,
      accountName: data.name,
      debit: data.debit,
      credit: data.credit,
      netChange: data.net,
      transactions: data.count,
    }))
    .sort((a, b) => Math.abs(b.credit) - Math.abs(a.credit));

  return { totalDebit, totalCredit, netChange, uniqueAccounts, accountBreakdown };
}

const columns: Column[] = [
  { key: 'accountCode', header: 'Account Code', sortable: true },
  { key: 'accountName', header: 'Account Name', sortable: true },
  { key: 'debit', header: 'Debit', align: 'right', sortable: true },
  { key: 'credit', header: 'Credit', align: 'right', sortable: true },
  { key: 'netChange', header: 'Net Change', align: 'right', sortable: true },
  { key: 'transactions', header: 'Transactions', align: 'right', sortable: true },
];

export function ActivityFeed() {
  const { entries } = useGLStore();
  const { activityLog, comments, tasks } = useCollaborationStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Activity Feed';
  }, []);

  const stats = useMemo(() => computeActivityStats(entries), [entries]);

  const tableData = useMemo(
    () =>
      stats.accountBreakdown.map((row) => ({
        accountCode: row.accountCode,
        accountName: row.accountName,
        debit: formatCurrency(row.debit),
        credit: formatCurrency(row.credit),
        netChange: formatCurrency(row.netChange),
        transactions: formatNumber(row.transactions),
      })),
    [stats.accountBreakdown]
  );

  const handleImportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/data/gl-upload');
    }
  };

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Activity Feed - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Activity className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Activity Feed Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view activity feed.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view activity feed"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main
      className="p-6 space-y-6 animate-fade-in"
      role="main"
      aria-label="Activity Feed Dashboard"
    >
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <PageHeader
        title="Activity Feed"
        titleId="activity-heading"
        status={
          <span className="text-sm text-[var(--text-muted)]">
            {formatNumber(entries.length)} entries imported
          </span>
        }
      />
      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Activity KPIs"
        aria-labelledby="activity-heading"
      >
        <KPIValue
          label="Total Activities"
          value={formatNumber(activityLog.length)}
          icon={<Activity className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Comments"
          value={formatNumber(comments.length)}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Tasks"
          value={formatNumber(tasks.length)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Accounts"
          value={formatNumber(stats.uniqueAccounts)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        />
      </section>
      <h2 className="sr-only">Feed Data</h2>
      <Card aria-label="Account Overview" aria-live="polite">
        <CardHeader>
          <CardTitle id="account-overview-title">Account Overview</CardTitle>
        </CardHeader>
        <CardContent aria-labelledby="account-overview-title">
          {tableData.length > 0 ? (
            <DataTable
              columns={columns}
              data={tableData}
              sortable
              caption="Activity feed table"
              ariaLabel="Activity feed"
            />
          ) : (
            <p className="text-[var(--text-muted)]">No account data available.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default ActivityFeed;
