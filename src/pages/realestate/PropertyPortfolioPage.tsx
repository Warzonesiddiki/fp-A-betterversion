import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useMemo, useState } from 'react';
import { Building2, BarChart3, Filter, Hammer, Search } from 'lucide-react';
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
import type { FiscalPeriod } from '@/types';
import { useGLStore } from '@/store/glStore';
import { RealEstateEngine } from '@/engines/RealEstateEngine';
import { formatPercent } from '@/utils/financialFormatting';

// Mock Data for UI structure
const mockPeriods: FiscalPeriod[] = buildFiscalPeriods();

export default function PropertyPortfolioPage() {
  const fmtCurrency = useCurrencyFormatter();

  const columns = useMemo<Column[]>(
    () => [
      { key: 'name', header: 'Property', sortable: true },
      { key: 'location', header: 'Location' },
      {
        key: 'status',
        header: 'Strategy',
        render: (v) => (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              String(v) === 'Core'
                ? 'bg-blue-100 text-blue-700'
                : String(v) === 'Value-Add'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-purple-100 text-purple-700'
            }`}
          >
            {String(v)}
          </span>
        ),
      },
      {
        key: 'purchasePrice',
        header: 'Cost Basis',
        align: 'right',
        render: (v) => fmtCurrency.custom({ maxDecimals: 0 })(v as number),
      },
      {
        key: 'currentVal',
        header: 'Current Value',
        align: 'right',
        render: (v) => fmtCurrency.custom({ maxDecimals: 0 })(v as number),
      },
      {
        key: 'yield',
        header: 'Yield',
        align: 'right',
        render: (v) => `${String(v)}%`,
      },
      {
        key: 'renovation',
        header: 'Renovation Status',
        render: (v) => (
          <div className="flex items-center gap-2">
            {String(v) !== 'None' && <Hammer className="h-3 w-3 text-[var(--text-muted)]" />}
            <span className="text-xs">{String(v)}</span>
          </div>
        ),
      },
    ],
    [fmtCurrency]
  );
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  const stats = useMemo(() => {
    return RealEstateEngine.calculatePortfolioStats(entries);
  }, [entries]);

  const valuationTrend = useMemo(() => {
    return RealEstateEngine.getPropertyBreakdown(entries).map((p) => ({
      property: p.name,
      cost: p.purchasePrice,
      market: p.currentVal,
    }));
  }, [entries]);

  const portfolioInventory = useMemo(() => {
    return RealEstateEngine.getPropertyBreakdown(entries);
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Building2 className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Portfolio Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import your General Ledger and fixed asset schedule to analyze your property portfolio.
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
          purpose="Detailed asset management: Valuation history, acquisition basis, and renovation ROI."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="default" size="sm" className="h-10">
            <Building2 className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Properties"
          value={stats.totalProperties.toString()}
          change={2}
          changeLabel="acquisitions in Q1"
          trend="up"
        />
        <KPIValue
          label="Portfolio Unrealized Gain"
          value={fmtCurrency.custom({ signDisplay: 'always' })(stats.unrealizedGain)}
          change={15.4}
          changeLabel="since inception"
          trend="up"
          sparklineData={[30, 32, 35, 38, 39, 41, stats.unrealizedGain / 1000000]}
        />
        <KPIValue
          label="Loan-to-Value (LTV)"
          value={`${formatPercent(stats.ltv, 1)}`}
          change={-2.1}
          changeLabel="Deleveraging on track"
          trend="up" // Up is good (lower risk)
          sparklineData={[62, 61, 60.5, 60, 59.5, 59, stats.ltv]}
        />
        <KPIValue
          label="Avg. Holding Period"
          value={`${stats.avgHoldingPeriod} Yrs`}
          changeLabel="Aligned with strategy"
          trend="neutral"
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Cost Basis vs. Market Value</CardTitle>
            </div>
            <CardDescription>Appreciation analysis by key property</CardDescription>
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
                  <Bar dataKey="cost" name="Purchase Cost" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="market"
                    name="Current Market"
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
            <CardTitle>Portfolio Strategy</CardTitle>
            <CardDescription>Risk profile distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Core (Low Risk)</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Value-Add (Med Risk)</span>
                <span>25%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Opportunistic (High Risk)</span>
                <span>10%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-2">
                <Hammer className="h-3 w-3" />
                Active Renovations
              </div>
              <p className="text-amber-800 text-[10px] leading-relaxed">
                <span className="font-bold">Metro Plaza</span> facade upgrade is{' '}
                <span className="font-bold">42% complete</span>. Budget utilized: $1.2M of $2.8M.
                Expected yield lift: +140bps.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Asset Inventory</CardTitle>
            <CardDescription>
              Comprehensive property ledger with key financial performance indicators
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--text-muted)]" />
              <Input className="pl-7 h-9 w-64" placeholder="Search by name or city..." />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={portfolioInventory}
            caption="Property portfolio inventory details"
            ariaLabel="Property portfolio inventory table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
