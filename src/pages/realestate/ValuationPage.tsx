import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, BarChart3, Calculator, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
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
import type { FiscalPeriod } from '@/types';
import { useGLStore } from '@/store/glStore';
import { deriveValuation, type PropertyValuationRow } from '@/pages/realestate/valuationData';
import { formatPercent } from '@/utils/financialFormatting';

const fiscalPeriods: FiscalPeriod[] = buildFiscalPeriods();

export default function ValuationPage() {
  const fmtCurrency = useCurrencyFormatter();

  const valuationColumns = useMemo<Column[]>(
    () => [
      { key: 'name', header: 'Property', sortable: true },
      {
        key: 'costBasis',
        header: 'Cost Basis',
        align: 'right',
        render: (v) => fmtCurrency.custom({ maxDecimals: 0 })(v as number),
      },
      {
        key: 'appraisedValue',
        header: 'Appraised Value',
        align: 'right',
        render: (v) => fmtCurrency.custom({ maxDecimals: 0 })(v as number),
      },
      {
        key: 'unrealizedGain',
        header: 'Unrealized Gain',
        align: 'right',
        render: (v) => {
          const num = v as number;
          return (
            <span
              className={num >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}
            >
              {fmtCurrency.custom({ maxDecimals: 0, signDisplay: 'always' })(num)}
            </span>
          );
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
      {
        key: 'capRatePercent',
        header: 'Cap Rate (own NOI)',
        align: 'right',
        render: (v) => formatPercent(v as number | null, 2),
      },
    ],
    [fmtCurrency]
  );
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  // Every figure comes from `@/pages/realestate/valuationData` — see its
  // correctness contract. RealEstateEngine is deliberately NOT called here:
  // its breakdown carries a mocked 6.2 yield, a 'TBD' location and a
  // Core/Value-Add status decided by a $10M cost threshold, and its dashboard
  // cap rate is a portfolio figure that was being stamped onto every row.
  const valuation = useMemo(() => deriveValuation(entries), [entries]);

  const valuationTrend = useMemo(
    () =>
      (valuation?.properties ?? []).map((p) => ({
        property: p.name,
        cost: p.costBasis,
        market: p.appraisedValue,
        gain: p.unrealizedGain,
      })),
    [valuation]
  );

  if (!valuation) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Calculator className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Valuation Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import general-ledger activity that posts property cost (15xx) or appraised value (16xx)
          by entity to see valuations and appreciation.
        </p>
        <Button>Import Data</Button>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500"
      role="main"
      aria-label="Property Valuation page"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Property Valuation"
          purpose="Fair value assessment, appraisal tracking, and appreciation analysis across your portfolio."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
          <Button variant="outline" size="sm" aria-label="Valuation report">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Valuation Report
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Appraised Value"
          value={fmtCurrency.custom({ maxDecimals: 1, compact: true })(
            valuation.totalAppraisedValue
          )}
          changeLabel="posted 16xx balances"
        />
        <KPIValue
          label="Total Unrealized Gain"
          value={fmtCurrency.custom({ maxDecimals: 1, compact: true, signDisplay: 'always' })(
            valuation.totalUnrealizedGain
          )}
          changeLabel="appraised less cost basis"
        />
        <KPIValue
          label="Portfolio Appreciation"
          value={formatPercent(valuation.portfolioAppreciationPercent, 1)}
          changeLabel="gain ÷ cost basis"
        />
        <KPIValue
          label="Weighted Cap Rate"
          value={formatPercent(valuation.weightedCapRatePercent, 2)}
          changeLabel={
            valuation.capRateCoverage > 0
              ? `${valuation.capRateCoverage} of ${valuation.properties.length} properties`
              : 'no property posts rental income'
          }
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Cost Basis vs. Appraised Value</CardTitle>
            </div>
            <CardDescription>Book value and fair value comparison by property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valuationTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="property"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000000}M`}
                  />
                  <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="cost" name="Cost Basis" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="market"
                    name="Appraised Value"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-700" />
              <CardTitle>Valuation Summary</CardTitle>
            </div>
            <CardDescription>Portfolio-level valuation metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="space-y-1">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Total Cost Basis
              </div>
              <div className="text-xl font-bold">
                {fmtCurrency.custom({ maxDecimals: 0 })(valuation.totalCostBasis)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Total Appraised Value
              </div>
              <div className="text-xl font-bold text-blue-600">
                {fmtCurrency.custom({ maxDecimals: 0 })(valuation.totalAppraisedValue)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Net Unrealized Gain
              </div>
              <div
                className={`text-xl font-bold ${valuation.totalUnrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {fmtCurrency.custom({ maxDecimals: 0, signDisplay: 'always' })(
                  valuation.totalUnrealizedGain
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Loan-to-Value Ratio
              </div>
              <div className="text-xl font-bold">
                {formatPercent(valuation.loanToValuePercent, 1)}
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-1">
                NOI
              </div>
              <div className="text-lg font-bold text-blue-800">
                {valuation.totalNoi === null
                  ? '—'
                  : fmtCurrency.custom({ maxDecimals: 0 })(valuation.totalNoi)}
              </div>
              <p className="text-[10px] text-blue-600 mt-1">
                Posted rental income (40xx) less property operating expense (50xx). Each
                property&apos;s cap rate uses its own NOI, never the portfolio figure.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Valuation Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-indigo-500" />
            <div>
              <CardTitle>Property Valuation Detail</CardTitle>
              <CardDescription>
                Per-property cost basis, appraised value, and unrealized gains
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={valuationColumns}
            data={valuation.properties as PropertyValuationRow[]}
            caption="Property valuation detail table"
            ariaLabel="Property valuation detail data table for real estate valuation"
          />
        </CardContent>
      </Card>

      {valuation.unavailable.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Not derivable from the general ledger</CardTitle>
          </CardHeader>
          <CardContent>
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
      )}
    </div>
  );
}
