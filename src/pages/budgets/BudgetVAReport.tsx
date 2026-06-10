import { useState, useMemo } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { useGLStore } from '@/store/glStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/ui/DataTable';
import { WaterfallChart, WaterfallItem } from '@/components/ui/WaterfallChart';
import { VarianceChart, VarianceDataPoint } from '@/components/charts/VarianceChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  FileBarChart,
  Filter,
  TrendingDown,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatPercent(n: number): string {
  return n.toFixed(1) + '%';
}

export default function BudgetVAReport() {
  const { budgets, lineItems } = useBudgetStore();
  const { entries } = useGLStore();
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');

  const approvedBudgets = useMemo(() => budgets.filter((b) => b.status === 'Approved'), [budgets]);

  const selectedBudget = useMemo(
    () => budgets.find((b) => b.id === selectedBudgetId),
    [budgets, selectedBudgetId]
  );

  const reportData = useMemo(() => {
    if (!selectedBudget) return [];

    // Group actuals by account code
    const actualsMap = new Map<string, number>();
    entries.forEach((e) => {
      const current = actualsMap.get(e.accountCode || '') || 0;
      // Budget is usually positive for both revenue/expense in simple models
      // Actuals need to be normalized
      const amt = (e.accountCode || '').startsWith('4')
        ? e.credit - e.debit // Revenue is credit - debit
        : e.debit - e.credit; // Expense is debit - credit
      actualsMap.set(e.accountCode || '', current + amt);
    });

    return lineItems
      .filter((li) => li.budgetId === selectedBudgetId)
      .map((item) => {
        const actual = actualsMap.get(item.accountCode) || 0;
        const budget = item.amount;
        const variance = actual - budget;
        const variancePct = budget !== 0 ? (variance / budget) * 100 : 0;

        return {
          id: item.id,
          accountCode: item.accountCode,
          accountName: item.accountName,
          budget,
          actual,
          variance,
          variancePct,
        };
      });
  }, [selectedBudget, entries]);

  const totals = useMemo(() => {
    const t = { budget: 0, actual: 0, variance: 0 };
    reportData.forEach((d) => {
      t.budget += d.budget;
      t.actual += d.actual;
      t.variance += d.variance;
    });
    return t;
  }, [reportData]);

  const waterfallData = useMemo<WaterfallItem[]>(() => {
    if (reportData.length === 0) return [];

    const items: WaterfallItem[] = [
      { label: 'Budget', value: totals.budget, isTotal: true, color: '#3b82f6' },
    ];

    // Show top 5 variances, then "Others"
    const sortedVariances = [...reportData].sort(
      (a, b) => Math.abs(b.variance) - Math.abs(a.variance)
    );
    const topVariances = sortedVariances.slice(0, 5);
    const otherVariance = sortedVariances.slice(5).reduce((acc, curr) => acc + curr.variance, 0);

    topVariances.forEach((v) => {
      items.push({
        label: v.accountName.split(' ')[0]!, // Short name
        value: v.variance,
      });
    });

    if (otherVariance !== 0) {
      items.push({ label: 'Others', value: otherVariance });
    }

    items.push({ label: 'Actual', value: totals.actual, isTotal: true, color: '#6366f1' });

    return items;
  }, [reportData, totals]);

  const barChartData = useMemo(() => {
    return reportData.slice(0, 8).map((d) => ({
      name: d.accountName.split(' ')[0]!,
      Budget: d.budget,
      Actual: d.actual,
    }));
  }, [reportData]);

  const varianceData = useMemo<VarianceDataPoint[]>(() => {
    return reportData.slice(0, 8).map((d) => ({
      name: d.accountName.split(' ')[0]!,
      budget: d.budget,
      actual: d.actual,
    }));
  }, [reportData]);

  const pieChartData = useMemo(() => {
    let favorable = 0;
    let unfavorable = 0;
    reportData.forEach((d) => {
      const variance = d.budget - d.actual;
      if (variance >= 0) {
        favorable += variance;
      } else {
        unfavorable += Math.abs(variance);
      }
    });
    return [
      { name: 'Favorable', value: favorable, color: '#16A34A' },
      { name: 'Unfavorable', value: unfavorable, color: '#DC2626' },
    ];
  }, [reportData]);

  const columns: Column[] = [
    { key: 'accountCode', header: 'Account' },
    { key: 'accountName', header: 'Name' },
    {
      key: 'budget',
      header: 'Budget',
      render: (value: unknown) => formatCurrency(Number(value ?? 0)),
    },
    {
      key: 'actual',
      header: 'Actual',
      render: (value: unknown) => formatCurrency(Number(value ?? 0)),
    },
    {
      key: 'variance',
      header: 'Variance',
      render: (value: unknown) => {
        const val = Number(value ?? 0);
        return (
          <span className={val > 0 ? 'text-red-400' : 'text-green-400'}>{formatCurrency(val)}</span>
        );
      },
    },
    {
      key: 'variancePct',
      header: 'Var %',
      render: (value: unknown) => {
        const val = Number(value ?? 0);
        return (
          <div className="flex items-center gap-1">
            {val > 0 ? (
              <ArrowUpRight className="h-3 w-3 text-red-400" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-green-400" />
            )}
            <span className={val > 0 ? 'text-red-400' : 'text-green-400'}>
              {formatPercent(Math.abs(val))}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-blue-400" />
            Budget vs. Actuals
          </h1>
          <p className="text-slate-400 text-sm mt-1">Analyze performance against approved plans.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedBudgetId}
            onChange={setSelectedBudgetId}
            placeholder="Select Approved Budget"
            className="w-64"
            options={approvedBudgets.map((b) => ({
              value: b.id,
              label: `${b.name} (${b.fiscalYear})`,
            }))}
          />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {!selectedBudgetId ? (
        <Card className="bg-slate-900/50 border-dashed border-slate-800 py-12">
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-slate-800 rounded-full inline-block">
              <FileBarChart className="h-8 w-8 text-slate-500" />
            </div>
            <div className="max-w-xs mx-auto">
              <h3 className="font-semibold text-lg text-slate-200">No Budget Selected</h3>
              <p className="text-sm text-slate-400 mt-2">
                Select an approved budget from the dropdown above to view the performance report.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Total Budget
                  </p>
                  <p className="text-xl font-bold text-white">{formatCurrency(totals.budget)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Total Actual
                  </p>
                  <p className="text-xl font-bold text-white">{formatCurrency(totals.actual)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={`p-2 rounded-lg ${totals.variance > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}
                >
                  {totals.variance > 0 ? (
                    <TrendingUp className="h-5 w-5 text-red-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Net Variance
                  </p>
                  <p
                    className={`text-xl font-bold ${totals.variance > 0 ? 'text-red-400' : 'text-green-400'}`}
                  >
                    {formatCurrency(totals.variance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <WaterfallChart data={waterfallData} title="Variance Decomposition" height={300} />

            <VarianceChart
              data={varianceData}
              height={300}
              ariaLabel="Budget vs Actual variance chart"
            />

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 opacity-60">
                  Budget vs. Actual by Account
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                    />
                    <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 opacity-60">
                  Variance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Detailed Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={reportData} pageSize={15} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
