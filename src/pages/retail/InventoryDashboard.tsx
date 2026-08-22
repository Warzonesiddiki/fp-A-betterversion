// W-FAB remediation (phase0-exit amendment item 3):
//   - the Excel export previously allocated the TOTAL inventory value to each
//     store as totalValue / storeCount — an even-split invention presented as
//     per-store values. The column is gone (per-store inventory valuation is
//     not derivable from these postings).
//   - with no store-tagged entities, the "By Store / Category" card rendered
//     zero-value placeholder slices for Raw Materials / WIP / Finished Goods
//     categories that exist in no store. It now shows a disclosure instead,
//     and is titled for what it actually plots: COGS by store.
import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { ExportEngine } from '@/engines/ExportEngine';
import { InventoryEngine } from '@/engines/InventoryEngine';
import { RetailEngine } from '@/engines/RetailEngine';
import { formatNumber } from '@/utils/financialFormatting';
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  BarChart3,
  Truck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { roundTo, sumMoney } from '@/utils/money';
import { formatCompact } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function InventoryDashboard() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Inventory Dashboard';
  }, []);

  const stats = useMemo(() => InventoryEngine.calculateGLInventoryStats(entries), [entries]);

  const storeBreakdown = useMemo(() => RetailEngine.getStoreBreakdown(entries), [entries]);

  const inventoryTrend = useMemo(() => {
    const periods = Array.from(new Set(entries.map((e) => e.date.substring(0, 7)))).sort();
    return periods.slice(-6).map((period) => {
      const pEntries = entries.filter((e) => e.date.startsWith(period));
      const pStats = InventoryEngine.calculateGLInventoryStats(pEntries);
      return {
        month: period,
        value: pStats.totalValue,
        turnover: pStats.turnover,
        daysOnHand: pStats.daysOnHand,
      };
    });
  }, [entries]);

  const categoryBreakdown = useMemo(
    () =>
      storeBreakdown.slice(0, 5).map((store) => ({
        name: store.name,
        value: store.cogs,
      })),
    [storeBreakdown]
  );

  const gmroi = useMemo(
    () =>
      storeBreakdown.length > 0
        ? InventoryEngine.calculateGMROI(
            roundTo(sumMoney(storeBreakdown.map((st) => st.grossProfit)), 2),
            stats.totalValue
          )
        : 0,
    [storeBreakdown, stats.totalValue]
  );

  const handleExport = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Store', 'Revenue', 'COGS', 'Gross Profit'],
        rows: storeBreakdown.map((s) => [s.name, s.revenue, s.cogs, s.grossProfit]),
      },
      { title: 'Inventory_Dashboard' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Package className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h1 className="text-xl font-semibold mb-2">No Inventory Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import your GL data with inventory accounts (121x) and COGS (50xx) to view inventory
          metrics.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import GL Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" role="main" aria-label="Inventory Dashboard page">
      <PageHeader
        title="Inventory Dashboard"
        purpose="Stock valuation, turnover, and GMROI analysis"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              aria-label="Export inventory data"
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/retail/inventory-planning')}
              aria-label="Go to planning"
            >
              <Truck className="h-4 w-4 mr-2" aria-hidden="true" />
              Planning
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Inventory Value"
          value={fmt.currency0(stats.totalValue)}
          icon={<Package className="h-4 w-4" />}
          trend="up"
        />
        <KPIValue
          label="Inventory Turnover"
          value={`${formatNumber(stats.turnover, 1)}x`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={stats.turnover > 4 ? 'up' : 'down'}
        />
        <KPIValue
          label="Days on Hand"
          value={Math.round(stats.daysOnHand).toString()}
          icon={<TrendingDown className="h-4 w-4" />}
          trend={stats.daysOnHand < 45 ? 'up' : 'down'}
        />
        <KPIValue
          label="GMROI"
          value={gmroi > 0 ? `${formatNumber(gmroi, 1)}x` : 'N/A'}
          icon={<DollarSign className="h-4 w-4" />}
          trend={gmroi > 2 ? 'up' : 'neutral'}
        />
      </div>

      <h2 className="sr-only">Inventory Analysis</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Inventory Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={inventoryTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    tickFormatter={(v) => `$${v ? formatCompact(v) : '—'}`}
                  />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 8,
                    }}
                    formatter={(v, name) =>
                      name === 'Value' ? fmt.currency0(Number(v)) : `${formatNumber(Number(v), 1)}x`
                    }
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="value"
                    name="Value"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="turnover"
                    name="Turnover"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>COGS by Store</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label
                    >
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 8,
                      }}
                      formatter={(v) => fmt.currency0(Number(v))}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categoryBreakdown.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span>{cat.name}</span>
                      </div>
                      <span className="font-medium">{fmt.currency0(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p
                className="text-sm text-[var(--text-muted)] py-8 text-center"
                data-testid="inventory-no-store-breakdown"
              >
                No store-tagged entities in the posted GL, so there is nothing to break down.
                Department/category tags do not exist in ledger postings and are not invented here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Days on Hand Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={inventoryTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="daysOnHand"
                name="Days on Hand"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
