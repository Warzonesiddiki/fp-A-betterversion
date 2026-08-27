// =============================================================================
// STORE DASHBOARD — per-store P&L from posted GL entities (W-FAB remediation).
// -----------------------------------------------------------------------------
// The previous revision kept only its top-line totals from the ledger and then
// fabricated everything beneath them:
//   - five invented stores ('Downtown', 'Mall', 'Airport', 'Online',
//     'Suburban') that exist nowhere in the data;
//   - per-store revenue synthesized as totalRevenue × (0.15 + ((i·7) % 20) ·
//     0.01), transactions as floor(rev / (40 + ((i·11) % 30))), and YoY
//     growth as 5 + ((i·3) % 20)% — rendered in a chart, a table, and
//     exported to PDF and Excel as if they were measured stores;
//   - a Math.abs() sign trick on the 5xxx COGS sum, which counted credit
//     reversals/refunds as positive cost (the exact pattern removed from
//     SectorDriverDashboard).
// Now every displayed figure is derived: totals are signed sums over 4xxx/5xx
// postings; per-store rows come from RetailEngine.getStoreBreakdown() keyed by
// each entry's entityId. Transaction counts, average basket and YoY growth are
// not derivable from a GL (they need POS history) and are disclosed instead.
// =============================================================================

import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  Store,
  TrendingUp,
  FileText,
  Table as TableIcon,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { RetailEngine, type StoreStats } from '@/engines/RetailEngine';
import { divideMoney, multiplyMoney, roundTo, subtractMoney, sumMoney } from '@/utils/money';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import type { GLEntry } from '@/types';

/** Bridge glStore entries to the GLEntry shape the engine expects. */
function toSectorEntries(entries: readonly GLEntry[]): GLEntry[] {
  return entries.map((e) => ({
    ...e,
    currency: e.currency ?? 'USD',
    entityId: e.entityId ?? 'default',
  }));
}

export default function StoreDashboardPage() {
  const fmt = useCurrencyFormatter();
  const entries = useGLStore((s) => s.entries);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Store Dashboard';
  }, []);

  const sectorEntries = useMemo(() => toSectorEntries(entries), [entries]);

  // Real per-store P&L: grouped by entityId, account prefixes
  // 4xxx revenue / 50xx COGS / 51xx labor / 52xx occupancy.
  const storeStats = useMemo(() => RetailEngine.getStoreBreakdown(sectorEntries), [sectorEntries]);

  const totals = useMemo(() => {
    const revenueEntries = entries.filter((e) => (e.accountCode || '').startsWith('4'));
    const cogsEntries = entries.filter((e) => (e.accountCode || '').startsWith('5'));
    const totalRevenue = roundTo(
      sumMoney(revenueEntries.map((e) => subtractMoney(e.debit, e.credit))),
      2
    );
    // Signed sum — no Math.abs(): a credited COGS line is a reversal/refund
    // and must reduce cost, not inflate it.
    const totalCOGS = roundTo(
      sumMoney(cogsEntries.map((e) => subtractMoney(e.debit, e.credit))),
      2
    );
    const grossMargin =
      totalRevenue > 0
        ? roundTo(
            multiplyMoney(divideMoney(subtractMoney(totalRevenue, totalCOGS), totalRevenue), 100),
            2
          )
        : 0;
    return { totalRevenue, totalCOGS, grossMargin };
  }, [entries]);

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Store', 'Revenue', 'COGS', 'Gross Profit', 'Net Profit', 'Margin %'],
        rows: storeStats.map((s) => [
          s.name,
          fmt.currency0(s.revenue),
          fmt.currency0(s.cogs),
          fmt.currency0(s.grossProfit),
          fmt.currency0(s.netProfit),
          formatPercent(s.margin, 1),
        ]),
      },
      { title: 'Store Dashboard Report', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Store', 'Revenue', 'COGS', 'Gross Profit', 'Net Profit', 'Margin'],
        rows: storeStats.map((s) => [
          s.name,
          s.revenue,
          s.cogs,
          s.grossProfit,
          s.netProfit,
          s.margin,
        ]),
      },
      { title: 'Store_Dashboard_Report' }
    ).catch(reportExportFailure);
  };

  const columns: Column<StoreStats>[] = [
    { key: 'name', header: 'Store', sortable: true },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      render: (_value, row) => fmt.currency0(row.revenue),
      sortable: true,
    },
    {
      key: 'cogs',
      header: 'COGS',
      align: 'right',
      render: (_value, row) => fmt.currency0(row.cogs),
      sortable: true,
    },
    {
      key: 'grossProfit',
      header: 'Gross Profit',
      align: 'right',
      render: (_value, row) => fmt.currency0(row.grossProfit),
      sortable: true,
    },
    {
      key: 'netProfit',
      header: 'Net Profit',
      align: 'right',
      render: (_value, row) => (
        <span className={row.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
          {fmt.currency0(row.netProfit)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'margin',
      header: 'Margin',
      align: 'right',
      render: (_value, row) => (
        <span className={row.margin >= 0 ? 'text-green-400' : 'text-red-400'}>
          {formatPercent(row.margin, 1)}
        </span>
      ),
      sortable: true,
    },
  ];

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <Store className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">No Retail Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view store performance. Per-store transactions and growth are not
          synthesized here.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Store Dashboard"
        purpose="Per-store P&L grouped from posted GL entity tags. Transactions, basket size and YoY growth need POS feeds and are omitted rather than estimated."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
              <TableIcon className="h-3.5 w-3.5 mr-1.5" />
              Excel
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="store-dashboard-kpis">
        <KPIValue
          label="Total Revenue"
          value={fmt.currency0(totals.totalRevenue)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Total COGS"
          value={fmt.currency0(totals.totalCOGS)}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <KPIValue
          label="Gross Margin"
          value={`${formatPercent(totals.grossMargin, 1)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Stores Tagged"
          value={storeStats.length.toString()}
          icon={<Store className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Store</CardTitle>
        </CardHeader>
        <CardContent>
          {storeStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={storeStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${formatCompact(v)}`}
                />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-muted)] py-8 text-center">
              No store-tagged entities (entityId) exist in the posted GL, so no per-store split is
              shown. Store rows are not invented here.
            </p>
          )}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={storeStats}
        caption="Store P&L from posted General Ledger entities"
        ariaLabel="Store P&L data table for retail dashboard"
        emptyMessage="No store-tagged entities in the posted GL."
      />

      <Card>
        <CardHeader>
          <CardTitle>Not derivable from the posted GL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-muted)]">
            Transaction counts, average basket and YoY growth per store require POS transaction
            history. This page previously synthesized them from revenue totals with fixed factors
            under invented store names — those figures have been removed, not estimated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
