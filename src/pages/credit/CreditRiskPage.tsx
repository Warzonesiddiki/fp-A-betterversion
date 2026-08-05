/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import {
  ShieldAlert,
  DollarSign,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Download,
  Activity,
  Shield,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { sumMoney, roundTo } from '@/utils/money';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useGLStore } from '@/store/glStore';
import { CreditRiskEngine, type Financials } from '@/engines/CreditRiskEngine';
import type { GLEntry } from '@/types';
import { formatCompact, formatNumber, formatPercent } from '@/utils/financialFormatting';

/** Derive financial ratios from GL entries grouped by entity. */
function deriveFinancialsFromGL(entries: GLEntry[]): Array<{
  entityId: string;
  name: string;
  financials: Financials;
}> {
  const entityIds = Array.from(
    new Set(entries.map((e) => e.entityId).filter((id): id is string => id !== undefined))
  );

  return entityIds
    .map((id) => {
      const entityEntries = entries.filter((e) => e.entityId === id);
      const name = entityEntries[0]?.accountName || 'Unknown Entity';

      // Derive financial ratios from GL account codes
      const assets = roundTo(
        sumMoney(
          entityEntries
            .filter((e) => e.accountCode.startsWith('1'))
            .map((e) => Math.abs(e.amount))
        ),
        2
      );
      const liabilities = roundTo(
        sumMoney(
          entityEntries
            .filter((e) => e.accountCode.startsWith('2'))
            .map((e) => Math.abs(e.amount))
        ),
        2
      );
      const equity = roundTo(
        sumMoney(
          entityEntries
            .filter((e) => e.accountCode.startsWith('3'))
            .map((e) => Math.abs(e.amount))
        ),
        2
      );
      const revenue = roundTo(
        sumMoney(
          entityEntries
            .filter((e) => e.accountCode.startsWith('4'))
            .map((e) => Math.abs(e.amount))
        ),
        2
      );
      const opex = roundTo(
        sumMoney(
          entityEntries
            .filter((e) => e.accountCode.startsWith('5'))
            .map((e) => Math.abs(e.amount))
        ),
        2
      );

      const currentAssets = roundTo(
        sumMoney(
          entityEntries
            .filter((e) => e.accountCode.startsWith('11') || e.accountCode.startsWith('12'))
            .map((e) => Math.abs(e.amount))
        ),
        2
      );
      const currentLiabilities = entityEntries
        .filter((e) => e.accountCode.startsWith('21'))
        .reduce((acc, e) => acc + Math.abs(e.amount), 0);

      const currentRatio =
        currentLiabilities > 0 ? currentAssets / currentLiabilities : assets > 0 ? 2.5 : 1.5;
      const debtToEquity = equity > 0 ? liabilities / equity : liabilities > 0 ? 2.0 : 0.5;
      const interestCoverage = opex > 0 ? (revenue - opex) / (opex * 0.05) : 3.0;
      const returnOnAssets = assets > 0 ? (revenue - opex) / assets : 0.05;
      const cashFlowToDebt = liabilities > 0 ? (revenue - opex) / liabilities : 0.3;

      return {
        entityId: id,
        name,
        financials: {
          currentRatio: Math.max(0, Math.min(10, currentRatio)),
          debtToEquity: Math.max(0, Math.min(10, debtToEquity)),
          interestCoverage: Math.max(0, Math.min(20, interestCoverage)),
          returnOnAssets: Math.max(-0.5, Math.min(0.5, returnOnAssets)),
          cashFlowToDebt: Math.max(0, Math.min(2, cashFlowToDebt)),
          yearsInBusiness: 5 + ((parseInt(id.replace(/\D/g, ''), 10) || 0) % 15),
        },
      };
    })
    .filter((e) => {
      // Only include entities with some financial activity
      const totalAmount = entries
        .filter((x) => x.entityId === e.entityId)
        .reduce((acc, x) => acc + Math.abs(x.amount), 0);
      return totalAmount > 0;
    });
}

const RATING_COLORS: Record<string, string> = {
  AAA: '#10b981',
  AA: '#34d399',
  A: '#6ee7b7',
  BBB: '#fbbf24',
  BB: '#f59e0b',
  B: '#f97316',
  CCC: '#ef4444',
  D: '#dc2626',
};

const creditColumns: Column[] = [
  { key: 'name', header: 'Entity', sortable: true },
  {
    key: 'rating',
    header: 'Rating',
    render: (v) => (
      <span
        className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
        style={{ backgroundColor: RATING_COLORS[v as string] || '#94a3b8' }}
      >
        {v as string}
      </span>
    ),
  },
  {
    key: 'score',
    header: 'Credit Score',
    align: 'right',
    render: (v) => <span className="font-bold">{v as number}</span>,
  },
  {
    key: 'pd',
    header: 'PD',
    align: 'right',
    render: (v) => `${formatPercent(v as number, 2)}`,
  },
  {
    key: 'lgd',
    header: 'LGD',
    align: 'right',
    render: (v) => `${formatPercent(v as number, 1)}`,
  },
  {
    key: 'ead',
    header: 'EAD',
    align: 'right',
    render: (v) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v as number),
  },
  {
    key: 'expectedLoss',
    header: 'Expected Loss',
    align: 'right',
    render: (v) => {
      const num = v as number;
      return (
        <span className={num > 10000 ? 'text-red-600 font-semibold' : 'text-slate-700'}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(num)}
        </span>
      );
    },
  },
];

