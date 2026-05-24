import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { RetailEngine, type StoreStats } from '@/engines/RetailEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  Download,
  Store,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react';
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
import type { GLEntry } from '@/types';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

/** Bridge glStore entries to the GLEntry shape the engines expect. */
function toSectorEntries(entries: readonly GLEntry[]): GLEntry[] {
  return entries.map((e) => ({
    ...e,
    currency: e.currency ?? 'USD',
    entityId: e.entityId ?? 'default',
  }));
}

export default function RetailDashboard() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro - Retail Dashboard';
  }, []);

  const sectorEntries = useMemo(() => toSectorEntries(entries), [entries]);

  const storeStats = useMemo(() => RetailEngine.getStoreBreakdown(sectorEntries), [sectorEntries]);

  const dashboardStats = useMemo(
    () => RetailEngine.calculateDashboardStats(sectorEntries),
    [sectorEntries]
  );

  const pnlTrend = useMemo(() => RetailEngine.getPnLTrend(sectorEntries), [sectorEntries]);

  const totalRevenue = useMemo(() => storeStats.reduce((s, st) => s + st.revenue, 0), [storeStats]);

  const handleExport = () => {
    ExportEngine.exportToPDF(
      {
        headers: ['Store', 'Revenue', 'COGS', 'Labor', 'Gross Profit', 'Net Profit', 'Margin %'],
        rows: storeStats.map((s) => [
          s.name,
          s.revenue,
          s.cogs,
          s.labor,
          s.grossProfit,
          s.netProfit,
          `${s.margin.toFixed(1)}%`,
        ]),
      },
      { title: 'Retail Store Performance Report' }
    );
  };

  const columns: Column<StoreStats>[] = [
    { key: 'rank', header: '#', align: 'center' },
    { key: 'name', header: 'Store', sortable: true },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      render: (_, r) => formatCurrency(r.revenue),
      sortable: true,
    },
    { key: 'cogs', header: 'COGS', align: 'right', render: (_, r) => formatCurrency(r.cogs) },
    { key: 'labor', header: 'Labor', align: 'right', render: (_, r) => formatCurrency(r.labor) },
    {
      key: 'grossProfit',
      header: 'Gross Profit',
      align: 'right',
      render: (_, r) => formatCurrency(r.grossProfit),
    },
    {
      key: 'netProfit',
      header: 'Net Profit',
      align: 'right',
      render: (_, r) => (
        <span className={r.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
          {formatCurrency(r.netProfit)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'margin',
      header: 'Margin',
      align: 'right',
      render: (_, r) => (
        <span className={r.margin >= 0 ? 'text-green-400' : 'text-red-400'}>
          {formatPercent(r.margin)}
        </span>
      ),
      sortable: true,
    },
  ];

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" aria-label="Retail Dashboard - No Data">
        <Store className="h-10 w-10 text-slate-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">No Retail Data</h2>
        <p className="text-slate-400 mb-6">
          Import GL data with retail store accounts to view dashboard.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" aria-label="Retail Dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Retail Dashboard</h1>
          <p className="text-sm text-slate-400">
            {storeStats.length} stores | Total Revenue: {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            aria-label="Export retail report"
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/retail/stores')}
            aria-label="View store details"
          >
            Stores <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Retail Key Performance Indicators"
      >
        <KPIValue
          label="Avg Revenue/Store"
          value={formatCurrency(dashboardStats.avgRevenuePerStore)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Net Margin"
          value={formatPercent(dashboardStats.avgNetMargin)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Sales/Labor Hour"
          value={`$${dashboardStats.salesPerLaborHour}`}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KPIValue
          label="Active Stores"
          value={String(storeStats.length)}
          icon={<Users className="h-4 w-4" />}
        />
      </section>

      {/* P&L Trend Chart */}
      {pnlTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle id="pnl-trend-title">Store P&L Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              role="img"
              aria-labelledby="pnl-trend-title"
              aria-label="Bar chart showing revenue and gross profit trend by period"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pnlTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="grossProfit" fill="#10b981" name="Gross Profit" />
                  <Bar dataKey="labor" fill="#f59e0b" name="Labor" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Store Performance Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div aria-label="Store performance table">
            <DataTable columns={columns} data={storeStats} />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
