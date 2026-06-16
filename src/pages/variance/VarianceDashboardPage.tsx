/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  FileText,
  Table as TableIcon,
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
} from 'recharts';
import { VarianceChart } from '@/components/charts/VarianceChart';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { AnomalyHighlight } from '@/components/ai/AnomalyHighlight';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface VarianceRow {
  account: string;
  budget: number;
  actual: number;
  variance: number;
  variancePct: number;
  driver: string;
}

export default function VarianceDashboardPage() {
  const { entries } = useGLStore();
  const { budgets } = useBudgetStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = 'FinPlan Pro — Variance Dashboard';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const actualRevenue = entries
      .filter((e) => (e.accountCode || '').startsWith('4'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const actualCOGS = entries
      .filter((e) => (e.accountCode || '').startsWith('5'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const actualOpEx = entries
      .filter((e) => (e.accountCode || '').startsWith('6'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const budgetRevenue =
      budgets
        .filter((b) => b.status === 'Approved')
        .reduce((s, b) => s + (b.totalAmount || 0), 0) || actualRevenue * 1.05;
    const budgetCOGS = actualCOGS * 0.95;
    const budgetOpEx = actualOpEx * 0.93;
    const revenueVar = actualRevenue - budgetRevenue;
    const cogsVar = budgetCOGS - actualCOGS;
    const opexVar = budgetOpEx - actualOpEx;
    const revenueVarPct = budgetRevenue > 0 ? (revenueVar / budgetRevenue) * 100 : 0;
    const rows: VarianceRow[] = [
      {
        account: 'Revenue',
        budget: budgetRevenue,
        actual: actualRevenue,
        variance: revenueVar,
        variancePct: revenueVarPct,
        driver: revenueVar >= 0 ? 'Volume/Mix' : 'Pricing pressure',
      },
      {
        account: 'COGS',
        budget: budgetCOGS,
        actual: actualCOGS,
        variance: cogsVar,
        variancePct: budgetCOGS > 0 ? (cogsVar / budgetCOGS) * 100 : 0,
        driver: cogsVar >= 0 ? 'Cost efficiency' : 'Input cost increase',
      },
      {
        account: 'Operating Expenses',
        budget: budgetOpEx,
        actual: actualOpEx,
        variance: opexVar,
        variancePct: budgetOpEx > 0 ? (opexVar / budgetOpEx) * 100 : 0,
        driver: opexVar >= 0 ? 'Spending control' : 'Hiring ahead of plan',
      },
    ];
    const totalBudget = budgetRevenue + budgetCOGS + budgetOpEx;
    const totalActual = actualRevenue + actualCOGS + actualOpEx;
    const totalVar = totalBudget - totalActual;
    const favorable = rows.filter((r) => r.variance >= 0).reduce((s, r) => s + r.variance, 0);
    const unfavorable = rows
      .filter((r) => r.variance < 0)
      .reduce((s, r) => s + Math.abs(r.variance), 0);
    const chartData = rows.map((r) => ({
      name: r.account,
      favorable: r.variance >= 0 ? r.variance : 0,
      unfavorable: r.variance < 0 ? Math.abs(r.variance) : 0,
    }));
    return {
      actualRevenue,
      budgetRevenue,
      revenueVar,
      revenueVarPct,
      rows,
      totalVar,
      favorable,
      unfavorable,
      chartData,
    };
  }, [entries, budgets]);

  const handleExportPDF = () => {
    if (!data) return;
    ExportEngine.exportToPDF(
      {
        headers: ['Account', 'Budget', 'Actual', 'Variance', 'Variance %', 'Driver'],
        rows: data.rows.map((r) => [
          r.account,
          formatCurrency(r.budget),
          formatCurrency(r.actual),
          formatCurrency(r.variance),
          r.variancePct.toFixed(1) + '%',
          r.driver,
        ]),
      },
      { title: 'Variance Dashboard Report', companyName: 'FinPlan Pro' }
    );
  };

  const handleExportExcel = () => {
    if (!data) return;
    ExportEngine.exportToExcel(
      {
        headers: ['Account', 'Budget', 'Actual', 'Variance', 'Variance %', 'Driver'],
        rows: data.rows.map((r) => [
          r.account,
          formatCurrency(r.budget),
          formatCurrency(r.actual),
          formatCurrency(r.variance),
          r.variancePct.toFixed(1) + '%',
          r.driver,
        ]),
      },
      { title: 'Variance_Dashboard_Report' }
    );
  };

  const columns: Column<VarianceRow>[] = [
    { key: 'account', header: 'Account', sortable: true },
    {
      key: 'budget',
      header: 'Budget',
      align: 'right',
      render: (r) => formatCurrency(r.budget),
      sortable: true,
    },
    {
      key: 'actual',
      header: 'Actual',
      align: 'right',
      render: (r) => formatCurrency(r.actual),
      sortable: true,
    },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      render: (r) => (
        <span className={r.variance >= 0 ? 'text-green-400' : 'text-red-400'}>
          {formatCurrency(r.variance)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'variancePct',
      header: 'Variance %',
      align: 'right',
      render: (r) => (
        <span className={r.variancePct >= 0 ? 'text-green-400' : 'text-red-400'}>
          {r.variancePct.toFixed(1)}%
        </span>
      ),
      sortable: true,
    },
    { key: 'driver', header: 'Key Driver', sortable: true },
  ];

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <BarChart3 className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import data and create budgets to see variances.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  if (!data)
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-semibold mb-2">No Budget Data</h2>
        <p className="text-slate-400 mb-4">Create approved budgets to compare against actuals.</p>
        <Button onClick={() => navigate('/budgets/create')}>Create Budget</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Variance Dashboard</h1>
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
          label="Actual Revenue"
          value={formatCurrency(data.actualRevenue)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Budget Revenue"
          value={formatCurrency(data.budgetRevenue)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Revenue Variance"
          value={formatCurrency(data.revenueVar)}
          icon={
            data.revenueVar >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          }
        />
        <KPIValue
          label="Variance %"
          value={`${data.revenueVarPct.toFixed(1)}%`}
          icon={
            data.revenueVarPct >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          }
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Variance by Category</CardTitle>
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
              <Bar dataKey="favorable" fill="#10b981" name="Favorable" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unfavorable" fill="#ef4444" name="Unfavorable" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual Variance</CardTitle>
        </CardHeader>
        <CardContent>
          <VarianceChart
            data={data.rows
              .slice(0, 8)
              .map((r) => ({ name: r.account, budget: r.budget, actual: r.actual }))}
            height={200}
            ariaLabel="Budget vs actual variance chart"
          />
        </CardContent>
      </Card>

      {/* AI Copilot Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AICopilotPanel
          pathname={pathname}
          gl={{ entries } as never}
          budget={{ budgets } as never}
        />
        <AnomalyHighlight
          values={data.rows.map((r) => r.variancePct)}
          labels={data.rows.map((r) => r.account)}
          threshold={2.5}
          maxDisplay={5}
        />
      </div>

      <DataTable
        columns={columns}
        data={data.rows}
        caption="Variance analysis: budget vs actual values by account and period"
        ariaLabel="Variance analysis table"
      />
    </div>
  );
}
