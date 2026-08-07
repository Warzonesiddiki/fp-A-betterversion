import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FileText, Table as TableIcon } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { roundTo, sumMoney } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// demo defaults — replaced by real data when promotion data comes from retail store imports
const mockPromos = [
  {
    id: 'PROMO-001',
    name: 'Summer Sale',
    type: 'Percentage',
    discount: 20,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    cost: 45000,
    revenue: 320000,
    baselineRevenue: 210000,
    status: 'completed',
  },
  {
    id: 'PROMO-002',
    name: 'Back to School',
    type: 'BOGO',
    discount: 50,
    startDate: '2026-08-01',
    endDate: '2026-08-15',
    cost: 32000,
    revenue: 280000,
    baselineRevenue: 180000,
    status: 'completed',
  },
  {
    id: 'PROMO-003',
    name: 'Holiday Bundle',
    type: 'Bundle',
    discount: 15,
    startDate: '2026-11-15',
    endDate: '2026-12-31',
    cost: 68000,
    revenue: 520000,
    baselineRevenue: 340000,
    status: 'planned',
  },
  {
    id: 'PROMO-004',
    name: 'Flash Sale',
    type: 'Flash',
    discount: 30,
    startDate: '2026-03-15',
    endDate: '2026-03-17',
    cost: 12000,
    revenue: 95000,
    baselineRevenue: 45000,
    status: 'completed',
  },
  {
    id: 'PROMO-005',
    name: 'Loyalty Reward',
    type: 'Loyalty',
    discount: 10,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    cost: 25000,
    revenue: 180000,
    baselineRevenue: 150000,
    status: 'active',
  },
  {
    id: 'PROMO-006',
    name: 'Clearance',
    type: 'Percentage',
    discount: 40,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    cost: 18000,
    revenue: 145000,
    baselineRevenue: 85000,
    status: 'planned',
  },
];

const typeBreakdown = (() => {
  const types = new Map<string, number>();
  mockPromos.forEach((p) => types.set(p.type, (types.get(p.type) || 0) + p.revenue));
  return [...types.entries()].map(([name, value]) => ({ name, value }));
})();

const beforeAfterData = mockPromos
  .filter((p) => p.status === 'completed')
  .map((p) => ({
    name: p.name,
    before: p.baselineRevenue / 1000,
    after: p.revenue / 1000,
  }));

const scatterData = mockPromos.map((p) => ({
  cost: p.cost / 1000,
  revenue: p.revenue / 1000,
  name: p.name,
}));

export default function PromoAnalysisPage() {
  const { entries: _entries } = useGLStore();
  const _navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Promo Analysis';
  }, []);

  const totalPromoCost = roundTo(sumMoney(mockPromos.map((p) => p.cost)), 2);
  const totalPromoRevenue = roundTo(sumMoney(mockPromos.map((p) => p.revenue)), 2);
  const totalBaseline = roundTo(sumMoney(mockPromos.map((p) => p.baselineRevenue)), 2);
  const incrementalRevenue = totalPromoRevenue - totalBaseline;
  const promoROI =
    totalPromoCost > 0 ? ((incrementalRevenue - totalPromoCost) / totalPromoCost) * 100 : 0;
  const avgLift =
    totalBaseline > 0 ? ((totalPromoRevenue - totalBaseline) / totalBaseline) * 100 : 0;

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const columns: Column[] = useMemo(
    () => [
      { key: 'id', header: 'ID', width: '100px' },
      { key: 'name', header: 'Promotion', sortable: true },
      { key: 'type', header: 'Type', sortable: true },
      { key: 'discount', header: 'Discount', align: 'right', render: (v) => `${v}%` },
      { key: 'cost', header: 'Cost', align: 'right', render: (v) => formatCurrency(v as number) },
      {
        key: 'revenue',
        header: 'Revenue',
        align: 'right',
        render: (v) => formatCurrency(v as number),
      },
      {
        key: 'baselineRevenue',
        header: 'Baseline',
        align: 'right',
        render: (v) => formatCurrency(v as number),
      },
      {
        key: 'lift',
        header: 'Lift',
        align: 'right',
        render: (_v, row) => {
          const baseline = row.baselineRevenue as number;
          const revenue = row.revenue as number;
          const lift = baseline > 0 ? ((revenue - baseline) / baseline) * 100 : 0;
          return <span className="text-green-400">+{formatPercent(lift, 0)}</span>;
        },
      },
      {
        key: 'roi',
        header: 'ROI',
        align: 'right',
        render: (_v, row) => {
          const cost = row.cost as number;
          const revenue = row.revenue as number;
          const baseline = row.baselineRevenue as number;
          const roi = cost > 0 ? ((revenue - baseline - cost) / cost) * 100 : 0;
          return (
            <span className={roi >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatPercent(roi, 0)}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (v) => {
          const status = v as string;
          const colors = {
            completed: 'text-green-400',
            active: 'text-blue-400',
            planned: 'text-yellow-400',
          };
          return (
            <span className={(colors as Record<string, string>)[status] || 'text-slate-400'}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
    ],
    []
  );

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Promotion', 'Type', 'Cost', 'Revenue', 'Baseline', 'ROI'],
        rows: mockPromos.map((p) => [
          p.name,
          p.type,
          formatCurrency(p.cost),
          formatCurrency(p.revenue),
          formatCurrency(p.baselineRevenue),
          `${formatPercent(((p.revenue - p.baselineRevenue - p.cost) / p.cost) * 100, 0)}`,
        ]),
      },
      { title: 'Promotion Analysis' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['ID', 'Name', 'Type', 'Discount', 'Cost', 'Revenue', 'Baseline', 'Status'],
        rows: mockPromos.map((p) => [
          p.id,
          p.name,
          p.type,
          p.discount,
          p.cost,
          p.revenue,
          p.baselineRevenue,
          p.status,
        ]),
      },
      { title: 'Promotion_Analysis' }
    ).catch(reportExportFailure);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promotion Analysis</h1>
          <p className="text-sm text-slate-400 mt-1">Promotional performance and ROI tracking</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleExportPDF}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportExcel}>
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPIValue label="Total Promo Spend" value={formatCurrency(totalPromoCost)} />
        <KPIValue
          label="Incremental Revenue"
          value={formatCurrency(incrementalRevenue)}
          trend="up"
        />
        <KPIValue
          label="Promo ROI"
          value={`${formatPercent(promoROI, 0)}`}
          trend={promoROI >= 0 ? 'up' : 'down'}
        />
        <KPIValue label="Avg Lift" value={`+${formatPercent(avgLift, 0)}`} trend="up" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Before vs After</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={beforeAfterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v: unknown) => `$${v}K`}
                />
                <Legend />
                <Bar dataKey="before" fill="#64748b" name="Baseline" />
                <Bar dataKey="after" fill="#3b82f6" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {typeBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v: unknown) => formatCurrency(Number(v))}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost vs Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="cost" name="Cost" stroke="#94a3b8" tickFormatter={(v) => `$${v}K`} />
              <YAxis
                dataKey="revenue"
                name="Revenue"
                stroke="#94a3b8"
                tickFormatter={(v) => `$${v}K`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                formatter={(v: unknown) => `$${v}K`}
              />
              <Scatter data={scatterData} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promotion Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={mockPromos as unknown as Record<string, unknown>[]}
            pageSize={10}
            caption="Promotion performance table"
            ariaLabel="Promotion performance data table for retail promo analysis"
          />
        </CardContent>
      </Card>
    </div>
  );
}
