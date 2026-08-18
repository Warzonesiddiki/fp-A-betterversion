import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartCard } from '@/components/ui/ChartCard';
import { KPIValue } from '@/components/ui/KPIValue';
import { Button } from '@/components/ui/Button';
import { useGovernmentStore } from '@/store/governmentStore';
import { Landmark, DollarSign, Shield, TrendingUp, BarChart3 } from 'lucide-react';
import { formatPercent } from '@/utils/financialFormatting';
import { useGLStore } from '@/store/glStore';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import {
  deriveGovernmentDashboard,
  type CategoryAmountRow,
} from '@/pages/sectors/governmentDashboardData';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

/**
 * Government sector dashboard.
 *
 * Every figure comes from `@/pages/sectors/governmentDashboardData` — see its
 * correctness contract. This page used to fall back to `mockDepartmentBudget`,
 * `mockRevenueByCategory` and `mockSpendingDistribution` whenever the store was
 * empty (i.e. in every new workspace), carried a fully hardcoded KPI strip
 * ($11.8B / $8.95B / $800M / 1.48x / $1.9B / 87.3% / $342) and a typed FY2024
 * vs FY2025 table, and rendered budget lines as both "revenue" and "spending".
 */

export function GovernmentDashboardPage() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'spending'>('revenue');
  const { budgetLines } = useGovernmentStore();
  const { entries } = useGLStore();
  const fmt = useCurrencyFormatter();

  useEffect(() => {
    document.title = 'FinPlan Pro — Government Dashboard';
  }, []);

  const data = useMemo(
    () => deriveGovernmentDashboard(entries, budgetLines),
    [entries, budgetLines]
  );

  if (!data) {
    return (
      <main
        className="p-12 text-center max-w-md mx-auto"
        role="main"
        aria-label="Government Sector Dashboard"
      >
        <Landmark className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Government Data</h2>
        <p className="text-[var(--text-muted)]">
          Import ledger activity or appropriation lines to see revenue, expenditure and budget
          execution for your jurisdiction.
        </p>
      </main>
    );
  }

  const kpis = [
    { label: 'Posted Revenue', value: fmt.currency0(data.postedRevenue), icon: TrendingUp },
    {
      label: 'Posted Expenditure',
      value: fmt.currency0(data.postedExpenditure),
      icon: BarChart3,
    },
    { label: 'Surplus / (Deficit)', value: fmt.currency0(data.surplus), icon: DollarSign },
    {
      label: 'Budget Allocated',
      value: data.totalAllocated === null ? '\u2014' : fmt.currency0(data.totalAllocated),
      icon: Landmark,
    },
    {
      label: 'Budget Execution',
      value: formatPercent(data.overallExecutionPercent, 1),
      icon: Shield,
    },
  ];

  const revenueByCategory = data.revenueByCategory;
  const spendingDistribution = data.spendingDistribution;

  return (
    <main className="p-6 space-y-6" role="main" aria-label="Government Sector Dashboard">
      <PageHeader
        title="Government Dashboard"
        purpose="Public sector FP&A — budget execution, revenue, and fiscal health"
        actions={
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={<kpi.icon className="h-4 w-4" />}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Revenue by Category"
          height={280}
          actions={
            <div className="flex gap-1 text-xs">
              <button
                className={`px-2 py-1 rounded ${activeTab === 'revenue' ? 'font-semibold' : ''}`}
                style={{
                  color:
                    activeTab === 'revenue' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
                onClick={() => setActiveTab('revenue')}
              >
                Revenue
              </button>
              <button
                className={`px-2 py-1 rounded ${activeTab === 'spending' ? 'font-semibold' : ''}`}
                style={{
                  color:
                    activeTab === 'spending' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
                onClick={() => setActiveTab('spending')}
              >
                Spending
              </button>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...(activeTab === 'revenue' ? revenueByCategory : spendingDistribution)]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                tickFormatter={(v: number) => fmt.compact(v)}
              />
              <Tooltip
                formatter={(value) => [fmt.currency0(Number(value)), 'Amount']}
                contentStyle={{
                  background: 'var(--card-bg, #1e293b)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {(activeTab === 'revenue' ? revenueByCategory : spendingDistribution).map(
                  (_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  )
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spending Distribution" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[...spendingDistribution]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                paddingAngle={2}
              >
                {spendingDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [fmt.currency0(Number(value)), 'Amount']}
                contentStyle={{
                  background: 'var(--card-bg, #1e293b)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {spendingDistribution.map((item: CategoryAmountRow, i) => (
              <div key={item.name} className="flex items-center gap-1 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm" aria-label="Government department budget allocation">
              <caption className="sr-only">
                Government department budget allocation showing department, allocated amount, spent
                amount, and remaining balance
              </caption>
              <thead>
                <tr style={{ color: 'var(--text-secondary)' }}>
                  <th scope="col" className="text-left pb-2 font-medium">
                    Department
                  </th>
                  <th scope="col" className="text-right pb-2 font-medium">
                    Allocated
                  </th>
                  <th scope="col" className="text-right pb-2 font-medium">
                    Spent
                  </th>
                  <th scope="col" className="text-right pb-2 font-medium">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.departmentExecution.map((dept) => (
                  <tr
                    key={dept.department}
                    className="border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <td className="py-2" style={{ color: 'var(--text-primary)' }}>
                      {dept.department}
                    </td>
                    <td
                      className="py-2 text-right font-mono"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {fmt.currency0(dept.allocated)}
                    </td>
                    <td
                      className="py-2 text-right font-mono"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {fmt.currency0(dept.spent)}
                    </td>
                    <td className="py-2 text-right font-mono">
                      <span
                        className={
                          dept.executionPercent === null
                            ? 'text-[var(--text-muted)]'
                            : dept.executionPercent >= 95
                              ? 'text-green-600'
                              : dept.executionPercent >= 90
                                ? 'text-yellow-500'
                                : 'text-red-600'
                        }
                      >
                        {formatPercent(dept.executionPercent, 1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fiscal Year Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm" aria-label="Government sector metrics">
              <caption className="sr-only">Detailed government sector metrics</caption>
              <thead>
                <tr style={{ color: 'var(--text-secondary)' }}>
                  <th scope="col" className="text-left pb-2 font-medium">
                    Metric
                  </th>
                  <th scope="col" className="text-right pb-2 font-medium">
                    {data.priorFiscalYear ? `FY ${data.priorFiscalYear}` : 'Prior FY'}
                  </th>
                  <th scope="col" className="text-right pb-2 font-medium">
                    {data.currentFiscalYear ? `FY ${data.currentFiscalYear}` : 'Current FY'}
                  </th>
                  <th scope="col" className="text-right pb-2 font-medium">
                    YoY Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.fiscalYears.map((row) => (
                  <tr
                    key={row.metric}
                    className="border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <td className="py-2" style={{ color: 'var(--text-primary)' }}>
                      {row.metric}
                    </td>
                    <td
                      className="py-2 text-right font-mono"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {row.prior === null ? '\u2014' : fmt.currency0(row.prior)}
                    </td>
                    <td
                      className="py-2 text-right font-mono"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {fmt.currency0(row.current)}
                    </td>
                    <td className="py-2 text-right font-mono">
                      <span
                        className={
                          row.changePercent === null
                            ? 'text-[var(--text-muted)]'
                            : row.changePercent >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                        }
                      >
                        {formatPercent(row.changePercent, 1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {data.unavailable.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Not derivable from the general ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.unavailable.map((u) => (
                <li key={u.label}>
                  <span className="font-semibold">{u.label}</span>
                  <span className="text-[var(--text-muted)]"> — {u.reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

export default GovernmentDashboardPage;
