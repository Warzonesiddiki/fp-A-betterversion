/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, TrendingUp } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartCard } from '@/components/ui/ChartCard';
import { KPIValue } from '@/components/ui/KPIValue';
import { useEducationStore } from '@/store/educationStore';

const COLORS = [
  'var(--accent-primary)',
  'var(--accent-secondary)',
  '#10b981',
  '#f59e0b',
  '#6366f1',
  '#ec4899',
];
const revenueBySource = [
  { source: 'Tuition', value: 485_000_000 },
  { source: 'Grants', value: 128_000_000 },
  { source: 'Research', value: 95_000_000 },
  { source: 'Donations', value: 72_000_000 },
  { source: 'Other', value: 34_000_000 },
];
const expenseDistribution = [
  { name: 'Faculty', value: 312_000_000 },
  { name: 'Admin', value: 145_000_000 },
  { name: 'Facilities', value: 98_000_000 },
  { name: 'Research', value: 87_000_000 },
  { name: 'Student Services', value: 62_000_000 },
  { name: 'Other', value: 41_000_000 },
];
const enrollmentTrends = [
  { semester: 'Fall 2023', undergrad: 28_400, graduate: 7_200, total: 35_600 },
  { semester: 'Spring 2024', undergrad: 27_800, graduate: 7_400, total: 35_200 },
  { semester: 'Fall 2024', undergrad: 29_100, graduate: 7_800, total: 36_900 },
  { semester: 'Spring 2025', undergrad: 28_600, graduate: 8_100, total: 36_700 },
  { semester: 'Fall 2025', undergrad: 30_200, graduate: 8_500, total: 38_700 },
];
const budgetVsActual = [
  { category: 'Tuition Revenue', budget: 470_000_000, actual: 485_000_000 },
  { category: 'Research Grants', budget: 120_000_000, actual: 128_000_000 },
  { category: 'Faculty Salaries', budget: 300_000_000, actual: 312_000_000 },
  { category: 'Facilities Ops', budget: 95_000_000, actual: 98_000_000 },
  { category: 'Financial Aid', budget: 110_000_000, actual: 105_000_000 },
  { category: 'Capital Projects', budget: 85_000_000, actual: 79_000_000 },
];
const totalExpense = expenseDistribution.reduce((s, e) => s + e.value, 0);

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

const tooltipStyle = { borderRadius: '8px', border: '1px solid var(--border-color)' };
const axisProps = { axisLine: false as const, tickLine: false as const, tick: { fontSize: 12 } };

export function EducationDashboardPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    document.title = 'FinPlan Pro — Education Dashboard';
  }, []);

  const kpis = useMemo(
    () => [
      { label: 'Total Enrollment', value: '38,700', change: 4.9 },
      { label: 'Tuition Revenue', value: '$485.0M', change: 3.2 },
      { label: 'Operating Cost / Student', value: '$18,240', change: -1.8 },
      { label: 'Financial Aid Disbursed', value: '$105.0M', change: -4.5 },
      { label: 'Research Funding', value: '$95.0M', change: 7.3 },
      { label: 'Endowment Utilization', value: '4.8%', change: 0.3 },
      { label: 'Student-Faculty Ratio', value: '15:1', change: 0 },
    ],
    []
  );

  return (
    <main
      className="p-6 space-y-6 animate-in fade-in duration-500"
      role="main"
      aria-label="Education Sector Dashboard"
    >
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
          Education Dashboard
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          University FP&A — enrollment, revenue, and cost analytics
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.slice(0, 4).map((k) => (
          <KPIValue
            key={k.label}
            label={k.label}
            value={k.value}
            change={k.change}
            trend={k.change > 0 ? 'up' : k.change < 0 ? 'down' : 'neutral'}
          />
        ))}
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.slice(4).map((k) => (
          <KPIValue
            key={k.label}
            label={k.label}
            value={k.value}
            change={k.change}
            trend={k.change > 0 ? 'up' : k.change < 0 ? 'down' : 'neutral'}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Revenue by Source" height={300} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueBySource}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="source" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={((v: number) => [fmt(v), 'Revenue']) as any}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                {revenueBySource.map((_, i) => (
                  <Cell key={`bar-${i}`} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expense Distribution" height={250}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                onMouseEnter={(_, i) => setActiveIdx(i)}
                stroke="none"
              >
                {expenseDistribution.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={i === activeIdx ? 1 : 0.7}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={((v: number) => [fmt(v), 'Amount']) as any}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {expenseDistribution.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-[var(--text-secondary)]">
                  {((item.value / totalExpense) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[var(--accent-primary)]" />
              <CardTitle>Enrollment Trends</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Education sector metrics">
                <caption className="sr-only">Detailed education sector metrics</caption>
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th
                      scope="col"
                      className="text-left py-2 text-[var(--text-secondary)] font-medium"
                    >
                      Semester
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 text-[var(--text-secondary)] font-medium"
                    >
                      Undergrad
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 text-[var(--text-secondary)] font-medium"
                    >
                      Graduate
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 text-[var(--text-secondary)] font-medium"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enrollmentTrends.map((r) => (
                    <tr
                      key={r.semester}
                      className="border-b border-[var(--border-color)] last:border-0"
                    >
                      <td className="py-2 font-medium">{r.semester}</td>
                      <td className="py-2 text-right font-mono">{r.undergrad.toLocaleString()}</td>
                      <td className="py-2 text-right font-mono">{r.graduate.toLocaleString()}</td>
                      <td className="py-2 text-right font-mono font-semibold">
                        {r.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--accent-secondary)]" />
              <CardTitle>Budget vs Actual</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th
                      scope="col"
                      className="text-left py-2 text-[var(--text-secondary)] font-medium"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 text-[var(--text-secondary)] font-medium"
                    >
                      Budget
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 text-[var(--text-secondary)] font-medium"
                    >
                      Actual
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 text-[var(--text-secondary)] font-medium"
                    >
                      Variance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {budgetVsActual.map((r) => {
                    const v = r.actual - r.budget;
                    const pct = ((v / r.budget) * 100).toFixed(1);
                    const fav =
                      r.category.includes('Revenue') || r.category.includes('Grants')
                        ? v > 0
                        : v < 0;
                    return (
                      <tr
                        key={r.category}
                        className="border-b border-[var(--border-color)] last:border-0"
                      >
                        <td className="py-2 font-medium">{r.category}</td>
                        <td className="py-2 text-right font-mono">{fmt(r.budget)}</td>
                        <td className="py-2 text-right font-mono">{fmt(r.actual)}</td>
                        <td
                          className={`py-2 text-right font-mono font-semibold ${fav ? 'text-green-500' : 'text-red-600'}`}
                        >
                          {v > 0 ? '+' : ''}
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
