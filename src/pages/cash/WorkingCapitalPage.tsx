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
  Download,
  FileText,
  Table as TableIcon,
  DollarSign,
  TrendingUp,
  Scale,
  Clock,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';

const getRandom = () => Math.random();

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

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface ComponentRow {
  component: string;
  amount: number;
  ratio: string;
  days: number;
}

export default function WorkingCapitalPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Working Capital';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const assets = entries
      .filter(
        (e) => (e.accountCode || '').startsWith('11') || (e.accountCode || '').startsWith('12')
      )
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const liabilities = entries
      .filter((e) => (e.accountCode || '').startsWith('21'))
      .reduce((s, e) => s + (e.credit - e.debit), 0);
    const wc = assets - liabilities;
    const currentRatio = liabilities > 0 ? assets / liabilities : 0;
    const quickRatio = liabilities > 0 ? (assets * 0.7) / liabilities : 0;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trend = months.map((m, i) => ({
      month: m,
      assets: Math.round(assets * (0.9 + i * 0.02 + getRandom() * 0.05)),
      liabilities: Math.round(liabilities * (0.9 + i * 0.02 + getRandom() * 0.05)),
      wc: Math.round(wc * (0.85 + i * 0.03 + getRandom() * 0.1)),
    }));
    const revenue = entries
      .filter((e) => (e.accountCode || '').startsWith('4'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const cogs = entries
      .filter((e) => (e.accountCode || '').startsWith('5'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const components: ComponentRow[] = [
      { component: 'Cash & Equivalents', amount: assets * 0.3, ratio: 'Current Asset', days: 0 },
      {
        component: 'Accounts Receivable',
        amount: assets * 0.35,
        ratio: 'Current Asset',
        days: revenue > 0 ? Math.round(((assets * 0.35) / revenue) * 365) : 0,
      },
      {
        component: 'Inventory',
        amount: assets * 0.25,
        ratio: 'Current Asset',
        days: cogs > 0 ? Math.round(((assets * 0.25) / cogs) * 365) : 0,
      },
      { component: 'Other Current Assets', amount: assets * 0.1, ratio: 'Current Asset', days: 0 },
      {
        component: 'Accounts Payable',
        amount: liabilities * 0.4,
        ratio: 'Current Liability',
        days: cogs > 0 ? Math.round(((liabilities * 0.4) / cogs) * 365) : 0,
      },
      {
        component: 'Accrued Expenses',
        amount: liabilities * 0.35,
        ratio: 'Current Liability',
        days: 0,
      },
      {
        component: 'Short-term Debt',
        amount: liabilities * 0.25,
        ratio: 'Current Liability',
        days: 0,
      },
    ];
    const dso = components.find((c) => c.component === 'Accounts Receivable')?.days || 0;
    const dpo = components.find((c) => c.component === 'Accounts Payable')?.days || 0;
    const dio = components.find((c) => c.component === 'Inventory')?.days || 0;
    const ccc = dso + dio - dpo;
    return {
      assets,
      liabilities,
      wc,
      currentRatio,
      quickRatio,
      trend,
      components,
      dso,
      dpo,
      dio,
      ccc,
    };
  }, [entries]);

  const handleExportPDF = () => {
    if (!data) return;
    ExportEngine.exportToPDF(
      {
        headers: ['Component', 'Amount', 'Type', 'Days'],
        rows: data.components.map((c) => [
          c.component,
          formatCurrency(c.amount),
          c.ratio,
          c.days.toString(),
        ]),
      },
      { title: 'Working Capital Report', companyName: 'FinPlan Pro' }
    );
  };

  const handleExportExcel = () => {
    if (!data) return;
    ExportEngine.exportToExcel(
      {
        headers: ['Component', 'Amount', 'Type', 'Days'],
        rows: data.components.map((c) => [
          c.component,
          formatCurrency(c.amount),
          c.ratio,
          c.days.toString(),
        ]),
      },
      { title: 'Working_Capital_Report' }
    );
  };

  const columns: Column<ComponentRow>[] = [
    { key: 'component', header: 'Component', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (r) => formatCurrency(r.amount),
      sortable: true,
    },
    { key: 'ratio', header: 'Type', sortable: true },
    {
      key: 'days',
      header: 'Days',
      align: 'right',
      render: (r) => (r.days > 0 ? `${r.days} days` : '-'),
      sortable: true,
    },
  ];

  if (!data)
    return (
      <div className="p-12 text-center">
        <Scale className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to analyze working capital.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Working Capital</h1>
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
          label="Working Capital"
          value={formatCurrency(data.wc)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Current Ratio"
          value={data.currentRatio.toFixed(2)}
          icon={<Scale className="h-4 w-4" />}
        />
        <KPIValue
          label="Quick Ratio"
          value={data.quickRatio.toFixed(2)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Cash Conversion Cycle"
          value={`${data.ccc} days`}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-slate-400">DSO</div>
            <div className="text-lg font-bold">{data.dso} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-slate-400">DIO</div>
            <div className="text-lg font-bold">{data.dio} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-slate-400">DPO</div>
            <div className="text-lg font-bold">{data.dpo} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-slate-400">CCC</div>
            <div
              className={`text-lg font-bold ${data.ccc <= 30 ? 'text-green-400' : data.ccc <= 60 ? 'text-yellow-400' : 'text-red-400'}`}
            >
              {data.ccc} days
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Working Capital Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
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
              <Area
                type="monotone"
                dataKey="assets"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                name="Current Assets"
              />
              <Area
                type="monotone"
                dataKey="liabilities"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.2}
                name="Current Liabilities"
              />
              <Area
                type="monotone"
                dataKey="wc"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="Working Capital"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={data.components} />
    </div>
  );
}
