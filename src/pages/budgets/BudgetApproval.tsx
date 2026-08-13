import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { formatCurrency, formatNumber, formatCompactNumber } from '@/utils/formatters';
import { CheckCircle, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import Decimal from 'decimal.js';
import { addMoney, roundTo, sumMoney, toDecimal } from '@/utils/money';
import type { GLEntry } from '@/types';

/**
 * GAP-1 (F-0006) — exact-decimal budget-approval totals.
 *
 * Same pattern as BankReconciliation / BankStatements (migrated earlier
 * this session): KPI totals + per-account aggregates via Decimal, cent-
 * rounded at the output boundary.
 */
export interface ApprovalAccountRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  netChange: number;
  transactions: number;
}
export interface ApprovalStats {
  totalDebit: number;
  totalCredit: number;
  netChange: number;
  uniqueAccounts: number;
  accountBreakdown: ApprovalAccountRow[];
}

export function computeApprovalStats(entries: readonly GLEntry[]): ApprovalStats {
  const totalDebit = roundTo(sumMoney(entries.map((e) => e.debit)));
  const totalCredit = roundTo(sumMoney(entries.map((e) => e.credit)));
  const netChange = roundTo(sumMoney(entries.map((e) => e.netChange)));
  const uniqueAccounts = new Set(entries.map((e) => e.accountCode)).size;

  const accountMap = new Map<
    string,
    { name: string; debit: Decimal; credit: Decimal; net: Decimal; count: number }
  >();
  for (const e of entries) {
    const existing = accountMap.get(e.accountCode) ?? {
      name: e.accountName,
      debit: toDecimal(0),
      credit: toDecimal(0),
      net: toDecimal(0),
      count: 0,
    };
    existing.debit = addMoney(existing.debit, e.debit);
    existing.credit = addMoney(existing.credit, e.credit);
    existing.net = addMoney(existing.net, e.netChange);
    existing.count += 1;
    accountMap.set(e.accountCode, existing);
  }

  const accountBreakdown: ApprovalAccountRow[] = Array.from(accountMap.entries())
    .map(([code, data]) => ({
      accountCode: code,
      accountName: data.name,
      debit: roundTo(data.debit),
      credit: roundTo(data.credit),
      netChange: roundTo(data.net),
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

export function BudgetApproval() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Budget Approval';
  }, []);

  const stats = useMemo(() => computeApprovalStats(entries), [entries]);

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
      <main className="p-12 text-center" role="main" aria-label="Budget Approval - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <CheckCircle
          className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4"
          aria-hidden="true"
        />
        <h2 className="text-xl font-semibold mb-2">No Budget Approval Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view budget approvals.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view budget approvals"
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
      aria-label="Budget Approval Dashboard"
    >
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <header className="flex items-center justify-between">
        <h1 id="approval-heading" className="text-2xl font-bold">
          Budget Approval
        </h1>
        <span className="text-sm text-[var(--text-muted)]">
          {formatNumber(entries.length)} entries imported
        </span>
      </header>
      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Approval KPIs"
        aria-labelledby="approval-heading"
      >
        <KPIValue
          label="Total Entries"
          value={formatNumber(entries.length)}
          icon={<Clock className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Budget Amount"
          value={formatCompactNumber(stats.totalCredit)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Accounts"
          value={formatNumber(stats.uniqueAccounts)}
          icon={<CheckCircle className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Net Variance"
          value={formatCompactNumber(stats.netChange)}
          icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
        />
      </section>
      <Card aria-label="Budget Approval Details" aria-live="polite">
        <CardHeader>
          <CardTitle id="approval-details-title">Budget Approval Details</CardTitle>
        </CardHeader>
        <CardContent aria-labelledby="approval-details-title">
          {tableData.length > 0 ? (
            <DataTable
              columns={columns}
              data={tableData}
              sortable
              caption="Budget approval items table"
              ariaLabel="Budget approval items"
            />
          ) : (
            <p className="text-[var(--text-muted)]">No approval data available.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default BudgetApproval;
