/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FileText, Table as TableIcon } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { formatPercent } from '@/utils/financialFormatting';
import { sumMoney, roundTo } from '@/utils/money';
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
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const mockExposures = [
  {
    currency: 'EUR',
    symbol: '\u20AC',
    exposure: 12500000,
    rate: 1.08,
    hedged: 8000000,
    hedgeRatio: 64,
    unrealizedGL: 325000,
  },
  {
    currency: 'GBP',
    symbol: '\u00A3',
    exposure: 8200000,
    rate: 1.27,
    hedged: 5000000,
    hedgeRatio: 61,
    unrealizedGL: -180000,
  },
  {
    currency: 'JPY',
    symbol: '\u00A5',
    exposure: 4500000,
    rate: 0.0067,
    hedged: 3000000,
    hedgeRatio: 67,
    unrealizedGL: 95000,
  },
  {
    currency: 'CHF',
    symbol: 'CHF',
    exposure: 3200000,
    rate: 1.12,
    hedged: 1500000,
    hedgeRatio: 47,
    unrealizedGL: -42000,
  },
  {
    currency: 'CAD',
    symbol: 'C$',
    exposure: 2800000,
    rate: 0.74,
    hedged: 2800000,
    hedgeRatio: 100,
    unrealizedGL: 15000,
  },
  {
    currency: 'AUD',
    symbol: 'A$',
    exposure: 1900000,
    rate: 0.65,
    hedged: 800000,
    hedgeRatio: 42,
    unrealizedGL: -28000,
  },
];

const netExposureData = mockExposures.map((e) => ({
  currency: e.currency,
  gross: e.exposure / 1e6,
  hedged: e.hedged / 1e6,
  unhedged: (e.exposure - e.hedged) / 1e6,
}));

const hedgeBreakdown = mockExposures.map((e) => ({ name: e.currency, value: e.hedged }));

export default function FXExposurePage() {
  const { entries } = useGLStore();
  const _navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — FX Exposure';
  }, []);

  const totalExposure = roundTo(sumMoney(mockExposures.map((e) => e.exposure)), 2);
  const totalHedged = roundTo(sumMoney(mockExposures.map((e) => e.hedged)), 2);
  const totalUnrealizedGL = roundTo(sumMoney(mockExposures.map((e) => e.unrealizedGL)), 2);
  const overallHedgeRatio = totalExposure > 0 ? (totalHedged / totalExposure) * 100 : 0;

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const columns: Column[] = useMemo(
    () => [
      { key: 'currency', header: 'Currency', sortable: true },
      { key: 'symbol', header: 'Symbol', width: '60px' },
      {
        key: 'exposure',
        header: 'Gross Exposure',
        align: 'right',
        render: (v) => formatCurrency(v as number),
      },
      {
        key: 'rate',
        header: 'Spot Rate',
        align: 'right',
        render: (v) => String(Math.round((v as number) * 10000) / 10000),
      },
      {
        key: 'hedged',
        header: 'Hedged Amount',
        align: 'right',
        render: (v) => formatCurrency(v as number),
      },
      {
        key: 'hedgeRatio',
        header: 'Hedge Ratio',
        align: 'right',
        render: (v) => {
          const ratio = v as number;
          return (
            <span
              className={
                ratio >= 60 ? 'text-green-400' : ratio >= 40 ? 'text-yellow-400' : 'text-red-400'
              }
            >
              {ratio}%
            </span>
          );
        },
      },
      {
        key: 'unrealizedGL',
        header: 'Unrealized G/L',
        align: 'right',
        render: (v) => {
          const val = v as number;
          return (
            <span className={val >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatCurrency(val)}
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
        headers: ['Currency', 'Gross Exposure', 'Hedged', 'Hedge Ratio', 'Unrealized G/L'],
        rows: mockExposures.map((e) => [
          e.currency,
          formatCurrency(e.exposure),
          formatCurrency(e.hedged),
          `${e.hedgeRatio}%`,
          formatCurrency(e.unrealizedGL),
        ]),
      },
      { title: 'FX Exposure Report' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: [
          'Currency',
          'Gross Exposure',
          'Hedged',
          'Hedge Ratio',
          'Spot Rate',
          'Unrealized G/L',
        ],
        rows: mockExposures.map((e) => [
          e.currency,
          e.exposure,
          e.hedged,
          e.hedgeRatio,
          e.rate,
          e.unrealizedGL,
        ]),
      },
      { title: 'FX_Exposure_Report' }
    ).catch(reportExportFailure);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FX Exposure</h1>
          <p className="text-sm text-slate-400 mt-1">
            Foreign currency risk monitoring and hedging status
          </p>
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
        <KPIValue label="Total Exposure" value={formatCurrency(totalExposure)} />
        <KPIValue label="Total Hedged" value={formatCurrency(totalHedged)} />
        <KPIValue
          label="Hedge Ratio"
          value={formatPercent(overallHedgeRatio, 0)}
          trend={overallHedgeRatio >= 60 ? 'up' : 'down'}
          changeLabel="Target: 60%"
        />
        <KPIValue
          label="Unrealized G/L"
          value={formatCurrency(totalUnrealizedGL)}
          trend={totalUnrealizedGL >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Net Exposure by Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={netExposureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="currency" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v: any) => `$${Math.round(v * 10) / 10}M`}
                />
                <Legend />
                <Bar dataKey="hedged" stackId="a" fill="#10b981" name="Hedged" />
                <Bar dataKey="unhedged" stackId="a" fill="#ef4444" name="Unhedged" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hedge Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={hedgeBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {hedgeBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v: any) => formatCurrency(v)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currency Exposure Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={mockExposures as unknown as Record<string, unknown>[]}
            pageSize={10}
            caption="Currency exposure detail table"
            ariaLabel="Currency exposure detail data table for FX exposure"
          />
        </CardContent>
      </Card>
    </div>
  );
}
