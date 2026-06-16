import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useInsuranceStore } from '@/store/insuranceStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { formatCurrency, formatNumber, formatCompactNumber } from '@/utils/formatters';
import { Shield, DollarSign, Layers, TrendingUp } from 'lucide-react';
import type { GLEntry } from '@/types';

function computeInsuranceStats(entries: readonly GLEntry[]) {
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  const netChange = entries.reduce((s, e) => s + e.netChange, 0);
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

export function InsurancePage() {
  const { entries } = useGLStore();
  const { lossPicks } = useInsuranceStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Insurance';
  }, []);

  const stats = useMemo(() => computeInsuranceStats(entries), [entries]);

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
      <main className="p-12 text-center" role="main" aria-label="Insurance - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Shield className="h-10 w-10 text-slate-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">No Insurance Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view insurance.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view insurance"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Insurance Dashboard">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <header className="flex items-center justify-between">
        <h1 id="insurance-heading" className="text-2xl font-bold">
          Insurance
        </h1>
        <span className="text-sm text-slate-400">
          {formatNumber(entries.length)} entries imported
        </span>
      </header>
      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Insurance KPIs"
        aria-labelledby="insurance-heading"
      >
        <KPIValue
          label="Total Entries"
          value={formatNumber(entries.length)}
          icon={<Shield className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Policies"
          value={formatNumber(lossPicks.length)}
          icon={<Layers className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Debit"
          value={formatCompactNumber(stats.totalDebit)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Credit"
          value={formatCompactNumber(stats.totalCredit)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        />
      </section>
      <Card aria-label="Account Overview" aria-live="polite">
        <CardHeader>
          <CardTitle id="account-overview-title">Account Overview</CardTitle>
        </CardHeader>
        <CardContent aria-labelledby="account-overview-title">
          {tableData.length > 0 ? (
            <DataTable columns={columns} data={tableData} sortable caption="Account overview table" ariaLabel="Account overview data table for insurance sector" />
          ) : (
            <p className="text-slate-400">No account data available.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
