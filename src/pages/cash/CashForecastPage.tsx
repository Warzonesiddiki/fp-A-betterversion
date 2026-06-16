/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  DollarSign,
  Download,
  FileText,
  Table as TableIcon,
  TrendingUp,
  TrendingDown,
  Flame,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';

const getRandom = () => Math.random();

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import { SparklineChart } from '@/components/charts/SparklineChart';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface CategoryRow {
  category: string;
  inflows: number;
  outflows: number;
  net: number;
}

export default function CashForecastPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Cash Forecast';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const inflows = entries
      .filter((e) => e.debit - e.credit > 0)
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const outflows = entries
      .filter((e) => e.debit - e.credit < 0)
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const net = inflows - outflows;
    const categories: CategoryRow[] = [
      { category: 'Revenue', inflows: inflows * 0.7, outflows: 0, net: inflows * 0.7 },
      { category: 'Other Income', inflows: inflows * 0.3, outflows: 0, net: inflows * 0.3 },
      { category: 'Payroll', inflows: 0, outflows: outflows * 0.4, net: -outflows * 0.4 },
      {
        category: 'Operating Expenses',
        inflows: 0,
        outflows: outflows * 0.35,
        net: -outflows * 0.35,
      },
      {
        category: 'Capital Expenditures',
        inflows: 0,
        outflows: outflows * 0.15,
        net: -outflows * 0.15,
      },
      { category: 'Debt Service', inflows: 0, outflows: outflows * 0.1, net: -outflows * 0.1 },
    ];
    const weeks = Array.from({ length: 13 }, (_, i) => `W${i + 1}`);
    const balance = inflows - outflows;
    const forecast = weeks.map((w, i) => {
      const weekInflow = (inflows / 13) * (0.8 + getRandom() * 0.4);
      const weekOutflow = (outflows / 13) * (0.8 + getRandom() * 0.4);
      return {
        week: w,
        inflows: Math.round(weekInflow),
        outflows: Math.round(weekOutflow),
        net: Math.round(weekInflow - weekOutflow),
        balance: Math.round(balance + (weekInflow - weekOutflow) * (i + 1)),
      };
    });
    const burnRate = outflows / 4;
    const endingCash = forecast![forecast.length - 1]!.balance;
    return { inflows, outflows, net, categories, forecast, burnRate, endingCash };
  }, [entries]);

  const handleExportPDF = () => {
    if (!data) return;
    ExportEngine.exportToPDF(
      {
        headers: ['Category', 'Inflows', 'Outflows', 'Net'],
        rows: data.categories.map((c) => [
          c.category,
          formatCurrency(c.inflows),
          formatCurrency(c.outflows),
          formatCurrency(c.net),
        ]),
      },
      { title: 'Cash Forecast Report', companyName: 'FinPlan Pro' }
    );
  };

  const handleExportExcel = () => {
    if (!data) return;
    ExportEngine.exportToExcel(
      {
        headers: ['Category', 'Inflows', 'Outflows', 'Net'],
        rows: data.categories.map((c) => [
          c.category,
          formatCurrency(c.inflows),
          formatCurrency(c.outflows),
          formatCurrency(c.net),
        ]),
      },
      { title: 'Cash_Forecast_Report' }
    );
  };

  const catColumns: Column<CategoryRow>[] = [
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'inflows',
      header: 'Inflows',
      align: 'right',
      render: (r) => <span className="text-green-400">{formatCurrency(r.inflows)}</span>,
      sortable: true,
    },
    {
      key: 'outflows',
      header: 'Outflows',
      align: 'right',
      render: (r) => <span className="text-red-400">{formatCurrency(r.outflows)}</span>,
      sortable: true,
    },
    {
      key: 'net',
      header: 'Net',
      align: 'right',
      render: (r) => (
        <span className={r.net >= 0 ? 'text-green-400' : 'text-red-400'}>
          {formatCurrency(r.net)}
        </span>
      ),
      sortable: true,
    },
  ];

  if (!data)
    return (
      <div className="p-12 text-center">
        <DollarSign className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to forecast cash flow.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">13-Week Cash Forecast</h1>
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
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Operating Cash"
          value={formatCurrency(data.net)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Total Inflows"
          value={formatCurrency(data.inflows)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Total Outflows"
          value={formatCurrency(data.outflows)}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KPIValue
          label="Ending Cash"
          value={formatCurrency(data.endingCash)}
          icon={<Flame className="h-4 w-4" />}
        />
        <div className="col-span-2 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Balance Trend</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <SparklineChart
                data={data.forecast.map((w: { balance: number }) => w.balance)}
                color="#3b82f6"
                height={50}
                width={300}
                ariaLabel="Cash balance sparkline trend"
              />
              <span className="text-sm text-slate-400">13-week trend</span>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Forecast (13 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: any) => formatCurrency(v)}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              />
              <Legend />
              <Bar dataKey="inflows" fill="#10b981" name="Inflows" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflows" fill="#ef4444" name="Outflows" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Balance"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <DataTable
        columns={catColumns}
        data={data.categories}
        caption="Cash forecast category breakdown by period"
        ariaLabel="Cash forecast categories table"
      />
    </div>
  );
}
