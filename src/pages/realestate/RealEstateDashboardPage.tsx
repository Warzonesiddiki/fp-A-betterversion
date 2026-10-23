// W-FAB (fleet wave 2, lane N4) remediation: the previous version rendered
// the engine's mocked 94.8% occupancy as a measured KPI (with a fabricated
// "+1.2% leasable area stable" change and a hand-typed sparkline), typed
// invented deltas onto every other tile ("+8.4% valuation update Q1",
// "+12.1% OpEx reduction 5%", "−0.2% compression in prime"), drew a six-month
// occupancy trend chart for three asset classes that exist nowhere in the GL,
// filled an asset-allocation pie with `20000000/(i+1)` placeholder weights
// under five asset classes the ledger cannot express, printed a fictional
// geographic split (42/31/18/9), and showed a table whose NOI column read an
// undefined field and whose occupancy/yield columns fell back to the engine's
// mocked constants. Every figure now comes from posted accounts via
// `deriveValuation`; anything else is disclosed as not derivable.

import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useMemo, useState } from 'react';
import { Building2, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { deriveValuation, type PropertyValuationRow } from '@/pages/realestate/valuationData';
import { useGLStore } from '@/store/glStore';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';

// Real periods from the fiscal-calendar engine (previously misnamed
// `mockPeriods`; the data was never mock data).
const fiscalPeriods = buildFiscalPeriods();

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];

export default function RealEstateDashboardPage() {
  const fmtCurrency = useCurrencyFormatter();
  const [periodId, setPeriodId] = useState('P01');

  const { entries } = useGLStore();

  // Single source of truth: the remediated valuation derivation.
  const valuation = useMemo(() => deriveValuation(entries), [entries]);

  /** Real fair-value allocation: one slice per posting entity. */
  const allocationData = useMemo(
    () =>
      (valuation?.properties ?? [])
        .slice()
        .sort((a, b) => b.appraisedValue - a.appraisedValue)
        .map((p) => ({ name: p.name, value: p.appraisedValue })),
    [valuation]
  );

  const topRows = useMemo<readonly PropertyValuationRow[]>(
    () => (valuation?.properties ?? []).slice().sort((a, b) => b.appraisedValue - a.appraisedValue),
    [valuation]
  );

  const columns = useMemo<Column[]>(
    () => [
      { key: 'name', header: 'Property', sortable: true },
      {
        key: 'appraisedValue',
        header: 'Appraised Value',
        align: 'right',
        render: (v) => fmtCurrency.custom({ maxDecimals: 0 })(v as number),
      },
      {
        key: 'noi',
        header: 'NOI',
        align: 'right',
        render: (v) => {
          const num = v as number | null;
          if (num === null) return <span className="text-[var(--text-muted)]">—</span>;
          return fmtCurrency.custom({ maxDecimals: 0 })(num);
        },
      },
      {
        key: 'capRatePercent',
        header: 'Cap Rate (own NOI)',
        align: 'right',
        render: (v) => {
          const num = v as number | null;
          if (num === null) return <span className="text-[var(--text-muted)]">—</span>;
          return formatPercent(num, 2);
        },
      },
      {
        key: 'appreciationPercent',
        header: 'Appreciation %',
        align: 'right',
        render: (v) => {
          const num = v as number | null;
          if (num === null) return <span className="text-[var(--text-muted)]">—</span>;
          return (
            <span className={num >= 0 ? 'text-green-600' : 'text-red-600'}>
              {num >= 0 ? '+' : ''}
              {formatPercent(num, 1)}
            </span>
          );
        },
      },
    ],
    [fmtCurrency]
  );

  if (entries.length === 0 || !valuation) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Building2 className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Real Estate Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger activity that posts property cost (15xx) or appraised value (16xx)
          by entity to view portfolio analytics. Occupancy and asset-class mix are not ledger facts
          and are never estimated here.
        </p>
        <Button>Import Data</Button>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 animate-in fade-in duration-500"
      role="main"
      aria-label="Real Estate Dashboard"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Real Estate Dashboard"
          purpose="Portfolio analytics classified from your posted ledger: appraised value (16xx), rental income (40xx), operating expense (50xx) and debt (25xx). Occupancy, asset class and location are not ledger facts — they are disclosed, not estimated."
        />
        <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Portfolio Fair Value"
          value={fmtCurrency.custom({ maxDecimals: 1, compact: true })(
            valuation.totalAppraisedValue
          )}
          changeLabel="posted 16xx balances"
        />
        <KPIValue
          label="Net Operating Income"
          value={
            valuation.totalNoi === null
              ? '—'
              : fmtCurrency.custom({ maxDecimals: 1, compact: true })(valuation.totalNoi)
          }
          changeLabel={
            valuation.totalNoi === null
              ? 'no rental income (40xx) or property opex (50xx) posted'
              : 'rental income less property opex'
          }
        />
        <KPIValue
          label="Weighted Cap Rate"
          value={
            valuation.weightedCapRatePercent === null
              ? '—'
              : formatPercent(valuation.weightedCapRatePercent, 2)
          }
          changeLabel={
            valuation.capRateCoverage > 0
              ? `${valuation.capRateCoverage} of ${valuation.properties.length} properties`
              : 'no property posts both income and value'
          }
        />
        <KPIValue
          label="Loan-to-Value"
          value={
            valuation.loanToValuePercent === null
              ? '—'
              : formatPercent(valuation.loanToValuePercent, 1)
          }
          changeLabel={
            valuation.loanToValuePercent === null
              ? 'no real-estate debt (25xx) posted'
              : 'posted debt ÷ appraised value'
          }
        />
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-indigo-500" />
              <CardTitle>Fair Value Allocation</CardTitle>
            </div>
            <CardDescription>By posting entity (USD) — one slice per property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `$${formatCompact(Number(v))}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-[var(--text-muted)]">
              Asset-class (office/retail/…) and geographic breakdowns need property metadata the
              general ledger does not carry, so no such split is shown.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle>Not Derivable from the Ledger</CardTitle>
            </div>
            <CardDescription>Omitted rather than estimated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <ul className="space-y-2 text-sm">
              {valuation.unavailable.map((u) => (
                <li key={u.label}>
                  <span className="font-semibold">{u.label}</span>
                  <span className="text-[var(--text-muted)]"> — {u.reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Asset Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assets by Appraised Value</CardTitle>
          <CardDescription>
            Per-property posted balances. Blank NOI/cap-rate cells mean the property posts no rental
            income (40xx).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={topRows as PropertyValuationRow[]}
            caption="Assets by appraised value table"
            ariaLabel="Real estate dashboard assets data table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
