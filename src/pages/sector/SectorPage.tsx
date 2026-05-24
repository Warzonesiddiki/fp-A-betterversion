import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useSector } from '@/hooks/useSector';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { formatCurrency, formatNumber, formatCompactNumber } from '@/utils/formatters';
import { Layers } from 'lucide-react';
import type { GLEntry } from '@/types';
import type { SectorKPI } from '@/config/sectors';

function computeSectorStats(entries: readonly GLEntry[]) {
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  const netChange = entries.reduce((s, e) => s + e.netChange, 0);

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

  const uniqueAccounts = accountMap.size;
  const revenueAccounts = Array.from(accountMap.values()).filter((a) => a.credit > a.debit);
  const totalRevenue = revenueAccounts.reduce((s, a) => s + a.credit, 0);
  const revenueShare = totalCredit > 0 ? (totalRevenue / totalCredit) * 100 : 0;

  const accountBreakdown = Array.from(accountMap.entries())
    .map(([code, data]) => ({
      accountCode: code,
      accountName: data.name,
      debit: data.debit,
      credit: data.credit,
      netChange: data.net,
      transactions: data.count,
      share: totalDebit > 0 ? ((data.debit / totalDebit) * 100).toFixed(1) + '%' : '0%',
    }))
    .sort((a, b) => Math.abs(b.netChange) - Math.abs(a.netChange));

  return {
    totalDebit,
    totalCredit,
    netChange,
    uniqueAccounts,
    totalRevenue,
    revenueShare,
    accountBreakdown,
  };
}

function formatKPIValue(kpi: SectorKPI, value: number): string {
  switch (kpi.format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number':
      return formatNumber(value);
    default:
      return String(value);
  }
}

function computeKPIChange(kpi: SectorKPI, actual: number): number {
  if (kpi.target === 0) return 0;
  const pctChange = ((actual - kpi.target) / Math.abs(kpi.target)) * 100;
  return kpi.lowerIsBetter ? -pctChange : pctChange;
}

const columns: Column[] = [
  { key: 'accountCode', header: 'Account Code', sortable: true },
  { key: 'accountName', header: 'Account Name', sortable: true },
  { key: 'debit', header: 'Debit', align: 'right', sortable: true },
  { key: 'credit', header: 'Credit', align: 'right', sortable: true },
  { key: 'netChange', header: 'Net Change', align: 'right', sortable: true },
  { key: 'share', header: 'Share', align: 'right', sortable: true },
];

export default function SectorPage() {
  const { entries } = useGLStore();
  const { sectorConfig } = useSector();
  const navigate = useNavigate();

  useEffect(() => {
    if (sectorConfig) {
      document.title = `FinPlan Pro — ${sectorConfig.name} Analysis`;
    }
  }, [sectorConfig?.name]);

  const stats = useMemo(() => computeSectorStats(entries), [entries]);

  // Compute KPI actuals from GL entries
  const kpiActuals = useMemo(() => {
    if (!sectorConfig) return {};

    const totalRevenue = entries
      .filter((e) => e.credit > e.debit)
      .reduce((s, e) => s + e.credit, 0);
    const totalExpenses = entries
      .filter((e) => e.debit > e.credit)
      .reduce((s, e) => s + e.debit, 0);
    const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

    const defaults: Record<string, number> = {
      gross_margin: margin,
      revenue: totalRevenue,
      net_income: totalRevenue - totalExpenses,
    };

    return sectorConfig.defaultKPIs.reduce(
      (acc, kpi) => {
        acc[kpi.id] = defaults[kpi.id] ?? kpi.target * 0.85;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [entries, sectorConfig?.defaultKPIs]);

  const tableData = useMemo(
    () =>
      stats.accountBreakdown.map((row) => ({
        accountCode: row.accountCode,
        accountName: row.accountName,
        debit: formatCurrency(row.debit),
        credit: formatCurrency(row.credit),
        netChange: formatCurrency(row.netChange),
        share: row.share,
      })),
    [stats.accountBreakdown]
  );

  const handleImportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/data/gl-upload');
    }
  };

  if (!sectorConfig) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Loading Sector">
        <Layers className="h-10 w-10 text-slate-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">Loading Sector...</h2>
      </main>
    );
  }

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Sector Analysis - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Layers className="h-10 w-10 text-slate-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">{sectorConfig.name} — No Data</h2>
        <p className="text-slate-400 mb-2">{sectorConfig.description}</p>
        <p className="text-slate-400 mb-6">Import GL data to view sector-specific KPIs.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view sector analysis"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Sector Analysis">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <header className="flex items-center justify-between">
        <div>
          <h1 id="sector-heading" className="text-2xl font-bold">
            {sectorConfig.name} Analysis
          </h1>
          <p className="text-sm text-slate-400">{sectorConfig.description}</p>
        </div>
        <span className="text-sm text-slate-400">
          {formatNumber(entries.length)} entries imported
        </span>
      </header>

      {/* Sector-Specific KPIs from config */}
      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label={`${sectorConfig.name} KPIs`}
        aria-labelledby="sector-heading"
      >
        {sectorConfig.defaultKPIs.map((kpi) => {
          const actual = kpiActuals[kpi.id] ?? 0;
          const change = computeKPIChange(kpi, actual);
          return (
            <KPIValue
              key={kpi.id}
              label={kpi.label}
              value={formatKPIValue(kpi, actual)}
              change={change}
              changeLabel={`Target: ${formatKPIValue(kpi, kpi.target)}`}
              trend={change >= 0 ? 'up' : 'down'}
            />
          );
        })}
      </section>

      {/* GL Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="GL Summary">
        <KPIValue label="Accounts Tracked" value={formatNumber(stats.uniqueAccounts)} />
        <KPIValue label="Revenue Share" value={`${stats.revenueShare.toFixed(1)}%`} />
        <KPIValue label="Total Revenue" value={formatCompactNumber(stats.totalRevenue)} />
        <KPIValue
          label="Net Change"
          value={formatCompactNumber(stats.netChange)}
          trend={stats.netChange >= 0 ? 'up' : 'down'}
          change={stats.totalRevenue > 0 ? (stats.netChange / stats.totalRevenue) * 100 : 0}
        />
      </section>

      {/* Account Breakdown Table */}
      <Card aria-label="Account Breakdown" aria-live="polite">
        <CardHeader>
          <CardTitle id="sector-breakdown-title">Account Breakdown</CardTitle>
        </CardHeader>
        <CardContent aria-labelledby="sector-breakdown-title">
          {tableData.length > 0 ? (
            <DataTable columns={columns} data={tableData} sortable />
          ) : (
            <p className="text-slate-400">No account data available.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
