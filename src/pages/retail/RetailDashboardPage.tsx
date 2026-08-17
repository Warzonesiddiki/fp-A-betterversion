import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Download, Store, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useGLStore } from '@/store/glStore';
import { RetailEngine, type StoreStats } from '@/engines/RetailEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { roundTo, sumMoney } from '@/utils/money';
import type { GLEntry } from '@/types';

const fiscalPeriods = buildFiscalPeriods();

function toSectorEntries(entries: readonly GLEntry[]): GLEntry[] {
  return entries.map((e) => ({
    ...e,
    currency: e.currency ?? 'USD',
    entityId: e.entityId ?? 'default',
  }));
}

export default function RetailDashboardPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  const sectorEntries = useMemo(() => toSectorEntries(entries), [entries]);
  const storeStats = useMemo(() => RetailEngine.getStoreBreakdown(sectorEntries), [sectorEntries]);
  const dashboardStats = useMemo(
    () => RetailEngine.calculateDashboardStats(sectorEntries),
    [sectorEntries]
  );
  const pnlTrend = useMemo(() => RetailEngine.getPnLTrend(sectorEntries), [sectorEntries]);
  const totalRevenue = useMemo(
    () => roundTo(sumMoney(storeStats.map((s) => s.revenue)), 2),
    [storeStats]
  );

  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Store', 'Revenue', 'COGS', 'Labor', 'Gross Profit', 'Net Profit', 'Margin %'],
        rows: storeStats.map((s) => [
          s.name,
          fmt.currency0(s.revenue),
          fmt.currency0(s.cogs),
          fmt.currency0(s.labor),
          fmt.currency0(s.grossProfit),
          fmt.currency0(s.netProfit),
          formatPercent(s.margin, 1),
        ]),
      },
      { title: 'Retail Store Performance Report' }
    ).catch(reportExportFailure);
  };

  const columns: Column<StoreStats>[] = [
    { key: 'name', header: 'Store', sortable: true },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      render: (_v, r) => fmt.currency0(r.revenue),
      sortable: true,
    },
    {
      key: 'cogs',
      header: 'COGS',
      align: 'right',
      render: (_v, r) => fmt.currency0(r.cogs),
    },
    {
      key: 'netProfit',
      header: 'Net Profit',
      align: 'right',
      render: (_v, r) => fmt.currency0(r.netProfit),
      sortable: true,
    },
    {
      key: 'margin',
      header: 'Margin',
      align: 'right',
      render: (_v, r) => formatPercent(r.margin, 1),
      sortable: true,
    },
  ];

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <Store className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Retail Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger entries with store (entity) tags to view same-store revenue and
          margin. Comp growth, foot traffic and conversion are not invented.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Retail Dashboard"
          purpose="Store P&L from the posted General Ledger. Comp growth, foot traffic and conversion require operational feeds the GL does not carry — they are omitted, not estimated."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
          <Button variant="outline" size="sm" className="h-10" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Sales"
          value={fmt.currency0(totalRevenue)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Revenue/Store"
          value={fmt.currency0(dashboardStats.avgRevenuePerStore)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Net Margin"
          value={formatPercent(dashboardStats.avgNetMargin, 1)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Active Stores"
          value={String(storeStats.length)}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle>Revenue by posted period</CardTitle>
            </div>
            <CardDescription>
              Same-store and channel splits are omitted — the GL does not tag them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pnlTrend.length >= 2 ? (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pnlTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCompact(v)}
                    />
                    <Tooltip formatter={(v) => fmt.currency0(Number(v))} />
                    <Legend verticalAlign="top" align="right" />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="#3b82f6"
                      fillOpacity={0.15}
                    />
                    <Area
                      type="monotone"
                      dataKey="grossProfit"
                      name="Gross Profit"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-8 text-center">
                A trend requires posted activity in at least two periods. A six-month seasonality
                curve is not invented.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Not derivable from the posted GL</CardTitle>
            <CardDescription>Omitted rather than estimated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--text-muted)]">
            <p>
              <span className="font-medium text-[var(--text-secondary)]">Comp store growth</span> —
              needs a prior-year same-store map the ledger does not carry.
            </p>
            <p>
              <span className="font-medium text-[var(--text-secondary)]">Foot traffic</span> — needs
              a traffic / POS feed, not a GL account.
            </p>
            <p>
              <span className="font-medium text-[var(--text-secondary)]">Conversion rate</span> —
              needs transactions and visitors. It is not filled with a placeholder rate.
            </p>
            <p>
              <span className="font-medium text-[var(--text-secondary)]">Named store quotes</span> —
              listed locations are not this entity&apos;s ledger and are not shown.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Performance</CardTitle>
          <CardDescription>Revenue, cost and margin from posted store entities</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={storeStats}
            caption="Store performance from posted General Ledger"
            ariaLabel="Store performance table"
            emptyMessage="No store-tagged entities in the posted GL."
          />
        </CardContent>
      </Card>
    </div>
  );
}
