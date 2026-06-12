/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatNumber, formatCompactNumber } from '@/utils/formatters';
import {
  FileSignature,
  DollarSign,
  Calendar,
  TrendingUp,
  HelpCircle,
  Building,
} from 'lucide-react';
import type { GLEntry } from '@/types';

const LEASE_PREFIXES = ['17', '23'];

const HELP_SECTIONS = [
  {
    title: 'What is Lease Accounting?',
    content:
      'Under ASC 842/IFRS 16, lessees must recognize Right-of-Use (ROU) assets and lease liabilities on the balance sheet for most leases. This page tracks lease-related GL entries.',
  },
  {
    title: 'ROU Assets',
    content:
      "Right-of-Use assets represent the lessee's right to use the leased asset over the lease term. They are amortized over the lease period.",
  },
  {
    title: 'Lease Liabilities',
    content:
      'Lease liabilities represent the present value of future lease payments. They are reduced as lease payments are made, with interest recognized over time.',
  },
  {
    title: 'Lease Classification',
    content:
      'Leases are classified as operating (expense recognized evenly) or finance (interest + amortization). Account prefixes 17xx typically represent ROU assets, 23xx represent lease liabilities.',
  },
];

function isLeaseEntry(e: GLEntry): boolean {
  const code = e.accountCode || '';
  const desc = (e.description || '').toLowerCase();
  if (LEASE_PREFIXES.some((p) => code.startsWith(p))) return true;
  return desc.includes('lease') || desc.includes('rent') || desc.includes('tenant');
}

function computeLeaseStats(entries: readonly GLEntry[]) {
  const leaseEntries = entries.filter(isLeaseEntry);
  const totalDebit = leaseEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = leaseEntries.reduce((s, e) => s + e.credit, 0);
  const netChange = leaseEntries.reduce((s, e) => s + e.netChange, 0);
  const uniqueAccounts = new Set(leaseEntries.map((e) => e.accountCode)).size;

  const activeLeaseCodes = new Set(
    leaseEntries
      .filter((e) => LEASE_PREFIXES[0] === e.accountCode.slice(0, 2))
      .map((e) => e.accountCode)
  );

  const accountMap = new Map<
    string,
    { name: string; debit: number; credit: number; net: number; count: number }
  >();
  for (const e of leaseEntries) {
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
      isROU: code.startsWith(LEASE_PREFIXES[0]!),
      isLiability: code.startsWith(LEASE_PREFIXES[1]!),
    }))
    .sort((a, b) => Math.abs(b.netChange) - Math.abs(a.netChange));

  return {
    totalDebit,
    totalCredit,
    netChange,
    uniqueAccounts,
    accountBreakdown,
    leaseEntryCount: leaseEntries.length,
    activeLeaseCodes: activeLeaseCodes.size,
  };
}

const columns: Column[] = [
  { key: 'accountCode', header: 'Account Code', sortable: true },
  { key: 'accountName', header: 'Account Name', sortable: true },
  { key: 'classification', header: 'Classification', sortable: true },
  { key: 'debit', header: 'Debit', align: 'right', sortable: true },
  { key: 'credit', header: 'Credit', align: 'right', sortable: true },
  { key: 'netChange', header: 'Net Change', align: 'right', sortable: true },
  { key: 'transactions', header: 'Transactions', align: 'right', sortable: true },
];

export function LeaseAccountingPage() {
  const [helpOpen, setHelpOpen] = useState(false);
  const { entries, isLoading, importError } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Lease Accounting';
  }, []);

  const stats = useMemo(() => computeLeaseStats(entries), [entries]);

  const tableData = useMemo(
    () =>
      stats.accountBreakdown.map((row) => ({
        accountCode: row.accountCode,
        accountName: row.accountName,
        classification: row.isROU
          ? 'ROU Asset'
          : row.isLiability
            ? 'Lease Liability'
            : 'Lease Expense',
        debit: formatCurrency(row.debit),
        credit: formatCurrency(row.credit),
        netChange: formatCurrency(row.netChange),
        transactions: formatNumber(row.transactions),
      })),
    [stats.accountBreakdown]
  );

  const totalROU = useMemo(
    () =>
      stats.accountBreakdown.filter((r) => r.isROU).reduce((s, r) => s + Math.abs(r.netChange), 0),
    [stats.accountBreakdown]
  );

  const totalLiability = useMemo(
    () =>
      stats.accountBreakdown
        .filter((r) => r.isLiability)
        .reduce((s, r) => s + Math.abs(r.netChange), 0),
    [stats.accountBreakdown]
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton count={1} height="40px" width="30%" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} count={1} height="80px" variant="rectangular" />
          ))}
        </div>
        <Skeleton count={6} variant="rectangular" height="40px" />
      </div>
    );
  }

  if (importError) {
    return (
      <div className="p-12 text-center">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <FileSignature className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
        <p className="text-slate-400 mb-6">{importError}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Lease Accounting - No Data">
        <FileSignature className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Lease Accounting Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view lease accounting.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main
      className="p-6 space-y-6 animate-fade-in"
      role="main"
      aria-label="Lease Accounting Dashboard"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Lease Accounting</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {entries.length.toLocaleString()} GL entries &middot; {stats.leaseEntryCount}{' '}
            lease-related
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Lease KPIs">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <FileSignature className="h-4 w-4" />
              Lease Entries
            </div>
            <div className="text-xl font-bold">{formatNumber(stats.leaseEntryCount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Building className="h-4 w-4" />
              ROU Assets (Net)
            </div>
            <div className="text-xl font-bold text-blue-400">{formatCompactNumber(totalROU)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <DollarSign className="h-4 w-4" />
              Lease Liabilities
            </div>
            <div className="text-xl font-bold text-orange-400">
              {formatCompactNumber(totalLiability)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Calendar className="h-4 w-4" />
              Active Lease Codes
            </div>
            <div className="text-xl font-bold">{formatNumber(stats.activeLeaseCodes)}</div>
          </CardContent>
        </Card>
      </section>

      {stats.leaseEntryCount === 0 && entries.length > 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-slate-500 mb-2">No lease-specific entries detected.</p>
            <p className="text-xs text-slate-600">
              Lease entries are identified by account codes starting with{' '}
              {LEASE_PREFIXES.join(' or ')}
              or descriptions containing &quot;lease&quot;, &quot;rent&quot;, or &quot;tenant&quot;.
            </p>
          </CardContent>
        </Card>
      )}

      {stats.leaseEntryCount > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Lease Balance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Right-of-Use Assets
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatCompactNumber(totalROU)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {stats.accountBreakdown.filter((r) => r.isROU).length} accounts
                  </div>
                </div>
                <div className="p-4 bg-orange-900/20 border border-orange-800/30 rounded-lg">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Lease Liabilities
                  </div>
                  <div className="text-2xl font-bold text-orange-400">
                    {formatCompactNumber(totalLiability)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {stats.accountBreakdown.filter((r) => r.isLiability).length} accounts
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card aria-label="Lease Accounts">
            <CardHeader>
              <CardTitle>Lease Account Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {tableData.length > 0 ? (
                <DataTable columns={columns} data={tableData} sortable />
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No lease account data available.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <HelpPanel
        title="Lease Accounting Help"
        sections={HELP_SECTIONS}
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </main>
  );
}
