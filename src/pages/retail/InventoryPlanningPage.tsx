import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { useMemo, useState } from 'react';
import { Package, BarChart3, Download, Truck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
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
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { useGLStore } from '@/store/glStore';
import { InventoryEngine } from '@/engines/InventoryEngine';
import { formatCompact, formatNumber } from '@/utils/financialFormatting';

const mockPeriods: FiscalPeriod[] = buildFiscalPeriods();

const categoryBreakdown = [
  { name: 'Apparel', value: 3200000, turnover: 5.2, margin: '54%' },
  { name: 'Electronics', value: 4800000, turnover: 3.8, margin: '28%' },
  { name: 'Home Goods', value: 2100000, turnover: 4.5, margin: '42%' },
  { name: 'Food & Bev', value: 1400000, turnover: 8.1, margin: '35%' },
  { name: 'Beauty', value: 1800000, turnover: 6.2, margin: '62%' },
];

const inventoryItems = [
  {
    id: 'SKU-4401',
    product: 'Denim Jacket',
    category: 'Apparel',
    stock: 1240,
    turnover: '5.2x',
    daysOH: 32,
    status: 'Optimal',
  },
  {
    id: 'SKU-2180',
    product: 'Wireless Earbuds',
    category: 'Electronics',
    stock: 840,
    turnover: '3.8x',
    daysOH: 48,
    status: 'Overstock',
  },
];

const columns: Column[] = [
  { key: 'product', header: 'Product Name', sortable: true },
  { key: 'category', header: 'Category' },
  { key: 'stock', header: 'Units On Hand', align: 'right' },
  { key: 'turnover', header: 'Turnover Rate', align: 'right' },
  { key: 'daysOH', header: 'Days on Hand', align: 'right' },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          v === 'Optimal'
            ? 'bg-green-100 text-green-700'
            : v === 'Overstock'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
        }`}
      >
        {v as string}
      </span>
    ),
  },
];

export default function InventoryPlanningPage() {
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  const stats = useMemo(() => {
    return InventoryEngine.calculateGLInventoryStats(entries);
  }, [entries]);

  const inventoryTrend = useMemo(() => {
    const periods = Array.from(new Set(entries.map((e) => e.date.substring(0, 7)))).sort();
    return periods.slice(-6).map((period) => {
      const pEntries = entries.filter((e) => e.date.startsWith(period));
      const pStats = InventoryEngine.calculateGLInventoryStats(pEntries);
      return {
        month: period,
        turnover: pStats.turnover,
        daysOnHand: pStats.daysOnHand,
        stockouts: 4,
      };
    });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Package className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Inventory Data</h2>
        <p className="text-slate-400 mb-6">
          Import your Inventory General Ledger (121x accounts) to view stock optimization and
          turnover analysis.
        </p>
        <Button>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Inventory Planning
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Stock optimization, turnover analysis, and days-on-hand monitoring across all
            categories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" className="h-10">
            <Truck className="h-4 w-4 mr-2" />
            Reorder Plan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Inventory Value"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: 'compact',
          }).format(stats.totalValue)}
          change={4.2}
          changeLabel="at cost basis"
          trend="up"
          sparklineData={[12.0, 12.4, 12.8, 13.0, 13.2, stats.totalValue / 1000000]}
        />
        <KPIValue
          label="Inventory Turnover"
          value={`${formatNumber(stats.turnover, 1)}x`}
          change={8.2}
          changeLabel="annualized rate"
          trend="up"
          sparklineData={[4.2, 4.5, 4.1, 4.8, 5.2, stats.turnover]}
        />
        <KPIValue
          label="Days on Hand"
          value={Math.round(stats.daysOnHand).toString()}
          change={-12.4}
          changeLabel="target 35 days"
          trend="up"
          sparklineData={[42, 38, 45, 35, 32, stats.daysOnHand]}
        />
        <KPIValue
          label="Stockout Incidents"
          value={stats.stockouts.toString()}
          changeLabel="this month"
          trend="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Turnover & Days on Hand</CardTitle>
            </div>
            <CardDescription>Monthly efficiency metrics across the supply chain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={inventoryTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 60]}
                  />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend verticalAlign="top" align="right" />
                  <Bar
                    yAxisId="left"
                    dataKey="turnover"
                    name="Turnover Rate"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="daysOnHand"
                    name="Days on Hand"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Summary</CardTitle>
            <CardDescription>Value and margin by department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0"
              >
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">{cat.name}</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {cat.turnover}x turnover
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">${formatCompact(cat.value)}</div>
                  <div className="text-[10px] text-green-600">{cat.margin} margin</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inventory Health Dashboard</CardTitle>
            <CardDescription>
              SKU-level stock positions, turnover rates, and reorder triggers
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={inventoryItems}
            caption="Inventory planning items: SKU, stock level, reorder point, and forecast demand"
            ariaLabel="Inventory planning table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
