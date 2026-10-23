import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useShallow } from 'zustand/react/shallow';
import { runMonteCarlo as executeMonteCarlo } from '@/workers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Target } from 'lucide-react';
import { formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  computeContribution,
  deriveGoalSeekActuals,
  modeledTotalCost,
  modeledVolatility,
  profitFromDraw,
  summarizeOutcomes,
  variableCostPctForTarget,
  type ContributionResult,
  type OutcomeSummary,
} from './goalSeekModel';

export default function GoalSeekPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore(useShallow((s) => ({ entries: s.entries })));
  const navigate = useNavigate();
  const [mode, setMode] = useState<'goalseek' | 'montecarlo' | 'breakeven'>('breakeven');
  const [targetProfit, setTargetProfit] = useState(1000000);
  const [fixedCost, setFixedCost] = useState(500000);
  const [variableCostPct, setVariableCostPct] = useState(60);
  const [iterations, setIterations] = useState(1000);
  const [revenueVolPct, setRevenueVolPct] = useState(10);
  const [costVolPct, setCostVolPct] = useState(8);
  const [breakevenResults, setBreakevenResults] = useState<ContributionResult | null>(null);
  const [monteCarloResults, setMonteCarloResults] = useState<OutcomeSummary | null>(null);
  const [mcError, setMcError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const actuals = useMemo(() => deriveGoalSeekActuals(entries), [entries]);

  const runModel = () => {
    setBreakevenResults(
      computeContribution({
        fixedCost,
        variableCostPct,
        targetProfit,
      })
    );
  };

  const impliedVc = actuals
    ? variableCostPctForTarget({
        revenue: actuals.revenue,
        fixedCost,
        targetProfit,
      })
    : null;

  const runMonteCarlo = async () => {
    if (!actuals) return;
    setLoading(true);
    setMcError(null);
    try {
      const base = actuals.revenue;
      const baseCosts = modeledTotalCost(base, variableCostPct, fixedCost);
      const response = await executeMonteCarlo({
        iterations,
        seed: Math.floor(Math.random() * 2 ** 31),
        assumptions: [
          {
            name: 'revenue',
            type: 'normal',
            mean: base,
            stdDev: modeledVolatility(base, revenueVolPct),
          },
          {
            name: 'costs',
            type: 'normal',
            mean: baseCosts,
            stdDev: modeledVolatility(baseCosts, costVolPct),
          },
        ],
      });
      const samples = response.results.map((r) => profitFromDraw(r.values.revenue, r.values.costs));
      setMonteCarloResults(summarizeOutcomes(samples));
    } catch (err) {
      setMcError(err instanceof Error ? err.message : 'Monte Carlo simulation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!actuals && mode === 'montecarlo') {
    return (
      <div className="p-12 text-center">
        <Target className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data for Monte Carlo simulations.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Financial Modeling" />
      <div className="flex gap-2">
        {['breakeven', 'goalseek', 'montecarlo'].map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m as typeof mode);
              setBreakevenResults(null);
              setMonteCarloResults(null);
              setMcError(null);
            }}
            className={
              'px-3 py-1.5 rounded text-xs font-medium ' +
              (mode === m ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400')
            }
          >
            {m === 'breakeven' ? 'Break-Even' : m === 'goalseek' ? 'Goal Seek' : 'Monte Carlo'}
          </button>
        ))}
      </div>

      {(mode === 'breakeven' || mode === 'goalseek') && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">
              {mode === 'breakeven' ? 'Break-Even Analysis' : 'Goal Seek'}
            </h3>
            <div>
              <label htmlFor="fixed-costs" className="block text-xs text-[var(--text-muted)] mb-1">
                Fixed Costs
              </label>
              <Input
                id="fixed-costs"
                type="number"
                value={fixedCost}
                onChange={(e) => setFixedCost(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label
                htmlFor="variable-cost-of-revenue"
                className="block text-xs text-[var(--text-muted)] mb-1"
              >
                Variable Cost (% of Revenue)
              </label>
              <Input
                id="variable-cost-of-revenue"
                type="number"
                value={variableCostPct}
                onChange={(e) => setVariableCostPct(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label
                htmlFor="target-profit-for-goal-seek"
                className="block text-xs text-[var(--text-muted)] mb-1"
              >
                Target Profit
              </label>
              <Input
                id="target-profit-for-goal-seek"
                type="number"
                value={targetProfit}
                onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
              />
            </div>
            <Button onClick={runModel}>Calculate</Button>
            {breakevenResults && (
              <div className="space-y-2 text-sm pt-4 border-t border-slate-800">
                {!breakevenResults.valid && (
                  <p role="alert" className="text-xs text-red-400">
                    Contribution margin must be positive. Revenue required is not defined when
                    variable cost is 100% or more of revenue.
                  </p>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Contribution Margin</span>
                  <span className="font-semibold">
                    {formatPercent(breakevenResults.contributionMarginPct, 1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Break-Even Revenue</span>
                  <span className="font-semibold text-green-400">
                    {fmt.currency0(breakevenResults.breakEvenRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Revenue for Target Profit</span>
                  <span className="font-semibold text-blue-400">
                    {fmt.currency0(breakevenResults.revenueForTarget)}
                  </span>
                </div>
                {mode === 'goalseek' && impliedVc && actuals && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">
                      VC% that hits the target at posted revenue
                    </span>
                    <span className="font-semibold">
                      {impliedVc.valid ? formatPercent(impliedVc.variableCostPct, 1) : '—'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {mode === 'montecarlo' && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Monte Carlo Simulation</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Base revenue: {actuals ? fmt.currency0(actuals.revenue) : '—'}
            </p>
            <div>
              <label htmlFor="iterations" className="block text-xs text-[var(--text-muted)] mb-1">
                Iterations
              </label>
              <Input
                id="iterations"
                type="number"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value) || 100)}
              />
            </div>
            <div>
              <label htmlFor="revenue-vol" className="block text-xs text-[var(--text-muted)] mb-1">
                Revenue volatility (model assumption, % of base)
              </label>
              <Input
                id="revenue-vol"
                type="number"
                value={revenueVolPct}
                onChange={(e) => setRevenueVolPct(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label htmlFor="cost-vol" className="block text-xs text-[var(--text-muted)] mb-1">
                Cost volatility (model assumption, % of modelled cost)
              </label>
              <Input
                id="cost-vol"
                type="number"
                value={costVolPct}
                onChange={(e) => setCostVolPct(parseFloat(e.target.value) || 0)}
              />
            </div>
            <Button onClick={runMonteCarlo} disabled={loading}>
              {loading ? 'Running...' : 'Run Simulation'}
            </Button>
            {loading && (
              <Skeleton variant="rectangular" height="100px" srLabel="Running simulation…" />
            )}
            {monteCarloResults && !loading && (
              <div className="space-y-2 text-sm pt-4 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Iterations</span>
                  <span>{monteCarloResults.count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Avg Profit</span>
                  <span className="font-semibold">{fmt.currency0(monteCarloResults.average)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Median</span>
                  <span className="font-semibold">{fmt.currency0(monteCarloResults.median)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">P10 / P90</span>
                  <span>
                    {fmt.currency0(monteCarloResults.p10)} / {fmt.currency0(monteCarloResults.p90)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Positive Outcomes</span>
                  <span
                    className={
                      'font-semibold ' +
                      (monteCarloResults.positivePct > 50 ? 'text-green-400' : 'text-red-400')
                    }
                  >
                    {formatPercent(monteCarloResults.positivePct, 1)}
                  </span>
                </div>
              </div>
            )}
            {mcError && (
              <p role="alert" className="text-xs text-red-400">
                {mcError}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
