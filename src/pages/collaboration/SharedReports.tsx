/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useCollaborationStore } from '@/store/collaborationStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { formatCurrency, formatNumber, formatCompactNumber } from '@/utils/formatters';
import {
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  Download,
  Search,
  RefreshCw,
  Eye,
  Calendar,
  Filter,
} from 'lucide-react';
import type { GLEntry } from '@/types';

function computeReportStats(entries: readonly GLEntry[]) {
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

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 365 days' },
];

const SORT_OPTIONS = [
  { value: 'credit', label: 'Credit (largest first)' },
  { value: 'debit', label: 'Debit (largest first)' },
  { value: 'count', label: 'Transaction count' },
  { value: 'code', label: 'Account code (A→Z)' },
];

export function SharedReports() {
  const { entries } = useGLStore();
  const { comments, tasks } = useCollaborationStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('credit');
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Real-time tick for "last refreshed" indicator
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = 'FinPlan Pro — Shared Reports';
  }, []);

  const stats = useMemo(() => computeReportStats(entries), [entries]);

  // Apply date range + search filter to entries
  const filteredEntries = useMemo(() => {
    const cutoff = dateRange === 'all' ? null : nowTick - Number(dateRange) * 24 * 60 * 60 * 1000;
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((e) => {
      if (cutoff !== null) {
        const t = new Date(e.date ?? '').getTime();
        if (Number.isFinite(t) && t < cutoff) return false;
      }
      if (q) {
        const hay = `${e.accountCode} ${e.accountName} ${e.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, dateRange, nowTick, searchQuery]);

  const filteredStats = useMemo(() => computeReportStats(filteredEntries), [filteredEntries]);

  const sortedBreakdown = useMemo(() => {
    const arr = [...filteredStats.accountBreakdown];
    switch (sortBy) {
      case 'debit':
        return arr.sort((a, b) => Math.abs(b.debit) - Math.abs(a.debit));
      case 'count':
        return arr.sort((a, b) => b.transactions - a.transactions);
      case 'code':
        return arr.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
      case 'credit':
      default:
        return arr.sort((a, b) => Math.abs(b.credit) - Math.abs(a.credit));
    }
  }, [filteredStats.accountBreakdown, sortBy]);

  const tableData = useMemo(
    () =>
      sortedBreakdown.map((row) => ({
        accountCode: row.accountCode,
        accountName: row.accountName,
        debit: formatCurrency(row.debit),
        credit: formatCurrency(row.credit),
        netChange: formatCurrency(row.netChange),
        transactions: formatNumber(row.transactions),
      })),
    [sortedBreakdown]
  );

  const handleRefresh = useCallback(() => {
    setNowTick(Date.now());
  }, []);

  const handleExportCsv = useCallback(() => {
    if (sortedBreakdown.length === 0) return;
    const header = 'accountCode,accountName,debit,credit,netChange,transactions';
    const rows = sortedBreakdown.map((r) =>
      [
        `"${r.accountCode.replace(/"/g, '""')}"`,
        `"${r.accountName.replace(/"/g, '""')}"`,
        r.debit.toFixed(2),
        r.credit.toFixed(2),
        r.netChange.toFixed(2),
        r.transactions,
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shared-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sortedBreakdown]);

  const handleImportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/data/gl-upload');
    }
  };

  const secondsSinceRefresh = Math.max(0, Math.floor((nowTick - nowTick) / 1000));

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Shared Reports - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <FileText className="h-10 w-10 text-slate-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">No Shared Reports Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view shared reports.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view shared reports"
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
      aria-label="Shared Reports Dashboard"
    >
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 id="reports-heading" className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-700" aria-hidden="true" />
            Shared Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {formatNumber(entries.length)} entries imported
            {filteredEntries.length !== entries.length &&
              ` • ${formatNumber(filteredEntries.length)} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="px-3 py-1 gap-1" aria-label="Real-time indicator">
            <span className="h-2 w-2 rounded-full bg-green-700 animate-pulse" aria-hidden="true" />
            <span className="text-xs font-medium text-green-700">Live</span>
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            aria-label="Refresh shared reports"
          >
            <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={sortedBreakdown.length === 0}
            aria-label="Export shared reports to CSV"
          >
            <Download className="h-4 w-4 mr-1" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </header>

      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Report KPIs"
        aria-labelledby="reports-heading"
      >
        <KPIValue
          label="Total Entries"
          value={formatNumber(filteredEntries.length)}
          icon={<FileText className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Comments"
          value={formatNumber(comments.length)}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Debit"
          value={formatCompactNumber(filteredStats.totalDebit)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Credit"
          value={formatCompactNumber(filteredStats.totalCredit)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      {/* Filter row */}
      <Card aria-label="Filters">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search
                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <Input
                placeholder="Search by account code, name, or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                aria-label="Search shared reports"
              />
            </div>
            <Select
              label="Date range"
              options={DATE_RANGE_OPTIONS}
              value={dateRange}
              onChange={setDateRange}
            />
            <Select label="Sort by" options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue={activeTab}
        aria-label="Shared reports views"
      >
        <TabsList aria-label="Tab list">
          <TabsTrigger value="overview" aria-label="Overview tab">
            Overview
          </TabsTrigger>
          <TabsTrigger value="accounts" aria-label="Accounts tab">
            Accounts
          </TabsTrigger>
          <TabsTrigger value="tasks" aria-label="Tasks tab">
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="comments" aria-label="Comments tab">
            Comments ({comments.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview tab — KPI summary + top accounts */}
        <TabsContent value="overview">
          <Card aria-label="Account Overview" aria-live="polite">
            <CardHeader>
              <CardTitle id="account-overview-title">Account Overview</CardTitle>
              <CardDescription>
                {sortedBreakdown.length} account
                {sortedBreakdown.length === 1 ? '' : 's'} • {formatNumber(filteredEntries.length)}{' '}
                transaction{filteredEntries.length === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent aria-labelledby="account-overview-title">
              {tableData.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={tableData}
                  sortable
                  caption="Shared reports table"
                  ariaLabel="Shared reports"
                />
              ) : (
                <p className="text-slate-400">No account data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts tab — same data, emphasized for account-level work */}
        <TabsContent value="accounts">
          <Card aria-label="Account Breakdown">
            <CardHeader>
              <CardTitle id="account-breakdown-title">Account Breakdown</CardTitle>
              <CardDescription>
                Sorted by {SORT_OPTIONS.find((s) => s.value === sortBy)?.label.toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent aria-labelledby="account-breakdown-title">
              {tableData.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={tableData}
                  sortable
                  caption="Account breakdown table"
                  ariaLabel="Account breakdown"
                />
              ) : (
                <p className="text-slate-400">No accounts match the current filters.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks tab */}
        <TabsContent value="tasks">
          <Card aria-label="Collaboration tasks">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Collaboration Tasks</CardTitle>
              <CardDescription>
                {tasks.length} task{tasks.length === 1 ? '' : 's'} across this report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-slate-500 text-sm">No collaboration tasks yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {tasks.slice(0, 10).map((t, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="truncate flex-1 text-slate-700 dark:text-slate-300">
                        {String(
                          (t as { title?: string; id?: string }).title ??
                            (t as { id?: string }).id ??
                            `Task ${i + 1}`
                        )}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {String((t as { status?: string }).status ?? 'open')}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments tab */}
        <TabsContent value="comments">
          <Card aria-label="Collaboration comments">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
              <CardDescription>
                {comments.length} comment{comments.length === 1 ? '' : 's'} on this report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="text-slate-500 text-sm">No comments yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {comments.slice(0, 10).map((c, i) => (
                    <li
                      key={i}
                      className="p-2 rounded bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                    >
                      <p className="text-slate-700 dark:text-slate-300">
                        {String(
                          (c as { text?: string; body?: string }).text ??
                            (c as { body?: string }).body ??
                            ''
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card
        className="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800"
        aria-label="Help"
      >
        <CardContent className="pt-6 flex items-start gap-3">
          <Eye
            className="h-5 w-5 text-sky-700 dark:text-sky-300 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-sky-900 dark:text-sky-200">
              About Shared Reports
            </p>
            <p className="text-xs text-sky-700 dark:text-sky-300 mt-1">
              Shared Reports aggregates account-level debits, credits, and net change with
              collaboration tasks and comments. Use filters to narrow by date range or search term,
              then export the result to CSV.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default SharedReports;
