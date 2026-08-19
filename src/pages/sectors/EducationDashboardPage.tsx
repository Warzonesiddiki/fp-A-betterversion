import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
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
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useEducationStore } from '@/store/educationStore';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import {
  deriveEducationDashboard,
  type AccountAmountRow,
} from '@/pages/sectors/educationDashboardData';

/**
 * Education sector dashboard.
 *
 * Every figure comes from `@/pages/sectors/educationDashboardData`, which
 * derives it from the posted ledger, posted budget line items and enrolment
 * the user has actually recorded. See that module's correctness contract: this
 * page used to read nothing at all and rendered a fictional university
 * ($485.0M tuition, $18,240 per student, 38,700 students, a six-slice expense
 * pie and a six-row budget table) identically for every tenant.
 */

const COLORS = [
  'var(--accent-primary)',
  'var(--accent-secondary)',
  '#10b981',
  '#f59e0b',
  '#6366f1',
  '#ec4899',
];

const tooltipStyle = { borderRadius: '8px', border: '1px solid var(--border-color)' };
const axisProps = { axisLine: false as const, tickLine: false as const, tick: { fontSize: 12 } };

export function EducationDashboardPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const lineItems = useBudgetStore((s) => s.lineItems);
  const enrollmentTrends = useEducationStore((s) => s.enrollmentTrends);

  useEffect(() => {
    document.title = 'FinPlan Pro — Education Dashboard';
  }, []);

  const data = useMemo(
    () => deriveEducationDashboard(entries, lineItems, enrollmentTrends),
    [entries, lineItems, enrollmentTrends]
  );

  if (!data) {
    return (
      <main
        className="p-12 text-center max-w-md mx-auto"
        role="main"
        aria-label="Education Sector Dashboard"
      >
        <GraduationCap className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">No Education Data</h1>
        <p className="text-[var(--text-muted)]">
          Import general-ledger activity for your institution to see revenue by source, expense
          distribution and budget variance.
        </p>
      </main>
    );
  }

  return (
    <main
      className="p-6 space-y-6 animate-in fade-in duration-500"
      role="main"
      aria-label="Education Sector Dashboard"
    >
      <PageHeader
        title="Education Dashboard"
        purpose={'University FP&A — posted revenue, cost and budget variance'}
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIValue label="Posted Revenue" value={fmt.currency0(data.totalRevenue)} />
        <KPIValue label="Posted Expense" value={fmt.currency0(data.totalExpense)} />
        <KPIValue label="Net Result" value={fmt.currency0(data.netResult)} />
        <KPIValue
          label="Cost per Student"
          value={data.costPerStudent === null ? '\u2014' : fmt.currency0(data.costPerStudent)}
          changeLabel={
            data.latestEnrollment === null
              ? 'enrolment not recorded'
              : `${data.latestEnrollment.toLocaleString()} enrolled`
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Revenue by Account" height={300} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...data.revenueBySource]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="accountName" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `$${formatCompact(v)}`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [fmt.currency0(Number(v)), 'Revenue']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                {data.revenueBySource.map((_, i) => (
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
                data={[...data.expenseDistribution]}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                onMouseEnter={(_, i) => setActiveIdx(i)}
                stroke="none"
              >
                {data.expenseDistribution.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={i === activeIdx ? 1 : 0.7}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [fmt.currency0(Number(v)), 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {data.expenseDistribution.map((item: AccountAmountRow, i) => (
              <div key={item.accountCode} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="font-medium">{item.accountName}</span>
                </div>
                <span className="text-[var(--text-secondary)]">
                  {formatPercent(item.sharePercent, 1)}
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
              <GraduationCap className="h-5 w-5 text-[var(--text-accent)]" />
              <CardTitle>Enrollment Trends</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.enrollment.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No enrolment has been recorded. Student headcount is not a general-ledger fact, so
                this workspace will not estimate it.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Education sector metrics">
                  <caption className="sr-only">Recorded enrolment by semester</caption>
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
                    {data.enrollment.map((r) => (
                      <tr
                        key={r.semester}
                        className="border-b border-[var(--border-color)] last:border-0"
                      >
                        <td className="py-2 font-medium">{r.semester}</td>
                        <td className="py-2 text-right font-mono">
                          {r.undergraduate.toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-mono">{r.graduate.toLocaleString()}</td>
                        <td className="py-2 text-right font-mono font-semibold">
                          {r.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--text-info)]" />
              <CardTitle>Budget vs Actual</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.budgetVsActual.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No budget line item matches a posted account. Load a budget to see variance.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Budget versus posted actuals by account</caption>
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th
                        scope="col"
                        className="text-left py-2 text-[var(--text-secondary)] font-medium"
                      >
                        Account
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
                    {data.budgetVsActual.map((r) => (
                      <tr
                        key={r.accountCode}
                        className="border-b border-[var(--border-color)] last:border-0"
                      >
                        <td className="py-2 font-medium">{r.accountName}</td>
                        <td className="py-2 text-right font-mono">{fmt.currency0(r.budget)}</td>
                        <td className="py-2 text-right font-mono">{fmt.currency0(r.actual)}</td>
                        <td
                          className={`py-2 text-right font-mono font-semibold ${
                            r.favorable ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatPercent(r.variancePercent, 1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

export default EducationDashboardPage;
