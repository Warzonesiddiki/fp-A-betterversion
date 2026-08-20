// @money-ast-allow Reason: NPL ratio: (nplAbs / balance) * 100 is a percentage for display, not money arithmetic
import React, { useMemo } from 'react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useTour } from '@/hooks/useTour';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartWrapper } from '@/components/analytics/ChartWrapper';
import { DataGrid } from '@/components/ui/DataGrid';
import { Percent, AlertCircle, Download } from 'lucide-react';
import { BankingEngine } from '@/engines/BankingEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { roundTo, sumMoney } from '@/utils/money';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * GAP-1 (F-0006) — exact-decimal loan-loss segment aggregates.
 *
 * The per-category outstanding balance, reserve, and NPL balance were raw
 * float reduces over GL entry amounts. They feed the bar chart and the
 * Portfolio Credit Quality DataGrid; NPL % stays a percentage metric.
 */
export function sumEntriesAmount(entries: readonly { amount: number }[]): number {
  return roundTo(sumMoney(entries.map((e) => e.amount)));
}

export function computeLoanSegments(
  entries: readonly { accountCode: string; amount: number }[],
  categories: readonly { prefix: string; name: string; color: string }[]
): { type: string; balance: number; reserve: number; npl: number; color: string }[] {
  return categories
    .map((cat) => {
      const catEntries = entries.filter((e) => e.accountCode.startsWith(cat.prefix));
      const balance = sumEntriesAmount(catEntries);
      const reserveCode = `215${cat.prefix.substring(2)}`;
      const reserve = Math.abs(
        sumEntriesAmount(entries.filter((e) => e.accountCode === reserveCode))
      );
      const nplCode = `92${cat.prefix.substring(2)}`;
      const nplAbs = Math.abs(sumEntriesAmount(entries.filter((e) => e.accountCode === nplCode)));
      return {
        type: cat.name,
        balance,
        reserve,
        npl: balance > 0 ? (nplAbs / balance) * 100 : 0,
        color: cat.color,
      };
    })
    .filter((s) => s.balance !== 0);
}

export default function LoanLossPage() {
  const fmtCurrency = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const { runTour } = useTour();

  const handleStartTour = () => {
    runTour('loan-loss-tour', [
      {
        target: '.loan-loss-header',
        title: 'Loan Loss Reserves',
        content: 'This page tracks your Allowance for Credit Losses (ACL) using CECL methodology.',
        placement: 'bottom',
      },
      {
        target: '.acl-metrics',
        title: 'Credit Quality Metrics',
        content: 'Monitor your NPL Ratio and Coverage Ratio to ensure capital adequacy.',
        placement: 'bottom',
      },
      {
        target: '.segment-chart',
        title: 'Segment Analysis',
        content:
          'View reserve distribution across different loan portfolios like Commercial and Residential.',
        placement: 'top',
      },
    ]);
  };

  const stats = useMemo(() => {
    return BankingEngine.calculateLoanLossStats(entries);
  }, [entries]);

  const loanPortfolio = useMemo(() => {
    const categories = [
      { prefix: '131', name: 'Commercial Real Estate', color: '#3b82f6' },
      { prefix: '132', name: 'Residential Mortgage', color: '#10b981' },
      { prefix: '133', name: 'Consumer Loans', color: '#f59e0b' },
      { prefix: '134', name: 'Small Business (SBA)', color: '#ef4444' },
    ];
    return computeLoanSegments(entries, categories);
  }, [entries]);

  const columns = [
    { field: 'type', headerName: 'Loan Portfolio', flex: 1.5 },
    { field: 'balance', headerName: 'Outstanding Balance', type: 'currency' as const, flex: 1.2 },
    { field: 'reserve', headerName: 'Specific Reserve', type: 'currency' as const, flex: 1 },
    { field: 'npl', headerName: 'NPL %', type: 'percent' as const, flex: 0.8 },
  ];

  const handleExport = () => {
    const data = {
      headers: ['Loan Portfolio', 'Outstanding Balance', 'Specific Reserve', 'NPL %'],
      rows: loanPortfolio.map((l) => [l.type, l.balance, l.reserve, `${l.npl}%`]),
    };
    void ExportEngine.exportToPDF(data, {
      title: 'Loan Loss Reserve Analysis',
      companyName: 'FinPlan Pro Banking',
    }).catch(reportExportFailure);
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Percent className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Loan Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import your loan portfolio and GL data to calculate credit loss reserves.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        className="loan-loss-header"
        icon={<Percent className="h-6 w-6 text-red-400" />}
        title="Loan Loss Reserve (ACL)"
        purpose={<>CECL Methodology &amp; Credit Quality Monitoring</>}
        actions={
          <>
            {/* "Start Guide" was authored inside the <h1>, which put a button
                into the page's accessible name. It is an action, so it lives
                with the other actions now. */}
            <Button variant="ghost" size="sm" onClick={handleStartTour} className="text-blue-400">
              Start Guide
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button size="sm">Provision Journal</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 acl-metrics">
        <KPICard
          title="ACL Reserve Balance"
          value={stats.reserveBalance}
          format="currency"
          trend="up"
          change={3.5}
        />
        <KPICard
          title="NPL Ratio"
          value={stats.nplRatio}
          format="percent"
          trend="down"
          change={-0.03}
          sparklineData={[]}
        />
        <KPICard title="Reserve Coverage" value={stats.coverageRatio} format="percent" />
        <KPICard
          title="Net Charge-Offs (YTD)"
          value={stats.netChargeOffs}
          format="currency"
          trend="down"
          change={-1.2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWrapper
            title="Allowance for Credit Losses (ACL) by Segment"
            subtitle="Reserve distribution vs. exposure"
            height={350}
            className="segment-chart"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={loanPortfolio} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis
                  dataKey="type"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(v) => `$${v / 1000000}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => fmtCurrency.custom()(Number(value))}
                />
                <Legend />
                <Bar
                  dataKey="balance"
                  name="Outstanding Balance"
                  fill="#1e293b"
                  radius={[4, 4, 0, 0]}
                >
                  {loanPortfolio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.3} />
                  ))}
                </Bar>
                <Bar dataKey="reserve" name="Specific Reserve" fill="#ef4444" radius={[4, 4, 0, 0]}>
                  {loanPortfolio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              Watchlist Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-2 bg-slate-900 border-l-4 border-red-500 rounded">
                <div className="text-xs font-bold text-white">Substandard Assets</div>
                <div className="text-lg font-black text-red-400">$14.2M</div>
              </div>
              <div className="p-2 bg-slate-900 border-l-4 border-yellow-500 rounded">
                <div className="text-xs font-bold text-white">Special Mention</div>
                <div className="text-lg font-black text-yellow-400">$28.5M</div>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="ghost" size="sm" className="w-full text-blue-400">
                View TDR Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Portfolio Credit Quality</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataGrid rows={loanPortfolio} columns={columns} className="h-64 border-none" />
        </CardContent>
      </Card>
    </div>
  );
}
