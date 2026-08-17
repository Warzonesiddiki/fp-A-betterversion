import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useMemo, useState } from 'react';
import { TrendingUp, Wallet, Globe, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
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
import { useGLStore } from '@/store/glStore';
import { RealEstateEngine } from '@/engines/RealEstateEngine';
import { formatPercent } from '@/utils/financialFormatting';
import { formatMoney } from '@/utils/money';

const mockPeriods = buildFiscalPeriods();

export default function REITDashboardPage() {
  const fmtCurrency = useCurrencyFormatter();
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  const stats = useMemo(() => RealEstateEngine.calculateREITStats(entries), [entries]);

  const ffoTrend = useMemo(() => {
    const periods = Array.from(new Set(entries.map((e) => e.date.substring(0, 7)))).sort();
    return periods.slice(-6).map((period) => {
      const pEntries = entries.filter((e) => e.date.startsWith(period));
      const pStats = RealEstateEngine.calculateREITStats(pEntries);
      return {
        month: period,
        ffo: pStats.ffo,
        dividends: pStats.dividends,
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

  const moneyOrDash = (value: number | null | undefined): string =>
    value == null ? '—' : fmtCurrency.custom({ maxDecimals: 0 })(value);

  return (
    <div className="p-6 space-y-6 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="REIT Analytics"
          purpose="Funds From Operations from the posted General Ledger. AFFO, NAV per share, dividend yield and public-peer quotes require inputs the GL does not carry — they are omitted, not estimated."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Funds From Ops (FFO)"
          value={moneyOrDash(stats.ffo)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Dividends posted"
          value={moneyOrDash(stats.dividends)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <KPIValue
          label="Payout Ratio"
          value={stats.payoutRatio === null ? '—' : formatPercent(stats.payoutRatio, 1)}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <KPIValue
          label="Dividend coverage"
          value={
            stats.dividendCoverage === null
              ? '—'
              : `${formatMoney(stats.dividendCoverage, { places: 2 })}x`
          }
          icon={<ShieldCheck className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle>FFO by posted period</CardTitle>
            </div>
            <CardDescription>
              Operating cash-flow proxy from the General Ledger. A dividend series is shown only
              when prefix-80 accounts are posted in that period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ffoTrend.length >= 2 ? (
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
                      tickFormatter={(v) => fmtCurrency.compact(Number(v))}
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
                    <Line
                      type="monotone"
                      dataKey="dividends"
                      name="Dividends posted"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-8 text-center">
                A trend requires posted activity in at least two periods. A single period is not
                turned into a six-month sparkline.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Not derivable from the posted GL</CardTitle>
            <CardDescription>Omitted rather than estimated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--text-muted)]">
            <p>
              <span className="font-medium text-[var(--text-secondary)]">AFFO</span> — needs posted
              maintenance capital expenditure. It is not estimated from rental income.
            </p>
            <p>
              <span className="font-medium text-[var(--text-secondary)]">NAV per share</span> —
              needs a share count. It is not computed from an assumed share count.
            </p>
            <p>
              <span className="font-medium text-[var(--text-secondary)]">Dividend yield</span> —
              needs a share price. It is not filled with a placeholder rate.
            </p>
            <p>
              <span className="font-medium text-[var(--text-secondary)]">Public peer quotes</span> —
              listed-REIT market data is not this entity&apos;s ledger and is not shown.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
