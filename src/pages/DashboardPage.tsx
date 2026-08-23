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
import { PageHeader } from '@/components/ui/PageHeader';
import { FinancialWorkspaceEmptyState } from '@/components/ui/FinancialWorkspaceEmptyState';
import { FinancialStatusBadge } from '@/components/ui/FinancialStatusBadge';
import { DrillDownModal } from '@/components/ui/DrillDownModal';
import { PAGE_HELP } from './_docs';
import { LayoutDashboard, TrendingUp, BarChart3, Upload, Target, HelpCircle } from 'lucide-react';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { SparklineChart } from '@/components/charts/SparklineChart';
import { FinanceCopilotEngine } from '@/engines/FinanceCopilotEngine';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { NLQChat } from '@/components/ai/NLQChat';
import { AnomalyHighlight } from '@/components/ai/AnomalyHighlight';
import { createLogger } from '@/utils/logger';

const dashboardLogger = createLogger('Dashboard');
import { formatPercent } from '@/utils/financialFormatting';
import {
  deriveDashboardKpis,
  deriveMonthlyTrend,
  deriveSectorKpis,
} from '@/pages/dashboard/dashboardModel';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
export default function DashboardPage() {
  const fmt = useCurrencyFormatter();
  const { pathname } = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillAccount, setDrillAccount] = useState('');
  const { runTour } = useTour();

  const openDrill = async (title: string, accountPrefix: string) => {
    try {
      if ('__TAURI_INTERNALS__' in window || '__TAURI__' in window) {
        // F-05 browser-beta hardening: resolved lazily so a plain browser
        // never statically evaluates @tauri-apps/api/webviewWindow.
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
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
          dashboardLogger.error('Error creating window', { event: e });
          // Fallback to modal if window creation fails
          setDrillTitle(title);
          setDrillAccount(accountPrefix);
          setDrillOpen(true);
        });
      } else {
        throw new Error('Not running in Tauri');
      }
    } catch (err) {
      dashboardLogger.warn('Tauri WebviewWindow not available, falling back to modal', {
        error: err instanceof Error ? err.message : String(err),
      });
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

  const glStore = useGLStore();
  const { entries, accounts } = glStore;
  const budgetStore = useBudgetStore();
  const { budgets } = budgetStore;
  const { sectorConfig } = useSector();
  const navigate = useNavigate();

  // Every figure below comes from `@/pages/dashboard/dashboardModel` so the
  // tiles, the ratios and the trend chart share one decimal.js derivation and
  // one sign convention. See that module's correctness contract (K18).
  const kpis = useMemo(() => deriveDashboardKpis(entries, budgets), [entries, budgets]);

  const monthlyTrend = useMemo(() => deriveMonthlyTrend(entries), [entries]);

  const sectorKPIs = useMemo(
    () => deriveSectorKpis(entries, sectorConfig?.defaultKPIs),
    [sectorConfig, entries]
  );

  if (entries.length === 0 && budgets.length === 0) {
    return (
      <FinancialWorkspaceEmptyState
        icon={<LayoutDashboard className="h-10 w-10" />}
        title="Set up your finance workspace"
        description="Load and validate your financial inputs before you begin planning, forecasting, and reporting."
        steps={[
          {
            title: 'Import actuals',
            description: 'Load a CSV or Excel general-ledger source into your workspace.',
          },
          {
            title: 'Confirm reporting accounts',
            description: 'Set up the chart of accounts used to organize your financial view.',
          },
          {
            title: 'Create your first plan',
            description: 'Build a budget or forecast once your finance structure is ready.',
          },
        ]}
        actions={
          <>
            <Button onClick={() => navigate('/data/gl-upload')}>
              <Upload className="h-4 w-4 mr-2" />
              Import actuals
            </Button>
            <Button variant="secondary" onClick={() => navigate('/data/chart-of-accounts')}>
              <Target className="h-4 w-4 mr-2" />
              Set up accounts
            </Button>
          </>
        }
      />
    );
  }

  if (!kpis) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <Skeleton variant="rectangular" height="200px" srLabel="Loading dashboard…" />
      </div>
    );
  }

  // FinanceCopilotEngine: generate quick analysis
  const _copilotAnswer = FinanceCopilotEngine.answer('what is total revenue', {
    gl: glStore,
    budget: budgetStore,
  });

  return (
    <div className="fp-page space-y-6">
      <PageHeader
        className="dashboard-header"
        title="Executive Dashboard"
        purpose={`${entries.length.toLocaleString()} entries · ${accounts.length} accounts · ${budgets.length} budgets`}
        status={<FinancialStatusBadge status="draft" detail="Local workspace data" />}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/data/gl-upload')}
            aria-label="Import financial data"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Import
          </Button>
        }
      >
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => setHelpOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <Button variant="ghost" size="sm" onClick={handleStartTour} className="text-blue-400">
            Start Guide
          </Button>
        </div>
      </PageHeader>

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
            trend={
              kpis.grossMargin === null
                ? 'neutral'
                : kpis.grossMargin > 50
                  ? 'up'
                  : kpis.grossMargin > 20
                    ? 'neutral'
                    : 'down'
            }
            change={kpis.grossMargin ?? undefined}
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
            value={kpis.totalExpenses}
            format="currency"
            trend={
              kpis.budgetUtilization === null
                ? 'neutral'
                : kpis.budgetUtilization > 80
                  ? 'down'
                  : kpis.budgetUtilization > 50
                    ? 'neutral'
                    : 'up'
            }
            change={kpis.budgetUtilization ?? undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="px-4 py-3 border-b border-slate-800">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              Budget Status
            </h2>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Active Budgets</span>
                <span className="font-semibold">{kpis.activeBudgets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Budget</span>
                <span className="font-semibold tabular-nums">
                  {fmt.currency0(kpis.totalBudgetAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Utilization</span>
                <span
                  className={
                    'font-semibold ' +
                    (kpis.budgetUtilization === null
                      ? 'text-[var(--text-muted)]'
                      : kpis.budgetUtilization > 80
                        ? 'text-red-400'
                        : kpis.budgetUtilization > 50
                          ? 'text-yellow-400'
                          : 'text-green-400')
                  }
                  title={
                    kpis.budgetUtilization === null
                      ? 'No approved budget amount is posted, so utilization cannot be computed.'
                      : undefined
                  }
                >
                  {formatPercent(kpis.budgetUtilization)}
                </span>
              </div>
              {kpis.budgetUtilization === null ? (
                <p className="text-xs text-[var(--text-muted)]">
                  Utilization needs a posted budget amount to divide by. Create or import a budget
                  to see it.
                </p>
              ) : (
                <>
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
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 py-3 border-b border-slate-800">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              Key Ratios
            </h2>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Gross Margin</span>
                <span className="font-semibold tabular-nums">
                  {formatPercent(kpis.grossMargin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Expense Ratio</span>
                <span className="font-semibold tabular-nums">
                  {formatPercent(kpis.expenseRatio)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Net Margin</span>
                <span
                  className={
                    'font-semibold tabular-nums ' +
                    (kpis.netIncome >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                >
                  {formatPercent(kpis.netMargin)}
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
            <h2 className="font-semibold text-sm">Recent Activity</h2>
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
        headingLevel="h2"
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
              tickFormatter={(v) => fmt.currency0(v).replace('.00', '')}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '8px',
              }}
              itemStyle={{ fontSize: '12px' }}
              formatter={(value) => fmt.currency0(Number(value))}
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
            <h2 className="font-semibold text-sm">{sectorConfig?.name || 'Sector'} KPIs</h2>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sectorKPIs.map((kpi) => (
                <div
                  key={kpi.key}
                  className="text-center p-3 bg-slate-900 rounded-lg border border-slate-800"
                >
                  <div className="text-xs text-slate-400 mb-1">{kpi.label}</div>
                  <div className="text-lg font-bold tabular-nums">{fmt.currency0(kpi.value)}</div>
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
