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
  Store,
  TrendingUp,
  Download,
  FileText,
  Table as TableIcon,
  ShoppingCart,
  DollarSign,
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
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatNumber, formatPercent } from '@/utils/financialFormatting';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface StoreRow {
  store: string;
  revenue: number;
  transactions: number;
  avgBasket: number;
  yoyGrowth: number;
}

export default function StoreDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Store Dashboard';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const revenueEntries = entries.filter((e) => (e.accountCode || '').startsWith('4'));
    const cogsEntries = entries.filter((e) => (e.accountCode || '').startsWith('5'));
    const totalRevenue = revenueEntries.reduce((s, e) => s + (e.debit - e.credit), 0);
    const totalCOGS = cogsEntries.reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0;
    const storeNames = ['Downtown', 'Mall', 'Airport', 'Online', 'Suburban'];
    const storeData: StoreRow[] = storeNames.map((name, _i) => {
      const rev = totalRevenue * (0.15 + getRandom() * 0.2);
      const txn = Math.floor(rev / (40 + getRandom() * 30));
      return {
        store: name,
        revenue: rev,
        transactions: txn,
        avgBasket: txn > 0 ? rev / txn : 0,
        yoyGrowth: 5 + getRandom() * 20,
      };
    });
    return {
      totalRevenue,
      totalCOGS,
      grossMargin,
      storeData,
      chartData: storeData.map((s) => ({
        name: s.store,
        revenue: Math.round(s.revenue),
        transactions: s.transactions,
      })),
    };
  }, [entries]);

  const handleExportPDF = () => {
    if (!data) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['Store', 'Revenue', 'Transactions', 'Avg Basket', 'YoY Growth'],
        rows: data.storeData.map((s) => [
          s.store,
          formatCurrency(s.revenue),
          s.transactions.toString(),
          formatCurrency(s.avgBasket),
          formatPercent(s.yoyGrowth, 1),
        ]),
      },
      { title: 'Store Dashboard Report', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!data) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Store', 'Revenue', 'Transactions', 'Avg Basket', 'YoY Growth'],
        rows: data.storeData.map((s) => [
          s.store,
          formatCurrency(s.revenue),
          s.transactions.toString(),
          formatCurrency(s.avgBasket),
          formatPercent(s.yoyGrowth, 1),
        ]),
      },
      { title: 'Store_Dashboard_Report' }
    ).catch(reportExportFailure);
  };

  const columns: Column[] = [
    { key: 'store', header: 'Store', sortable: true },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      render: (_value, row) => formatCurrency((row as unknown as StoreRow).revenue),
      sortable: true,
    },
    {
      key: 'transactions',
      header: 'Transactions',
      align: 'right',
      render: (_value, row) => (row as unknown as StoreRow).transactions.toLocaleString(),
      sortable: true,
    },
    {
      key: 'avgBasket',
      header: 'Avg Basket',
      align: 'right',
      render: (_value, row) => formatCurrency((row as unknown as StoreRow).avgBasket),
      sortable: true,
    },
    {
      key: 'yoyGrowth',
      header: 'YoY Growth',
      align: 'right',
      render: (_value, row) => (
        <span
          className={
            (row as unknown as StoreRow).yoyGrowth >= 0 ? 'text-green-400' : 'text-red-400'
          }
        >
          {formatPercent((row as unknown as StoreRow).yoyGrowth, 1)}
        </span>
      ),
      sortable: true,
    },
  ];

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <Store className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Retail Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view store performance.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Store Dashboard</h1>
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
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPIValue
              label="Total Revenue"
              value={formatCurrency(data.totalRevenue)}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <KPIValue
              label="Total COGS"
              value={formatCurrency(data.totalCOGS)}
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <KPIValue
              label="Gross Margin"
              value={`${formatPercent(data.grossMargin, 1)}`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <KPIValue
              label="Store Count"
              value={data.storeData.length.toString()}
              icon={<Store className="h-4 w-4" />}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Store</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(v) => `$${formatCompact(v)}`}
                  />
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <DataTable
            columns={columns}
            data={data.storeData}
            caption="Revenue by store table"
            ariaLabel="Revenue by store data table for retail dashboard"
          />
        </>
      )}
    </div>
  );
}
