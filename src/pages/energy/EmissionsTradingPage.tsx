import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react';
import { ShieldCheck, AlertTriangle, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { useEnergyStore } from '@/store/energyStore';
import { roundTo, sumMoney } from '@/utils/money';
import { useGLStore } from '@/store/glStore';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

const fiscalPeriods: FiscalPeriod[] = buildFiscalPeriods();

interface AllowanceHolding {
  id: string;
  type: string;
  vintage: string;
  quantity: number;
  costBasis: number | null;
  marketValue: number | null;
  gainPct: number | null;
}

/**
 * Emissions Trading (session 028, replaces fabricated session-022 version).
 *
 * Pre-session-028 page rendered a fictional allowance inventory with hand-typed
 * quantities, prices and gain percentages for every tenant. The pre-existing
 * `useEnergyStore` carries renewable generation only; there is no allowance
 * position store, no spot/forward market feed, and no regulatory cap record.
 * Cost basis, market value and unrealised gain are not derivable from a
 * general ledger alone — they require a recorded allowance ledger and a
 * stated market price.
 *
 * The page therefore:
 *   1. Surfaces real energy-store generation totals where they exist;
 *   2. Empty-states the allowance table when no allowance ledger is recorded;
 *   3. Discloses compliance and verification status as not derivable.
 *
 * No hand-typed KPI literals remain.
 */
export default function EmissionsTradingPage() {
  const [periodId, setPeriodId] = useState('P01');
  const { generationTrend, assets } = useEnergyStore();
  const { entries } = useGLStore();
  const fmtCurrency = useCurrencyFormatter();

  // Real metric: total generation from the energy store, summed over the
  // recorded window. Generation is in MWh (a unit, not a money field), so
  // IEEE-754 sum is acceptable; we still use roundTo for display.
  const totalGeneration = useMemo(
    () => roundTo(sumMoney(generationTrend.map((g) => g.total)), 2),
    [generationTrend]
  );
  const latestMonth = generationTrend.at(-1);
  const assetCount = assets.length;

  // Allowance ledger does not exist in the current data model. The table
  // renders an empty state that explains what would be required.
  const allowanceHoldings: AllowanceHolding[] = [];

  const kpi1 = assetCount > 0 ? formatNumber(assetCount) : '—';
  const kpi2 = totalGeneration > 0 ? `${formatNumber(totalGeneration, 1)} MWh` : '—';
  const kpi3 = latestMonth ? formatNumber(latestMonth.total, 1) : '—';
  const kpi4 = entries.length > 0 ? formatNumber(entries.length) : '—';

  const columns: Column[] = [
    { key: 'type', header: 'Credit Type', sortable: true },
    { key: 'vintage', header: 'Vintage', align: 'center' },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (v) => (v == null ? '—' : formatNumber(v as number)),
    },
    {
      key: 'costBasis',
      header: 'Cost Basis',
      align: 'right',
      render: (v) => (v == null ? '—' : fmtCurrency.currency(v as number)),
    },
    {
      key: 'marketValue',
      header: 'Market Value',
      align: 'right',
      render: (v) => (v == null ? '—' : fmtCurrency.currency(v as number)),
    },
    {
      key: 'gainPct',
      header: 'Unrealised Gain/Loss',
      align: 'right',
      render: (v) => (v == null ? '—' : `${formatNumber(v as number, 1)}%`),
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Emissions Trading"
          purpose="Carbon allowance management, credit portfolio valuation, and net-zero compliance tracking."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export for Audit
          </Button>
        </div>
      </div>

      {/* KPIs — all derived from the real energy store / GL */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Recorded Assets"
          value={kpi1}
          changeLabel={assetCount > 0 ? `${assetCount} facilities on file` : 'no assets recorded'}
        />
        <KPIValue
          label="Total Generation (window)"
          value={kpi2}
          changeLabel={
            generationTrend.length > 0
              ? `${generationTrend.length} periods on file`
              : 'no generation on file'
          }
        />
        <KPIValue
          label="Latest Period Generation"
          value={kpi3}
          changeLabel={latestMonth ? `as of ${latestMonth.date}` : 'no periods on file'}
        />
        <KPIValue
          label="GL Entries"
          value={kpi4}
          changeLabel={entries.length > 0 ? 'ledger imported' : 'no GL imported'}
        />
      </div>

      {/* Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Generation Trend (Real)</CardTitle>
              <CardDescription>
                {generationTrend.length > 0
                  ? 'Recorded renewable generation by month'
                  : 'No generation on file yet'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              {generationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generationTrend}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total MWh"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>Jurisdictional requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-[var(--text-muted)] space-y-2">
              <p>
                <span className="font-medium text-[var(--text-primary)]">
                  EU ETS, California Cap-and-Trade, UK ETS
                </span>{' '}
                — compliance status, verification IDs and offset percentages are not derivable from
                a generation store or general ledger. Connect an allowance-position feed to populate
                this card.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="text-xs font-bold text-amber-700 uppercase">Not Connected</div>
                  <div className="text-[10px] font-mono text-amber-600">
                    Allowance ledger and price feed required
                  </div>
                </div>
                <ShieldCheck className="ml-auto h-4 w-4 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Carbon Credit Inventory</CardTitle>
            <CardDescription>
              {allowanceHoldings.length > 0
                ? 'Detailed list of held allowances and offset instruments'
                : 'No allowance positions recorded'}
            </CardDescription>
          </div>
          <Button variant="default" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export for Audit
          </Button>
        </CardHeader>
        <CardContent>
          {allowanceHoldings.length > 0 ? (
            <DataTable
              columns={columns}
              data={allowanceHoldings}
              caption="Emissions credit inventory holdings"
              ariaLabel="Emissions credit inventory table"
            />
          ) : (
            <div className="text-center py-8 text-sm text-[var(--text-muted)]">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)]" />
              <p>No carbon allowance positions are recorded in this workspace.</p>
              <p>
                Cost basis, market value and unrealised gain require a recorded allowance ledger and
                a stated market price — neither exists yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
      <div className="text-center">
        <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)]" />
        <p>No generation trend recorded yet.</p>
        <p>Record renewable assets to populate this chart.</p>
      </div>
    </div>
  );
}

function formatNumber(n: number, dp = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(n);
}
