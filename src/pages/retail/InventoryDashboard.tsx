import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { ExportEngine } from '@/engines/ExportEngine';
import { InventoryEngine } from '@/engines/InventoryEngine';
import { RetailEngine } from '@/engines/RetailEngine';
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

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function InventoryDashboard() {
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

  const categoryBreakdown = useMemo(() => {
    if (storeBreakdown.length === 0) {
      return [
        { name: 'Raw Materials', value: 0 },
        { name: 'Work in Progress', value: 0 },
        { name: 'Finished Goods', value: 0 },
      ];
    }
    return storeBreakdown.slice(0, 5).map((store) => ({
      name: store.name,
      value: store.cogs,
    }));
  }, [storeBreakdown]);

  const gmroi = useMemo(
    () =>
      storeBreakdown.length > 0
        ? InventoryEngine.calculateGMROI(
            storeBreakdown.reduce((s, st) => s + st.grossProfit, 0),
            stats.totalValue
          )
        : 0,
    [storeBreakdown, stats.totalValue]
  );

  const handleExport = () => {
    ExportEngine.exportToExcel(
      {
        headers: ['Store', 'Revenue', 'COGS', 'Gross Profit', 'Inventory Value'],
        rows: storeBreakdown.map((s) => [
          s.name,
          s.revenue,
          s.cogs,
          s.grossProfit,
          stats.totalValue / Math.max(1, storeBreakdown.length),
        ]),
      },
      { title: 'Inventory_Dashboard' }
    );
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Package className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Inventory Data</h2>
        <p className="text-slate-400 mb-6">
          Import your GL data with inventory accounts (121x) and COGS (50xx) to view inventory
          metrics.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import GL Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" role="main" aria-label="Inventory Dashboard page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
          <p className="text-sm text-slate-400">Stock valuation, turnover, and GMROI analysis</p>
        </div>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Inventory Value"
          value={formatCurrency(stats.totalValue)}
          icon={<Package className="h-4 w-4" />}
          trend="up"
        />
        <KPIValue
          label="Inventory Turnover"
          value={`${stats.turnover.toFixed(1)}x`}
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
          value={gmroi > 0 ? `${gmroi.toFixed(1)}x` : 'N/A'}
          icon={<DollarSign className="h-4 w-4" />}
          trend={gmroi > 2 ? 'up' : 'neutral'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
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
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 8,
                    }}
                    formatter={(v: any, name: any) =>
                      name === 'Value' ? formatCurrency(v) : `${v.toFixed(1)}x`
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
            <CardTitle>By Store / Category</CardTitle>
          </CardHeader>
          <CardContent>
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
                  formatter={(v: any) => formatCurrency(v)}
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
                  <span className="font-medium">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
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
