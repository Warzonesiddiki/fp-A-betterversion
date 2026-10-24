// W-FAB (fleet wave 2, lane N4) remediation: the previous version typed
// fabricated deltas onto its KPI tiles (`change={2} acquisitions in Q1`,
// `change={15.4} since inception`, `change={-2.1} deleveraging on track`),
// drew sparklines whose only real point was today's value, surfaced engine
// mocks as facts (avgHoldingPeriod 4.2 "Mocked", yield 6.2 "Mocked",
// location 'TBD', Core/Value-Add status decided by a $10M threshold),
// hard-coded a 65/25/10 strategy mix, and printed an invented renovation
// record ("Metro Plaza … 42% complete … $1.2M of $2.8M"). None of that is a
// ledger fact. Every figure below is classified from posted GL accounts via
// `deriveValuation`; what the ledger cannot support is disclosed, shown as
// "—", or omitted.

import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useMemo, useState } from 'react';
import { Building2, BarChart3, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
import type { PropertyValuationRow } from '@/pages/realestate/valuationData';
import { deriveValuation } from '@/pages/realestate/valuationData';
import { useGLStore } from '@/store/glStore';
import { formatPercent } from '@/utils/financialFormatting';

// Real periods from the fiscal-calendar engine (the variable was previously,
// misleadingly, named `mockPeriods`; the data was never mock data).
const fiscalPeriods = buildFiscalPeriods();

export default function PropertyPortfolioPage() {
  const fmtCurrency = useCurrencyFormatter();
  const [query, setQuery] = useState('');
  const [periodId, setPeriodId] = useState('P01');

  const columns = useMemo<Column[]>(
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
        render: (v) => {
          const num = v as number | null;
          if (num === null) return <span className="text-[var(--text-muted)]">—</span>;
          return formatPercent(num, 2);
        },
      },
    ],
    [fmtCurrency]
  );
  const { entries } = useGLStore();

  // Single source of truth: the remediated valuation derivation (per-property
  // cost 15xx / appraised value 16xx / own NOI 40xx−50xx / debt 25xx).
  const valuation = useMemo(() => deriveValuation(entries), [entries]);

  const filteredRows = useMemo<readonly PropertyValuationRow[]>(() => {
    const rows = valuation?.properties ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.id} ${r.name}`.toLowerCase().includes(q));
  }, [query, valuation]);

  const chartRows = useMemo(
    () =>
      filteredRows.map((p) => ({
        property: p.name,
        cost: p.costBasis,
        market: p.appraisedValue,
      })),
    [filteredRows]
  );

  if (entries.length === 0 || !valuation) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Building2 className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Portfolio Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger activity that posts property cost (15xx) or appraised value (16xx)
          by entity to analyze your portfolio. Occupancy, holding periods and renovation status need
          systems the ledger does not replace.
        </p>
        <Button>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Property Portfolio"
          purpose="Asset inventory from the posted ledger: acquisition basis (15xx), appraised value (16xx), and unrealized gain by entity."
        />
        <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Properties (posting entities)"
          value={valuation.properties.length.toString()}
          changeLabel="entities with posted 15xx/16xx balances"
        />
        <KPIValue
          label="Portfolio Cost Basis"
          value={fmtCurrency.custom({ maxDecimals: 1, compact: true })(valuation.totalCostBasis)}
          changeLabel="posted 15xx balances"
        />
        <KPIValue
          label="Unrealized Gain"
          value={fmtCurrency.custom({
            maxDecimals: 1,
            compact: true,
            signDisplay: 'always',
          })(valuation.totalUnrealizedGain)}
          changeLabel="appraised less cost basis"
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

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Cost Basis vs. Appraised Value</CardTitle>
            </div>
            <CardDescription>Posted book and appraisal balances by property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows}>
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
            <CardTitle>Data Lineage</CardTitle>
            <CardDescription>What the ledger supports — and what it does not</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Weighted cap rate</span>
              <span className="font-mono">
                {valuation.weightedCapRatePercent === null
                  ? '—'
                  : formatPercent(valuation.weightedCapRatePercent, 2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Net operating income</span>
              <span className="font-mono">
                {valuation.totalNoi === null
                  ? '—'
                  : fmtCurrency.custom({ maxDecimals: 0 })(valuation.totalNoi)}
              </span>
            </div>
            <ul className="space-y-2 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
              {valuation.unavailable.map((u) => (
                <li key={u.label}>
                  <span className="font-semibold text-[var(--text-secondary)]">{u.label}</span> —{' '}
                  {u.reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Asset Inventory</CardTitle>
            <CardDescription>
              Per-property posted balances. Cap-rate blanks mean the property posts no rental income
              — never the portfolio figure.
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--text-muted)]" />
            <Input
              className="pl-7 h-9 w-64"
              placeholder="Search by property…"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              aria-label="Search properties"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredRows as PropertyValuationRow[]}
            caption="Property portfolio inventory details"
            ariaLabel="Property portfolio inventory table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
