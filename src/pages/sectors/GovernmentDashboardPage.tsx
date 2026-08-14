import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartCard } from '@/components/ui/ChartCard';
import { KPIValue } from '@/components/ui/KPIValue';
import { Button } from '@/components/ui/Button';
import { useGovernmentStore } from '@/store/governmentStore';
import { Landmark, Users, DollarSign, Shield, TrendingUp, BarChart3 } from 'lucide-react';
import { formatCompact } from '@/utils/financialFormatting';
import { roundTo } from '@/utils/money';
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

export function GovernmentDashboardPage() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'spending'>('revenue');
  const { budgetLines } = useGovernmentStore();

  useEffect(() => {
    document.title = 'FinPlan Pro — Government Dashboard';
  }, []);

  // demo defaults — replaced by real data when government budget data is imported via the government store
  const mockDepartmentBudget = [
    { department: 'Education', allocated: 3100, spent: 2890, pct: 93.2 },
    { department: 'Healthcare', allocated: 2750, spent: 2610, pct: 94.9 },
    { department: 'Infrastructure', allocated: 1900, spent: 1720, pct: 90.5 },
    { department: 'Public Safety', allocated: 1600, spent: 1540, pct: 96.3 },
    { department: 'Social Services', allocated: 1300, spent: 1180, pct: 90.8 },
    { department: 'Administration', allocated: 950, spent: 870, pct: 91.6 },
  ];

  const departmentBudget = budgetLines.length
    ? budgetLines.map((l) => ({
        department: l.category,
        allocated: l.budgeted,
        spent: l.actual,
        pct: l.budgeted > 0 ? roundTo((l.actual / l.budgeted) * 100, 1) : 0,
      }))
    : mockDepartmentBudget;

  // demo defaults — replaced by real data when revenue category data is imported via the government store
  const mockRevenueByCategory = [
    { name: 'Income Tax', value: 4200 },
    { name: 'Sales Tax', value: 2850 },
    { name: 'Property Tax', value: 1900 },
    { name: 'Federal Grants', value: 1650 },
    { name: 'Fees & Charges', value: 720 },
    { name: 'Other', value: 480 },
  ];

  // demo defaults — replaced by real data when spending data is imported via the government store
  const mockSpendingDistribution = [
    { name: 'Education', value: 3100 },
    { name: 'Healthcare', value: 2750 },
    { name: 'Infrastructure', value: 1900 },
    { name: 'Public Safety', value: 1600 },
    { name: 'Debt Service', value: 1200 },
    { name: 'Administration', value: 950 },
    { name: 'Social Services', value: 1300 },
  ];

  const revenueByCategory = budgetLines.length
    ? budgetLines.map((l) => ({ name: l.category, value: l.budgeted }))
    : mockRevenueByCategory;

  const spendingDistribution = budgetLines.length
    ? budgetLines.map((l) => ({ name: l.category, value: l.actual }))
    : mockSpendingDistribution;

  const fiscalYearComparison = [
    { metric: 'Total Revenue', fy2024: 10800, fy2025: 11800, change: 9.3 },
    { metric: 'Total Expenditure', fy2024: 10200, fy2025: 11000, change: 7.8 },
    { metric: 'Net Surplus', fy2024: 600, fy2025: 800, change: 33.3 },
    { metric: 'Debt Outstanding', fy2024: 8500, fy2025: 8200, change: -3.5 },
  ];

  const kpis = useMemo(
    () => [
      { label: 'Total Budget Allocation', value: '$11.8B', change: 4.2, icon: DollarSign },
      { label: 'Tax Revenue Collected', value: '$8.95B', change: 6.1, icon: TrendingUp },
      { label: 'Operating Surplus/Deficit', value: '$800M', change: 33.3, icon: BarChart3 },
      { label: 'Debt Service Ratio', value: '1.48x', change: -2.1, icon: Shield },
      { label: 'Capital Expenditure', value: '$1.9B', change: 8.7, icon: Landmark },
      { label: 'Program Effectiveness', value: '87.3%', change: 1.9, icon: Users },
      { label: 'Cost per Citizen', value: '$342', change: -1.4, icon: Users },
    ],
    []
  );

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
            change={kpi.change}
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
            <BarChart data={activeTab === 'revenue' ? revenueByCategory : spendingDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                tickFormatter={(v: number) => formatCompact(v)}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toLocaleString()}M`, 'Amount']}
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
                data={spendingDistribution}
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
                formatter={(value) => [`$${Number(value).toLocaleString()}M`, 'Amount']}
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
            {spendingDistribution.map((item, i) => (
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
                {departmentBudget.map((dept) => (
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
                      {formatCompact(dept.allocated)}
                    </td>
                    <td
                      className="py-2 text-right font-mono"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {formatCompact(dept.spent)}
                    </td>
                    <td className="py-2 text-right font-mono">
                      <span
                        className={
                          dept.pct >= 95
                            ? 'text-green-600'
                            : dept.pct >= 90
                              ? 'text-yellow-500'
                              : 'text-red-600'
                        }
                      >
                        {dept.pct}%
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
                    FY 2024
                  </th>
                  <th scope="col" className="text-right pb-2 font-medium">
                    FY 2025
                  </th>
                  <th scope="col" className="text-right pb-2 font-medium">
                    YoY Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {fiscalYearComparison.map((row) => (
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
                      ${row.fy2024.toLocaleString()}M
                    </td>
                    <td
                      className="py-2 text-right font-mono"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      ${row.fy2025.toLocaleString()}M
                    </td>
                    <td className="py-2 text-right font-mono">
                      <span className={row.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {row.change >= 0 ? '+' : ''}
                        {row.change}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default GovernmentDashboardPage;
