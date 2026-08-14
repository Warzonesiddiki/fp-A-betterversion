import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useMemo, useState } from 'react';
import { TrendingUp, Download, Wallet, Globe, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { useGLStore } from '@/store/glStore';
import { RealEstateEngine } from '@/engines/RealEstateEngine';
import { formatPercent } from '@/utils/financialFormatting';

// Mock Data
const mockPeriods: FiscalPeriod[] = buildFiscalPeriods();

const reitPerformance = [
  {
    ticker: 'PLD',
    name: 'Prologis, Inc.',
    sector: 'Industrial',
    ffo_yield: '4.2%',
    dividend: '$3.84',
    mkt_cap: '$112B',
    return_ytd: '+8.4%',
  },
  {
    ticker: 'AMT',
    name: 'American Tower',
    sector: 'Specialty',
    ffo_yield: '5.1%',
    dividend: '$6.24',
    mkt_cap: '$89B',
    return_ytd: '-2.1%',
  },
  {
    ticker: 'EQIX',
    name: 'Equinix, Inc.',
    sector: 'Data Centers',
    ffo_yield: '3.8%',
    dividend: '$13.64',
    mkt_cap: '$74B',
    return_ytd: '+12.5%',
  },
  {
    ticker: 'SPG',
    name: 'Simon Property',
    sector: 'Retail',
    ffo_yield: '7.4%',
    dividend: '$7.60',
    mkt_cap: '$45B',
    return_ytd: '+4.2%',
  },
  {
    ticker: 'AVB',
    name: 'AvalonBay',
    sector: 'Residential',
    ffo_yield: '4.8%',
    dividend: '$6.60',
    mkt_cap: '$28B',
    return_ytd: '+5.6%',
  },
];

const columns: Column[] = [
  { key: 'ticker', header: 'Ticker', sortable: true },
  { key: 'name', header: 'REIT Name' },
  { key: 'sector', header: 'Primary Sector' },
  { key: 'ffo_yield', header: 'FFO Yield', align: 'right' },
  { key: 'dividend', header: 'Ann. Dividend', align: 'right' },
  { key: 'mkt_cap', header: 'Market Cap', align: 'right' },
  {
    key: 'return_ytd',
    header: 'Total Return YTD',
    align: 'right',
    render: (v) => (
      <span
        className={
          (v as string).startsWith('+') ? 'text-green-600 font-bold' : 'text-red-600 font-bold'
        }
      >
        {v as string}
      </span>
    ),
  },
];

export default function REITDashboardPage() {
  const fmtCurrency = useCurrencyFormatter();
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  const stats = useMemo(() => {
    return RealEstateEngine.calculateREITStats(entries);
  }, [entries]);

  const ffoTrend = useMemo(() => {
    const periods = Array.from(new Set(entries.map((e) => e.date.substring(0, 7)))).sort();
    return periods.slice(-6).map((period) => {
      const pEntries = entries.filter((e) => e.date.startsWith(period));
      const pStats = RealEstateEngine.calculateREITStats(pEntries);
      return {
        month: period,
        ffo: pStats.ffo,
        affo: pStats.affo,
        dividends: 1850000,
      };
    });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Globe className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No REIT Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import your Real Estate Investment Trust General Ledger to view FFO, AFFO, and NAV
          analytics.
        </p>
        <Button>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="REIT Analytics"
          purpose="Real Estate Investment Trust performance: FFO/AFFO tracking, dividend coverage, and sector benchmarking."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm">
            <Globe className="h-4 w-4 mr-2" />
            Market View
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Funds From Ops (FFO)"
          value={fmtCurrency.custom({ maxDecimals: 0 })(stats.ffo)}
          change={8.2}
          changeLabel="YTD core FFO"
          trend="up"
          sparklineData={ffoTrend.map((t) => t.ffo / 1000000)}
        />
        <KPIValue
          label="Dividend Yield"
          value={`${stats.dividendYield}%`}
          change={0.4}
          changeLabel="aligned with peer avg"
          trend="up"
          sparklineData={[5.0, 5.1, 5.2, 5.3, 5.4, stats.dividendYield]}
        />
        <KPIValue
          label="NAV Per Share"
          value={fmtCurrency.custom()(stats.navPerShare)}
          change={3.1}
          changeLabel="valuation premium 8%"
          trend="up"
          sparklineData={[105, 108, 110, 111, 112, stats.navPerShare]}
        />
        <KPIValue
          label="Payout Ratio"
          value={`${formatPercent(stats.payoutRatio, 1)}`}
          changeLabel="Safe coverage margin"
          trend="neutral"
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle>FFO vs. AFFO Trend</CardTitle>
            </div>
            <CardDescription>
              Operating cash flow vs. Adjusted funds available for distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ffoTrend}>
                  <defs>
                    <linearGradient id="colorFFO" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000000}M`}
                  />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" />
                  <Area
                    type="monotone"
                    dataKey="ffo"
                    name="FFO"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorFFO)"
                  />
                  <Area
                    type="monotone"
                    dataKey="affo"
                    name="AFFO"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="transparent"
                  />
                  <Line
                    type="monotone"
                    dataKey="dividends"
                    name="Dividends Paid"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dividend Risk Profile</CardTitle>
            <CardDescription>Coverage and growth metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-green-700 uppercase">Coverage Ratio</div>
                <div className="text-xl font-black text-green-800">1.38x</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium border-b border-slate-100 pb-2">
                <span className="text-slate-500">Trailing 12M Growth</span>
                <span className="text-green-600">+6.4%</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-b border-slate-100 pb-2">
                <span className="text-slate-500">Peer Group Avg Yield</span>
                <span className="text-slate-700">4.82%</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-b border-slate-100 pb-2">
                <span className="text-slate-500">Debt/EBITDAre</span>
                <span className="text-slate-700">5.4x</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-500">Interest Coverage</span>
                <span className="text-slate-700">4.1x</span>
              </div>
            </div>

            <Button className="w-full mt-4" variant="outline">
              <Wallet className="h-4 w-4 mr-2" />
              Distribution History
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* REIT Peer Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sector Peer Benchmarking</CardTitle>
            <CardDescription>
              Comparative analysis against top publicly traded REITs
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV Export
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={reitPerformance}
            caption="REIT portfolio performance metrics"
            ariaLabel="REIT performance table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
