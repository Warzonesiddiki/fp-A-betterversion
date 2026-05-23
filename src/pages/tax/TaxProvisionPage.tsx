import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  Landmark,
  Download,
  FileText,
  Table as TableIcon,
  Percent,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
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
  LineChart,
  Line,
} from 'recharts';
import { WaterfallChart, type WaterfallDataPoint } from '@/components/charts/WaterfallChart';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface JurisdictionRow {
  jurisdiction: string;
  pretaxIncome: number;
  taxRate: number;
  provision: number;
  deferred: number;
  current: number;
}

export default function TaxProvisionPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Tax Provision';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const revenue = entries
      .filter((e) => (e.accountCode || '').startsWith('4'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const expenses = entries
      .filter((e) => (e.accountCode || '').startsWith('6'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const pretaxIncome = revenue - expenses;
    const jurisdictions: JurisdictionRow[] = [
      {
        jurisdiction: 'Federal',
        pretaxIncome: pretaxIncome * 0.7,
        taxRate: 21,
        provision: pretaxIncome * 0.7 * 0.21,
        deferred: pretaxIncome * 0.7 * 0.03,
        current: pretaxIncome * 0.7 * 0.18,
      },
      {
        jurisdiction: 'State (CA)',
        pretaxIncome: pretaxIncome * 0.15,
        taxRate: 8.84,
        provision: pretaxIncome * 0.15 * 0.0884,
        deferred: pretaxIncome * 0.15 * 0.01,
        current: pretaxIncome * 0.15 * 0.0784,
      },
      {
        jurisdiction: 'State (NY)',
        pretaxIncome: pretaxIncome * 0.1,
        taxRate: 6.5,
        provision: pretaxIncome * 0.1 * 0.065,
        deferred: pretaxIncome * 0.1 * 0.005,
        current: pretaxIncome * 0.1 * 0.06,
      },
      {
        jurisdiction: 'International',
        pretaxIncome: pretaxIncome * 0.05,
        taxRate: 12.5,
        provision: pretaxIncome * 0.05 * 0.125,
        deferred: pretaxIncome * 0.05 * 0.02,
        current: pretaxIncome * 0.05 * 0.105,
      },
    ];
    const totalProvision = jurisdictions.reduce((s, j) => s + j.provision, 0);
    const totalDeferred = jurisdictions.reduce((s, j) => s + j.deferred, 0);
    const effectiveRate = pretaxIncome > 0 ? (totalProvision / pretaxIncome) * 100 : 0;
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const trend = quarters.map((q, i) => ({
      quarter: q,
      rate: 18 + Math.random() * 5,
      provision: Math.round(totalProvision / 4 + Math.random() * 10000),
    }));
    return {
      revenue,
      expenses,
      pretaxIncome,
      jurisdictions,
      totalProvision,
      totalDeferred,
      effectiveRate,
      trend,
      chartData: jurisdictions.map((j) => ({
        name: j.jurisdiction,
        provision: Math.round(j.provision),
        deferred: Math.round(j.deferred),
      })),
    };
  }, [entries]);

  const handleExportPDF = () => {
    if (!data) return;
    ExportEngine.exportToPDF(
      {
        headers: ['Jurisdiction', 'Pre-Tax Income', 'Tax Rate', 'Provision', 'Deferred', 'Current'],
        rows: data.jurisdictions.map((j) => [
          j.jurisdiction,
          formatCurrency(j.pretaxIncome),
          j.taxRate.toFixed(2) + '%',
          formatCurrency(j.provision),
          formatCurrency(j.deferred),
          formatCurrency(j.current),
        ]),
      },
      { title: 'Tax Provision Report', companyName: 'FinPlan Pro' }
    );
  };

  const handleExportExcel = () => {
    if (!data) return;
    ExportEngine.exportToExcel(
      {
        headers: ['Jurisdiction', 'Pre-Tax Income', 'Tax Rate', 'Provision', 'Deferred', 'Current'],
        rows: data.jurisdictions.map((j) => [
          j.jurisdiction,
          formatCurrency(j.pretaxIncome),
          j.taxRate.toFixed(2) + '%',
          formatCurrency(j.provision),
          formatCurrency(j.deferred),
          formatCurrency(j.current),
        ]),
      },
      { title: 'Tax_Provision_Report' }
    );
  };

  const columns: Column<JurisdictionRow>[] = [
    { key: 'jurisdiction', header: 'Jurisdiction', sortable: true },
    {
      key: 'pretaxIncome',
      header: 'Pre-Tax Income',
      align: 'right',
      render: (r) => formatCurrency(r.pretaxIncome),
      sortable: true,
    },
    {
      key: 'taxRate',
      header: 'Tax Rate',
      align: 'right',
      render: (r) => r.taxRate.toFixed(2) + '%',
      sortable: true,
    },
    {
      key: 'provision',
      header: 'Provision',
      align: 'right',
      render: (r) => formatCurrency(r.provision),
      sortable: true,
    },
    {
      key: 'deferred',
      header: 'Deferred',
      align: 'right',
      render: (r) => formatCurrency(r.deferred),
      sortable: true,
    },
    {
      key: 'current',
      header: 'Current',
      align: 'right',
      render: (r) => formatCurrency(r.current),
      sortable: true,
    },
  ];

  if (!data)
    return (
      <div className="p-12 text-center">
        <Landmark className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data for tax provisioning.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tax Provision</h1>
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
          label="Pre-Tax Income"
          value={formatCurrency(data.pretaxIncome)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Total Provision"
          value={formatCurrency(data.totalProvision)}
          icon={<Landmark className="h-4 w-4" />}
        />
        <KPIValue
          label="Effective Rate"
          value={`${data.effectiveRate.toFixed(1)}%`}
          icon={<Percent className="h-4 w-4" />}
        />
        <KPIValue
          label="Deferred Tax"
          value={formatCurrency(data.totalDeferred)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Provision by Jurisdiction</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
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
                <Bar
                  dataKey="provision"
                  fill="#3b82f6"
                  name="Current"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="deferred"
                  fill="#f59e0b"
                  name="Deferred"
                  stackId="a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Effective Tax Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  domain={[0, 30]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v: any) => `${v.toFixed(1)}%`}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="ETR"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tax Provision Waterfall</CardTitle>
        </CardHeader>
        <CardContent>
          <WaterfallChart
            data={
              [
                { name: 'Pre-Tax Income', value: data.pretaxIncome },
                { name: 'Current Tax', value: -data.totalCurrent },
                { name: 'Deferred Tax', value: -data.totalDeferred },
                { name: 'Other Adj', value: 0 },
                { name: 'Net Income', value: data.pretaxIncome - data.totalProvision },
              ] as WaterfallDataPoint[]
            }
            height={200}
            ariaLabel="Tax provision waterfall chart"
          />
        </CardContent>
      </Card>
      <DataTable columns={columns} data={data.jurisdictions} />
    </div>
  );
}
