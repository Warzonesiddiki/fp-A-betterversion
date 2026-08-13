import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  Landmark,
  FileText,
  Table as TableIcon,
  Percent,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { roundTo, sumMoney, subtractMoney } from '@/utils/money';
import type { GLEntry } from '@/types';

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
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
interface JurisdictionRow {
  jurisdiction: string;
  pretaxIncome: number;
  taxRate: number;
  provision: number;
  deferred: number;
  current: number;
}

export function computeTaxRevenue(entries: readonly GLEntry[]): number {
  const revEntries = entries.filter((e) => (e.accountCode || '').startsWith('4'));
  const values = revEntries.map((e) => subtractMoney(e.credit, e.debit));
  return roundTo(sumMoney(values), 2);
}

export function computeTaxExpenses(entries: readonly GLEntry[]): number {
  const expEntries = entries.filter((e) => (e.accountCode || '').startsWith('6'));
  const values = expEntries.map((e) => Math.abs(roundTo(subtractMoney(e.debit, e.credit), 2)));
  return roundTo(sumMoney(values), 2);
}

export default function TaxProvisionPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Tax Provision';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const revenue = computeTaxRevenue(entries);
    const expenses = computeTaxExpenses(entries);
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
    const totalProvision = roundTo(sumMoney(jurisdictions.map((j) => j.provision)), 2);
    const totalDeferred = roundTo(sumMoney(jurisdictions.map((j) => j.deferred)), 2);
    const effectiveRate = pretaxIncome > 0 ? (totalProvision / pretaxIncome) * 100 : 0;
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const trend = quarters.map((q, _i) => ({
      quarter: q,
      rate: 18 + ((_i * 3) % 5),
      provision: Math.round(totalProvision / 4 + ((_i * 2300) % 10000)),
    }));
    return {
      revenue,
      expenses,
      pretaxIncome,
      jurisdictions,
      totalProvision,
      totalDeferred,
      totalCurrent: roundTo(sumMoney(jurisdictions.map((j) => j.current)), 2),
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
    void ExportEngine.exportToPDF(
      {
        headers: ['Jurisdiction', 'Pre-Tax Income', 'Tax Rate', 'Provision', 'Deferred', 'Current'],
        rows: data.jurisdictions.map((j) => [
          j.jurisdiction,
          fmt.currency0(j.pretaxIncome),
          formatPercent(j.taxRate, 2),
          fmt.currency0(j.provision),
          fmt.currency0(j.deferred),
          fmt.currency0(j.current),
        ]),
      },
      { title: 'Tax Provision Report', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!data) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Jurisdiction', 'Pre-Tax Income', 'Tax Rate', 'Provision', 'Deferred', 'Current'],
        rows: data.jurisdictions.map((j) => [
          j.jurisdiction,
          fmt.currency0(j.pretaxIncome),
          formatPercent(j.taxRate, 2),
          fmt.currency0(j.provision),
          fmt.currency0(j.deferred),
          fmt.currency0(j.current),
        ]),
      },
      { title: 'Tax_Provision_Report' }
    ).catch(reportExportFailure);
  };

  const columns: Column<JurisdictionRow>[] = [
    { key: 'jurisdiction', header: 'Jurisdiction', sortable: true },
    {
      key: 'pretaxIncome',
      header: 'Pre-Tax Income',
      align: 'right',
      render: (_value, row) => fmt.currency0(row.pretaxIncome),
      sortable: true,
    },
    {
      key: 'taxRate',
      header: 'Tax Rate',
      align: 'right',
      render: (_value, row) => formatPercent(Number(row.taxRate ?? 0), 2),
      sortable: true,
    },
    {
      key: 'provision',
      header: 'Provision',
      align: 'right',
      render: (_value, row) => fmt.currency0(row.provision),
      sortable: true,
    },
    {
      key: 'deferred',
      header: 'Deferred',
      align: 'right',
      render: (_value, row) => fmt.currency0(row.deferred),
      sortable: true,
    },
    {
      key: 'current',
      header: 'Current',
      align: 'right',
      render: (_value, row) => fmt.currency0(row.current),
      sortable: true,
    },
  ];

  if (!data)
    return (
      <div className="p-12 text-center">
        <Landmark className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data for tax provisioning.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Tax Provision"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Pre-Tax Income"
          value={fmt.currency0(data.pretaxIncome)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Total Provision"
          value={fmt.currency0(data.totalProvision)}
          icon={<Landmark className="h-4 w-4" />}
        />
        <KPIValue
          label="Effective Rate"
          value={`${formatPercent(data.effectiveRate, 1)}`}
          icon={<Percent className="h-4 w-4" />}
        />
        <KPIValue
          label="Deferred Tax"
          value={fmt.currency0(data.totalDeferred)}
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
                  tickFormatter={(v) => `$${formatCompact(v)}`}
                />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
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
                  formatter={(v) => `${formatPercent(Number(v), 1)}`}
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
      <DataTable
        columns={columns}
        data={data.jurisdictions}
        caption="Tax provision by jurisdiction: federal, state, and international tax components"
        ariaLabel="Tax provision by jurisdiction table"
      />
    </div>
  );
}
