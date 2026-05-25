import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useSector } from '@/hooks/useSector';
import { useTour } from '@/hooks/useTour';
import { KPICard } from '@/components/dashboard/KPICard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { ChartWrapper } from '@/components/analytics/ChartWrapper';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { DrillDownModal } from '@/components/ui/DrillDownModal';
import { RecentFilesEngine } from '@/engines/RecentFilesEngine';
import { PAGE_HELP } from './_docs';
import { LayoutDashboard, TrendingUp, BarChart3, Upload, Target, HelpCircle } from 'lucide-react';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { SparklineChart } from '@/components/charts/SparklineChart';
import { FinanceCopilotEngine } from '@/engines/FinanceCopilotEngine';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { NLQChat } from '@/components/ai/NLQChat';
import { AnomalyHighlight } from '@/components/ai/AnomalyHighlight';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPercent(n: number): string {
  return n.toFixed(1) + '%';
}

export default function DashboardPage() {
  const { pathname } = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillAccount, setDrillAccount] = useState('');
  const { runTour } = useTour();

  const openDrill = async (title: string, accountPrefix: string) => {
    try {
      if ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__) {
        const url = `/drill-down?title=${encodeURIComponent(title)}&accountPrefix=${encodeURIComponent(accountPrefix)}`;
        const label = `drill-down-${Date.now()}`;
        const webview = new WebviewWindow(label, {
          url,
          title,
          width: 1000,
          height: 700,
          center: true,
        });

        webview.once('tauri://error', function (e) {
          console.error('Error creating window:', e);
          // Fallback to modal if window creation fails
          setDrillTitle(title);
          setDrillAccount(accountPrefix);
          setDrillOpen(true);
        });
      } else {
        throw new Error('Not running in Tauri');
      }
    } catch (err) {
      console.warn('Tauri WebviewWindow not available, falling back to modal:', err);
      setDrillTitle(title);
      setDrillAccount(accountPrefix);
      setDrillOpen(true);
    }
  };

  useEffect(() => {
    document.title = 'FinPlan Pro — Financial Dashboard';
  }, []);

  const handleStartTour = () => {
    runTour('dashboard-tour', [
      {
        target: '.dashboard-header',
        title: 'Executive Dashboard',
        content:
          'Welcome to your financial command center. Here you can see a high-level summary of your financial health.',
        placement: 'bottom',
      },
      {
        target: '.kpi-grid',
        title: 'Key Performance Indicators',
        content: 'Monitor your Revenue, Profit, Net Income, and Expenses in real-time.',
        placement: 'bottom',
      },
      {
        target: '.trend-chart',
        title: 'Financial Trends',
        content:
          'Visualize your revenue and expenses over the last 12 months to identify patterns.',
        placement: 'top',
      },
    ]);
  };

  const { entries, accounts } = useGLStore();
  const { budgets } = useBudgetStore();
  const { sectorConfig } = useSector();
  const navigate = useNavigate();

  const kpis = useMemo(() => {
    if (entries.length === 0) return null;
    const totalRevenue = entries
      .filter((e) => (e.accountCode || '').startsWith('4'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const totalCOGS = entries
      .filter((e) => (e.accountCode || '').startsWith('5'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const totalExpenses = entries
      .filter((e) => (e.accountCode || '').startsWith('6'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const netIncome = totalRevenue - totalCOGS - totalExpenses;
    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const activeBudgets = budgets.filter(
      (b) => b.status === 'Approved' || b.status === 'InReview'
    ).length;
    const totalBudgetAmount = budgets.reduce((s, b) => s + (b.totalAmount || 0), 0);
    const budgetUtilization =
      totalBudgetAmount > 0 ? (Math.abs(totalExpenses + totalCOGS) / totalBudgetAmount) * 100 : 0;
    return {
      totalRevenue,
      totalCOGS,
      totalExpenses,
      netIncome,
      grossProfit,
      grossMargin,
      activeBudgets,
      totalBudgetAmount,
      budgetUtilization,
    };
  }, [entries, budgets]);

  const monthlyTrend = useMemo(() => {
    if (entries.length === 0) return [];
    const map = new Map<string, { revenue: number; expenses: number; count: number }>();
    entries.forEach((e) => {
      const month = e.period || e.date?.slice(0, 7);
      if (!month) return;
      const existing = map.get(month) || { revenue: 0, expenses: 0, count: 0 };
      const amt = e.debit - e.credit;
      if ((e.accountCode || '').startsWith('4')) existing.revenue += amt;
      else if ((e.accountCode || '').startsWith('5') || (e.accountCode || '').startsWith('6'))
        existing.expenses += Math.abs(amt);
      existing.count++;
      map.set(month, existing);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, d]) => ({
        month,
        revenue: d.revenue,
        expenses: d.expenses,
        netIncome: d.revenue - d.expenses,
      }));
  }, [entries]);

  const sectorKPIs = useMemo(() => {
    if (!sectorConfig || entries.length === 0) return null;
    return sectorConfig.defaultKPIs.map((kpi) => {
      const matchingEntries = entries.filter((e) =>
        kpi.accountCodes?.includes(e.accountCode || '')
      );
      const value = matchingEntries.reduce((s, e) => s + (e.debit - e.credit), 0);
      return { label: kpi.label, value: Math.abs(value), format: 'currency' as const, key: kpi.id };
    });
  }, [sectorConfig, entries]);

  if (entries.length === 0 && budgets.length === 0) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <div className="p-4 bg-blue-50 rounded-full inline-block mb-4">
          <LayoutDashboard className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Welcome to FinPlan Pro</h2>
        <p className="text-slate-400 mb-8">
          Your financial planning and analysis workspace. Get started in three steps:
        </p>
        <div className="grid gap-4 text-left mb-8">
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-sm">Import Your Data</h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload CSV or Excel files containing your General Ledger.
              </p>
            </div>
          </div>
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center text-sm font-bold shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-sm">Set Up Accounts</h3>
              <p className="text-xs text-slate-400 mt-1">
                Define your Chart of Accounts structure.
              </p>
            </div>
          </div>
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-900/50 text-purple-400 flex items-center justify-center text-sm font-bold shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-sm">Create Budgets</h3>
              <p className="text-xs text-slate-400 mt-1">Build your budgets and start planning.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/data/gl-upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Button variant="secondary" onClick={() => navigate('/data/chart-of-accounts')}>
            <Target className="h-4 w-4 mr-2" />
            Set Up Accounts
          </Button>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <Skeleton variant="rectangular" height="200px" />
      </div>
    );
  }

  // FinanceCopilotEngine: generate quick analysis
  const glStore = useGLStore();
  const budgetStore = useBudgetStore();
  const copilotAnswer = FinanceCopilotEngine.answer('what is total revenue', {
    gl: glStore,
    budget: budgetStore,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between dashboard-header">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold">Executive Dashboard</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <Button variant="ghost" size="sm" onClick={handleStartTour} className="text-blue-400">
              Start Guide
            </Button>
          </div>
          <p className="text-sm text-slate-400">
            {entries.length.toLocaleString()} entries · {accounts.length} accounts ·{' '}
            {budgets.length} budgets
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/data/gl-upload')}
          aria-label="Import financial data"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Import
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 kpi-grid">
        <div
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => openDrill('Revenue Transactions', '4')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openDrill('Revenue Transactions', '4');
          }}
        >
          <KPICard
            title="Total Revenue"
            value={kpis.totalRevenue}
            format="currency"
            trend={kpis.totalRevenue > 0 ? 'up' : 'neutral'}
            sparklineData={monthlyTrend.map((m) => m.revenue)}
          />
        </div>
        <div
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => openDrill('Profit & COGS Transactions', '5')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openDrill('Profit & COGS Transactions', '5');
          }}
        >
          <KPICard
            title="Gross Profit"
            value={kpis.grossProfit}
            format="currency"
            trend={kpis.grossMargin > 50 ? 'up' : kpis.grossMargin > 20 ? 'neutral' : 'down'}
            change={kpis.grossMargin}
          />
        </div>
        <div
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => openDrill('All Income Statement Transactions', '')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ')
              openDrill('All Income Statement Transactions', '');
          }}
        >
          <KPICard
            title="Net Income"
            value={kpis.netIncome}
            format="currency"
            trend={kpis.netIncome >= 0 ? 'up' : 'down'}
            sparklineData={monthlyTrend.map((m) => m.netIncome)}
          />
        </div>
        <div
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => openDrill('Expense Transactions', '6')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openDrill('Expense Transactions', '6');
          }}
        >
          <KPICard
            title="Total Expenses"
            value={kpis.totalExpenses + kpis.totalCOGS}
            format="currency"
            trend={
              kpis.budgetUtilization > 80 ? 'down' : kpis.budgetUtilization > 50 ? 'neutral' : 'up'
            }
            change={kpis.budgetUtilization}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="px-4 py-3 border-b border-slate-800">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              Budget Status
            </h3>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Active Budgets</span>
                <span className="font-semibold">{kpis.activeBudgets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Budget</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(kpis.totalBudgetAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Utilization</span>
                <span
                  className={
                    'font-semibold ' +
                    (kpis.budgetUtilization > 80
                      ? 'text-red-400'
                      : kpis.budgetUtilization > 50
                        ? 'text-yellow-400'
                        : 'text-green-400')
                  }
                >
                  {formatPercent(kpis.budgetUtilization)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-1">
                <div
                  className={
                    'h-full rounded-full transition-all ' +
                    (kpis.budgetUtilization > 80
                      ? 'bg-red-500'
                      : kpis.budgetUtilization > 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500')
                  }
                  style={{ width: Math.min(kpis.budgetUtilization, 100) + '%' }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex justify-center mt-3">
                <GaugeChart
                  value={Math.min(kpis.budgetUtilization, 100)}
                  max={100}
                  target={80}
                  label="Budget Used"
                  size={120}
                  ariaLabel="Budget utilization gauge"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 py-3 border-b border-slate-800">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              Key Ratios
            </h3>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Margin</span>
                <span className="font-semibold tabular-nums">
                  {formatPercent(kpis.grossMargin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expense Ratio</span>
                <span className="font-semibold tabular-nums">
                  {kpis.totalRevenue > 0
                    ? formatPercent((kpis.totalExpenses / kpis.totalRevenue) * 100)
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net Margin</span>
                <span
                  className={
                    'font-semibold tabular-nums ' +
                    (kpis.netIncome >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                >
                  {kpis.totalRevenue > 0
                    ? formatPercent((kpis.netIncome / kpis.totalRevenue) * 100)
                    : 'N/A'}
                </span>
              </div>
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/reports/profit-loss')}
                  aria-label="View detailed Profit and Loss report"
                >
                  View Full P&L
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 py-3 border-b border-slate-800">
            <h3 className="font-semibold text-sm">Recent Activity</h3>
          </CardHeader>
          <CardContent className="p-4">
            <ActivityFeed maxItems={5} />
          </CardContent>
        </Card>
      </div>

      <ChartWrapper
        title="Monthly Financial Trend"
        subtitle="Last 12 months · Revenue vs Expenses vs Net Income"
        height={400}
        empty={monthlyTrend.length < 2}
        className="trend-chart"
      >
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={monthlyTrend}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(v) => formatCurrency(v).replace('.00', '')}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '8px',
              }}
              itemStyle={{ fontSize: '12px' }}
              formatter={(value: any) => formatCurrency(value)}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Revenue"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorExpenses)"
              name="Expenses"
            />
            <Area
              type="monotone"
              dataKey="netIncome"
              stroke="#3b82f6"
              fill="transparent"
              name="Net Income"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* AI Copilot Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <AICopilotPanel pathname={pathname} gl={glStore} budget={budgetStore} />
        </div>
        <div className="lg:col-span-1">
          <NLQChat maxHeight="350px" />
        </div>
        <div className="lg:col-span-1">
          <AnomalyHighlight
            values={monthlyTrend.map((m) => m.revenue)}
            labels={monthlyTrend.map((m) => m.month)}
            maxDisplay={3}
          />
        </div>
      </div>

      {sectorKPIs && sectorKPIs.length > 0 && (
        <Card>
          <CardHeader className="px-4 py-3 border-b border-slate-800">
            <h3 className="font-semibold text-sm">{sectorConfig?.name || 'Sector'} KPIs</h3>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sectorKPIs.map((kpi) => (
                <div
                  key={kpi.key}
                  className="text-center p-3 bg-slate-900 rounded-lg border border-slate-800"
                >
                  <div className="text-xs text-slate-400 mb-1">{kpi.label}</div>
                  <div className="text-lg font-bold tabular-nums">{formatCurrency(kpi.value)}</div>
                  <div className="mt-2 flex justify-center">
                    <SparklineChart
                      data={monthlyTrend.map((m) => m.revenue)}
                      color="#10B981"
                      height={30}
                      width={80}
                      ariaLabel={`${kpi.label} trend`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <HelpPanel
        title={PAGE_HELP[pathname]?.title || 'Dashboard Help'}
        sections={PAGE_HELP[pathname]?.sections || []}
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      <DrillDownModal
        isOpen={drillOpen}
        onClose={() => setDrillOpen(false)}
        title={drillTitle}
        accountPrefix={drillAccount}
      />
    </div>
  );
}