export default function CreditRiskPage() {
  const { entries } = useGLStore();

  const creditData = useMemo(() => {
    const entityFinancials = deriveFinancialsFromGL(entries);

    return entityFinancials.map((entity) => {
      const creditScore = CreditRiskEngine.creditScore(entity.financials);
      // Derive collateral and exposure from financials
      const collateralValue =
        entity.financials.currentRatio * 1000000 * entity.financials.returnOnAssets * 10;
      const exposure = collateralValue * (1 + entity.financials.debtToEquity * 0.5);
      const commitment = exposure * 1.2;
      const drawn = exposure * 0.7;
      const ccf = 0.5;

      const lgd = CreditRiskEngine.lossGivenDefault(Math.abs(collateralValue), Math.abs(exposure));
      const ead = CreditRiskEngine.exposureAtDefault(commitment, drawn, ccf);
      const expectedLoss = CreditRiskEngine.expectedLoss(creditScore.pd, lgd, ead);

      return {
        ...entity,
        rating: creditScore.rating,
        score: creditScore.score,
        pd: creditScore.pd,
        lgd,
        ead,
        expectedLoss,
      };
    });
  }, [entries]);

  const portfolioMetrics = useMemo(() => {
    if (creditData.length === 0) {
      return {
        totalExposure: 0,
        totalExpectedLoss: 0,
        weightedPD: 0,
        avgScore: 0,
        highRiskCount: 0,
      };
    }

    const totalExposure = creditData.reduce((acc, c) => acc + c.ead, 0);
    const totalExpectedLoss = creditData.reduce((acc, c) => acc + c.expectedLoss, 0);
    const weightedPD =
      totalExposure > 0 ? creditData.reduce((acc, c) => acc + c.pd * c.ead, 0) / totalExposure : 0;
    const avgScore = creditData.reduce((acc, c) => acc + c.score, 0) / creditData.length;
    const highRiskCount = creditData.filter(
      (c) => c.rating === 'B' || c.rating === 'CCC' || c.rating === 'D'
    ).length;

    return { totalExposure, totalExpectedLoss, weightedPD, avgScore, highRiskCount };
  }, [creditData]);

  const ratingDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of creditData) {
      counts.set(c.rating, (counts.get(c.rating) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([rating, count]) => ({
      name: rating,
      value: count,
      color: RATING_COLORS[rating] || '#94a3b8',
    }));
  }, [creditData]);

  if (entries.length === 0) {
    return (
      <main
        className="p-12 text-center max-w-md mx-auto"
        role="main"
        aria-label="Credit Risk - No Data"
      >
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <ShieldAlert className="h-10 w-10 text-slate-400" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Credit Data</h2>
        <p className="text-slate-400 mb-6">
          Import your General Ledger to assess credit risk, probability of default, and expected
          losses across counterparties.
        </p>
        <Button aria-label="Import GL data to view credit risk">Import Data</Button>
      </main>
    );
  }

  return (
    <main
      className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500"
      role="main"
      aria-label="Credit Risk Assessment"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Credit Risk Assessment
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Counterparty credit scoring, probability of default, LGD, and expected loss analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" aria-label="Export credit risk report">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export Report
          </Button>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Credit Risk KPIs">
        <KPIValue
          label="Total Exposure (EAD)"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: 'compact',
          }).format(portfolioMetrics.totalExposure)}
          trend="neutral"
        />
        <KPIValue
          label="Total Expected Loss"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: 'compact',
          }).format(portfolioMetrics.totalExpectedLoss)}
          changeLabel={`PD: ${formatPercent(portfolioMetrics.weightedPD, 2)}`}
          trend="down"
        />
        <KPIValue
          label="Avg Credit Score"
          value={formatNumber(portfolioMetrics.avgScore, 0)}
          changeLabel="portfolio weighted"
          trend={portfolioMetrics.avgScore >= 60 ? 'up' : 'down'}
        />
        <KPIValue
          label="High-Risk Entities"
          value={portfolioMetrics.highRiskCount.toString()}
          changeLabel="rated B+ or below"
          trend={portfolioMetrics.highRiskCount > 0 ? 'down' : 'up'}
        />
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-3" aria-label="Credit risk charts">
        <Card
          className="lg:col-span-2"
          role="img"
          aria-label="Bar chart showing expected loss by entity"
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <CardTitle>Expected Loss by Entity</CardTitle>
            </div>
            <CardDescription>PD x LGD x EAD for each counterparty</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v ? formatCompact(v) : '—'}`}
                  />
                  <Tooltip
                    formatter={(v: any) => [
                      `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                      'Expected Loss',
                    ]}
                  />
                  <Bar dataKey="expectedLoss" name="Expected Loss" radius={[4, 4, 0, 0]}>
                    {creditData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.expectedLoss > 50000
                            ? '#ef4444'
                            : entry.expectedLoss > 10000
                              ? '#f59e0b'
                              : '#10b981'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card aria-label="Rating distribution">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              <CardTitle>Rating Distribution</CardTitle>
            </div>
            <CardDescription>Counterparty credit quality breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ratingDistribution}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Risk Summary
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Investment Grade (BBB+)</span>
                  <span className="font-bold">
                    {creditData.filter((c) => ['AAA', 'AA', 'A', 'BBB'].includes(c.rating)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Speculative (BB/B)</span>
                  <span className="font-bold">
                    {creditData.filter((c) => ['BB', 'B'].includes(c.rating)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Distressed (CCC/D)</span>
                  <span className="font-bold text-red-600">
                    {creditData.filter((c) => ['CCC', 'D'].includes(c.rating)).length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Credit Table */}
      <Card aria-label="Counterparty credit detail table">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <div>
              <CardTitle>Counterparty Credit Detail</CardTitle>
              <CardDescription>
                Per-entity credit score, PD, LGD, EAD, and expected loss
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={creditColumns}
            data={creditData}
            caption="Credit risk exposures: counterparty, notional, credit rating, and probability of default"
            ariaLabel="Credit risk exposures table"
          />
        </CardContent>
      </Card>
    </main>
  );
}
