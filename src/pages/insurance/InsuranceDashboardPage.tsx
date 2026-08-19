import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';

import { Activity, BarChart3, Download, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { useGLStore } from '@/store/glStore';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { formatPercent } from '@/utils/financialFormatting';
import { buildInsuranceDashboardModel } from './insuranceDashboardData';

/**
 * Underwriting dashboard, derived from posted GL entries.
 *
 * Every figure comes from `./insuranceDashboardData` (which wraps
 * `InsuranceEngine`). Figures the ledger cannot support are rendered as `—`
 * and named in the disclosure block rather than filled in — see that module
 * for the list and the reasoning.
 */

/** Percentage-point ratio, or an em dash when the denominator does not exist. */
function ratio(value: number | null): string {
  return value === null ? '—' : formatPercent(value, 2);
}

export default function InsuranceDashboardPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const { entries } = useGLStore();

  useEffect(() => {
    document.title = 'FinPlan Pro — Insurance Dashboard';
  }, []);

  const model = useMemo(() => buildInsuranceDashboardModel(entries), [entries]);

  const columns: Column[] = useMemo(
    () => [
      { key: 'line', header: 'Line of Business', sortable: true },
      {
        key: 'written',
        header: 'Written Premium',
        align: 'right',
        render: (v) => fmt.currency0(Number(v)),
      },
      {
        key: 'earned',
        header: 'Earned Premium',
        align: 'right',
        render: (v) => fmt.currency0(Number(v)),
      },
      {
        key: 'writtenLessEarned',
        header: 'Written − Earned',
        align: 'right',
        render: (v) => fmt.currency0(Number(v)),
      },
    ],
    [fmt]
  );

  const handleExport = () => {
    const { stats, lineRows } = model;
    const rows: (string | number)[][] = [
      ['Gross written premium', stats.grossWrittenPremium],
      ['Ceded premium (43xx)', stats.cededPremium ?? 'not posted'],
      ['Net written premium', stats.netWrittenPremium ?? 'not derivable'],
      ['Earned premium', stats.earnedPremium],
      ['Loss & LAE', stats.lossExpense],
      ['Commission and underwriting expense', stats.expenseTotal],
      ['Loss ratio %', stats.lossRatio ?? 'not derivable'],
      ['Expense ratio %', stats.expenseRatio ?? 'not derivable'],
      ['Combined ratio %', stats.combinedRatio ?? 'not derivable'],
      ['Underwriting income', stats.underwritingIncome],
      ['Policy count', 'not derivable from a general ledger'],
      ...lineRows.map((r): (string | number)[] => [
        `${r.line} — written / earned / difference`,
        r.written,
        r.earned,
        r.writtenLessEarned,
      ]),
    ];
    void ExportEngine.exportToExcel(
      { headers: ['Measure', 'Value'], rows },
      { title: 'Underwriting_Results' }
    ).catch(reportExportFailure);
  };

  if (!model.hasData) {
    return (
      <main className="p-12 text-center max-w-xl mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Shield className="h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />
        </div>
        {/* UI-07: this branch never reaches PageHeader, so the heading here is
            the document's only <h1>. */}
        <h1 className="text-xl font-semibold mb-2">Insurance Dashboard</h1>
        <p className="text-[var(--text-muted)] mb-2">
          No underwriting activity is posted. This page reads the general ledger and shows nothing
          until premium, loss or expense accounts carry entries.
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Expected account prefixes: 41xx written premium, 42xx earned premium, 43xx ceded premium,
          51xx loss and LAE, 52xx commission, 53xx underwriting expense.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  const { stats, trend, premiumByLine, lineRows, periodsCovered, priorPeriod } = model;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Insurance Dashboard"
          purpose="Underwriting performance derived from posted premium, loss and expense accounts."
        />
        <div className="flex items-center gap-3">
          {periodsCovered && (
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              Periods {periodsCovered.first} – {periodsCovered.last}
            </span>
          )}
          <Button variant="outline" size="sm" className="h-10" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Combined Ratio"
          value={ratio(stats.combinedRatio)}
          changeLabel={
            priorPeriod && priorPeriod.combined !== null
              ? `Prior period ${priorPeriod.month}: ${formatPercent(priorPeriod.combined, 2)}`
              : 'No prior period to compare'
          }
          sparklineData={[...model.combinedSparkline]}
        />
        <KPIValue
          label="Gross Written Premium"
          value={fmt.currency0(stats.grossWrittenPremium)}
          changeLabel="Credit-normal total of 41xx accounts"
        />
        <KPIValue
          label="Net Written Premium"
          value={stats.netWrittenPremium === null ? '—' : fmt.currency0(stats.netWrittenPremium)}
          changeLabel={
            stats.netWrittenPremium === null
              ? 'Requires posted reinsurance cessions (43xx)'
              : `Gross less ceded ${fmt.currency0(stats.cededPremium)}`
          }
        />
        <KPIValue
          label="Loss Ratio"
          value={ratio(stats.lossRatio)}
          changeLabel={
            priorPeriod
              ? `Prior period ${priorPeriod.month}: ${formatPercent(priorPeriod.lossRatio, 2)}`
              : 'No prior period to compare'
          }
          sparklineData={[...model.lossRatioSparkline]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <CardTitle>Combined Ratio Decomposition</CardTitle>
            </div>
            <CardDescription>
              Loss ratio plus expense ratio, by posting period. A period appears only where earned
              premium exists to divide by.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-8">
                No period carries both premium and loss postings, so there is no ratio series to
                plot.
              </p>
            ) : (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...trend]}>
                    <defs>
                      <linearGradient id="colorCombined" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${String(v)}%`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      formatter={(v) => formatPercent(Number(v), 2)}
                    />
                    <Legend verticalAlign="top" align="right" />
                    <Area
                      type="monotone"
                      dataKey="combined"
                      name="Combined Ratio"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCombined)"
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="lossRatio"
                      name="Loss Ratio"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="transparent"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenseRatio"
                      name="Expense Ratio"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="transparent"
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              <CardTitle>Premium by Line</CardTitle>
            </div>
            <CardDescription>Written vs. earned premium</CardDescription>
          </CardHeader>
          <CardContent>
            {premiumByLine.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-8">
                No premium account carries a recognised line suffix (41xx/42xx ending 01–05), so
                premium cannot be split by line.
              </p>
            ) : (
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...premiumByLine]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600 }}
                      width={90}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      formatter={(v) => fmt.compact(Number(v))}
                    />
                    <Legend />
                    <Bar
                      dataKey="written"
                      name="Written Premium"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                    <Bar
                      dataKey="earned"
                      name="Earned Premium"
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Underwriting Results by Line</CardTitle>
          <CardDescription>
            Premium written and earned per line of business, from the last two digits of the 41xx
            and 42xx account codes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={[...lineRows]}
            caption="Underwriting results by line of business"
            ariaLabel="Underwriting results table"
            emptyMessage="No premium account carries a recognised line suffix."
          />
        </CardContent>
      </Card>

      <section
        aria-labelledby="insurance-not-derivable"
        className="text-xs text-[var(--text-muted)] space-y-1"
      >
        <h2 id="insurance-not-derivable" className="font-semibold">
          Not derivable from this ledger
        </h2>
        <p>
          Policy count — a general ledger records amounts, not contracts. Loss and combined ratios
          per line of business — loss and expense accounts (51xx–53xx) carry no line dimension, so
          splitting them across lines would require an allocation nobody has posted. Net written
          premium — shown only when reinsurance cessions are posted to 43xx.
        </p>
      </section>
    </div>
  );
}
