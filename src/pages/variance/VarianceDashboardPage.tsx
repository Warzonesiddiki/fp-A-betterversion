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
import { reportExportFailure } from '@/utils/exportErrorHandler';

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

/** Account categories rolled up from GL/budget account-code prefixes. */
const CATEGORY_DEFS: ReadonlyArray<{
  key: 'Revenue' | 'COGS' | 'Operating Expenses';
  prefixes: readonly string[];
  favorableDriver: string;
  unfavorableDriver: string;
}> = [
  {
    key: 'Revenue',
    prefixes: ['4'],
    favorableDriver: 'Volume/Mix',
    unfavorableDriver: 'Pricing pressure',
  },
  {
    key: 'COGS',
    prefixes: ['5'],
    favorableDriver: 'Cost efficiency',
    unfavorableDriver: 'Input cost increase',
  },
  {
    key: 'Operating Expenses',
    prefixes: ['6', '7'],
    favorableDriver: 'Spending control',
    unfavorableDriver: 'Hiring ahead of plan',
  },
];

export default function VarianceDashboardPage() {
  const { entries } = useGLStore();
  // Defensive default: some legacy test doubles for useBudgetStore mock only
  // a subset of the real store shape. Rather than crash with "Cannot read
  // properties of undefined (reading 'filter')" on any consumer that omits
  // lineItems, degrade to "no approved budget data" (the correct empty
  // state already handles this) instead of throwing.
  const { budgets, lineItems = [] } = useBudgetStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = 'FinPlan Pro — Variance Dashboard';
  }, []);

  // Only an APPROVED budget is a legitimate baseline for variance reporting.
  // Prior versions of this page fabricated a "budget" by scaling actuals
  // (revenue x1.05, COGS x0.95, opex x0.93) whenever no approved budget line
  // items existed, then presented those invented numbers as real budget vs
  // actual variance with no disclosure. That is a P1 faked-calculation
  // defect for financial software: it renders confident, wrong numbers.
  // This page now only computes variance from real budget line items tied
  // to an approved budget; if none exist, it says so explicitly instead of
  // inventing a comparison baseline.
  const approvedBudgetIds = useMemo(
    () => new Set(budgets.filter((b) => b.status === 'Approved').map((b) => b.id)),
    [budgets]
  );

  const approvedLineItems = useMemo(
    () => lineItems.filter((li) => approvedBudgetIds.has(li.budgetId)),
    [lineItems, approvedBudgetIds]
  );

  const data = useMemo(() => {
    if (entries.length === 0 || approvedLineItems.length === 0) return null;

    // Real actuals from the GL, normalized so revenue and expense variances
    // both read positive-is-favorable (matches BudgetVAReport's convention).
    const actualByCategory = new Map<string, number>();
    const budgetByCategory = new Map<string, number>();

    for (const cat of CATEGORY_DEFS) {
      const inCategory = (code: string) => cat.prefixes.some((p) => code.startsWith(p));

      const actual = entries
        .filter((e) => inCategory(e.accountCode || ''))
        .reduce((s, e) => {
          const amt =
            cat.key === 'Revenue'
              ? e.credit - e.debit // revenue: credit-normal
              : e.debit - e.credit; // COGS/opex: debit-normal, expressed as a positive cost
          return s + amt;
        }, 0);

      const budget = approvedLineItems
        .filter((li) => inCategory(li.accountCode))
        .reduce((s, li) => s + li.amount, 0);

      actualByCategory.set(cat.key, actual);
      budgetByCategory.set(cat.key, budget);
    }

    const rows: VarianceRow[] = CATEGORY_DEFS.map((cat) => {
      const actual = actualByCategory.get(cat.key) ?? 0;
      const budget = budgetByCategory.get(cat.key) ?? 0;
      // Revenue: actual > budget is favorable. COGS/Opex: actual < budget
      // (spending less than planned) is favorable — so variance is defined
      // as (budget - actual) for cost categories and (actual - budget) for
      // revenue, consistently yielding "positive variance = favorable".
      const variance = cat.key === 'Revenue' ? actual - budget : budget - actual;
      const variancePct = budget !== 0 ? (variance / Math.abs(budget)) * 100 : 0;
      return {
        account: cat.key,
        budget,
        actual,
        variance,
        variancePct,
        driver: variance >= 0 ? cat.favorableDriver : cat.unfavorableDriver,
      };
    });

    const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
    const totalActual = rows.reduce((s, r) => s + r.actual, 0);
    const totalVar = rows.reduce((s, r) => s + r.variance, 0);
    const favorable = rows.filter((r) => r.variance >= 0).reduce((s, r) => s + r.variance, 0);
    const unfavorable = rows
      .filter((r) => r.variance < 0)
      .reduce((s, r) => s + Math.abs(r.variance), 0);
    const chartData = rows.map((r) => ({
      name: r.account,
      favorable: r.variance >= 0 ? r.variance : 0,
      unfavorable: r.variance < 0 ? Math.abs(r.variance) : 0,
    }));

    const revenueRow = rows.find((r) => r.account === 'Revenue');

    return {
      actualRevenue: revenueRow?.actual ?? 0,
      budgetRevenue: revenueRow?.budget ?? 0,
      revenueVar: revenueRow?.variance ?? 0,
      revenueVarPct: revenueRow?.variancePct ?? 0,
      rows,
      totalBudget,
      totalActual,
      totalVar,
      favorable,
      unfavorable,
      chartData,
    };
  }, [entries, approvedLineItems]);

  const handleExportPDF = () => {
    if (!data) return;
    void ExportEngine.exportToPDF(
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
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!data) return;
    void ExportEngine.exportToExcel(
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
    ).catch(reportExportFailure);
  };

  const columns: Column<VarianceRow>[] = [
    { key: 'account', header: 'Account', sortable: true },
    {
      key: 'budget',
      header: 'Budget',
      align: 'right',
      render: (_value, row) => formatCurrency(row.budget),
      sortable: true,
    },
    {
      key: 'actual',
      header: 'Actual',
      align: 'right',
      render: (_value, row) => formatCurrency(row.actual),
      sortable: true,
    },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      render: (_value, row) => {
        const v = Number(row.variance ?? 0);
        return (
          <span className={v >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(v)}</span>
        );
      },
      sortable: true,
    },
    {
      key: 'variancePct',
      header: 'Variance %',
      align: 'right',
      render: (_value, row) => {
        const pct = Number(row.variancePct ?? 0);
        return (
          <span className={pct >= 0 ? 'text-green-400' : 'text-red-400'}>{pct.toFixed(1)}%</span>
        );
      },
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
