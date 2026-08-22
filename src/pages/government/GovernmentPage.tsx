// @money-ast-allow Reason: Utilization percentage: (totalCredit / totalDebit) * 100 is a budget-utilization ratio for display
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  formatCurrency,
  formatNumber,
  formatCompactNumber,
  formatPercent,
} from '@/utils/formatters';
import { Landmark, FileText, Users, DollarSign } from 'lucide-react';
import type { GLEntry } from '@/types';
import { addMoney, roundTo, sumMoney } from '@/utils/money';
import { PageHeader } from '@/components/ui/PageHeader';

function computeGovernmentStats(entries: readonly GLEntry[]) {
  const totalDebit = roundTo(sumMoney(entries.map((e) => e.debit)), 2);
  const totalCredit = roundTo(sumMoney(entries.map((e) => e.credit)), 2);
  const netChange = roundTo(sumMoney(entries.map((e) => e.netChange)), 2);
  const uniqueAccounts = new Set(entries.map((e) => e.accountCode)).size;
  const uniqueDepartments = new Set(entries.map((e) => e.departmentId).filter(Boolean)).size;
  const utilization = totalDebit > 0 ? (totalCredit / totalDebit) * 100 : 0;

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
    existing.debit = addMoney(existing.debit, e.debit ?? 0).toNumber();
    existing.credit = addMoney(existing.credit, e.credit ?? 0).toNumber();
    existing.net = addMoney(existing.net, e.netChange ?? 0).toNumber();
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
    .sort((a, b) => Math.abs(b.debit) - Math.abs(a.debit));

  return {
    totalDebit,
    totalCredit,
    netChange,
    uniqueAccounts,
    uniqueDepartments,
    utilization,
    accountBreakdown,
  };
}

const columns: Column[] = [
  { key: 'accountCode', header: 'Account Code', sortable: true },
  { key: 'accountName', header: 'Account Name', sortable: true },
  { key: 'debit', header: 'Allocated (Debit)', align: 'right', sortable: true },
  { key: 'credit', header: 'Utilized (Credit)', align: 'right', sortable: true },
  { key: 'netChange', header: 'Net Change', align: 'right', sortable: true },
  { key: 'transactions', header: 'Transactions', align: 'right', sortable: true },
];

export default function GovernmentPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Government';
  }, []);

  const stats = useMemo(() => computeGovernmentStats(entries), [entries]);

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
      <main className="p-12 text-center" role="main" aria-label="Government - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Landmark className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Government Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view government financials.
        </p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view government financials"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Government Dashboard">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <PageHeader
        title="Government"
        titleId="gov-heading"
        status={
          <span className="text-sm text-[var(--text-muted)]">
            {formatNumber(entries.length)} entries imported
          </span>
        }
      />
      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Government KPIs"
        aria-labelledby="gov-heading"
      >
        {/* Truthful labeling (W-FAB lane N4): these are posted debit/credit
            aggregates; the ledger does not mark a budget line, so the tiles
            say what the numbers are instead of claiming budget semantics. */}
        <KPIValue
          label="Posted Debits"
          value={formatCompactNumber(stats.totalDebit)}
          changeLabel="sum of all posted debits"
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Credit-to-Debit Ratio"
          value={formatPercent(stats.utilization)}
          changeLabel={stats.totalDebit > 0 ? 'credits ÷ debits' : 'no debits posted'}
          icon={<FileText className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Departments"
          value={stats.uniqueDepartments > 0 ? formatNumber(stats.uniqueDepartments) : '—'}
          changeLabel={
            stats.uniqueDepartments > 0
              ? 'distinct department tags in the GL'
              : 'no department tags in the GL'
          }
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Net Position Change"
          value={formatCompactNumber(stats.netChange)}
          icon={<Landmark className="h-4 w-4" aria-hidden="true" />}
        />
      </section>
      <Card aria-label="Budget Overview" aria-live="polite">
        <CardHeader>
          <CardTitle id="budget-overview-title">Budget Overview</CardTitle>
        </CardHeader>
        <CardContent aria-labelledby="budget-overview-title">
          {tableData.length > 0 ? (
            <DataTable
              columns={columns}
              data={tableData}
              sortable
              caption="Government accounts table"
              ariaLabel="Government accounts"
            />
          ) : (
            <p className="text-[var(--text-muted)]">No budget data available.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
