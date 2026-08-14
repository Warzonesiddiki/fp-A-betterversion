import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { runMonteCarlo as executeMonteCarlo } from '@/workers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Target } from 'lucide-react';
import { formatPercent } from '@/utils/financialFormatting';
import { sumMoney, subtractMoney, roundTo } from '@/utils/money';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { PageHeader } from '@/components/ui/PageHeader';

interface BreakevenResults {
  breakevenRevenue: number;
  revenueForTarget: number;
  contributionMargin: number;
  fixedCost: number;
  variableCostPct: number;
}

interface MonteCarloResults {
  count: number;
  avgProfit: number;
  median: number;
  p10: number;
  p90: number;
  positivePct: number;
}
export default function GoalSeekPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'goalseek' | 'montecarlo' | 'breakeven'>('breakeven');
  const [targetProfit, setTargetProfit] = useState(1000000);
  const [fixedCost, setFixedCost] = useState(500000);
  const [variableCostPct, setVariableCostPct] = useState(60);
  const [iterations, setIterations] = useState(1000);
  const [breakevenResults, setBreakevenResults] = useState<BreakevenResults | null>(null);
  const [monteCarloResults, setMonteCarloResults] = useState<MonteCarloResults | null>(null);
  const [mcError, setMcError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const actuals = useMemo(() => {
    if (entries.length === 0) return null;
    const revenue = roundTo(
      sumMoney(
        entries.filter((e) => (e.accountCode || '').startsWith('4')).map((e) => e.credit - e.debit)
      ),
      2
    );
    const expenses = roundTo(
      sumMoney(
        entries
          .filter(
            (e) => (e.accountCode || '').startsWith('5') || (e.accountCode || '').startsWith('6')
          )
          .map((e) => Math.abs(e.debit - e.credit))
      ),
      2
    );
    return { revenue, expenses, netIncome: roundTo(subtractMoney(revenue, expenses), 2) };
  }, [entries]);

  const runBreakeven = () => {
    const contributionMargin = 100 - variableCostPct;
    const beRevenue = contributionMargin > 0 ? fixedCost / (contributionMargin / 100) : 0;
    const revForTarget =
      contributionMargin > 0 ? (fixedCost + targetProfit) / (contributionMargin / 100) : 0;
    setBreakevenResults({
      breakevenRevenue: beRevenue,
      revenueForTarget: revForTarget,
      contributionMargin,
      fixedCost,
      variableCostPct,
    });
  };

  const runMonteCarlo = async () => {
    setLoading(true);
    setMcError(null);
    try {
      const base = actuals?.revenue || 1000000;
      const baseCosts = base * (variableCostPct / 100) + fixedCost;
      // Real Monte Carlo: sampled revenue/cost distributions run in a Web
      // Worker with a seeded PRNG (see workers/monte-carlo.worker.ts).
      const response = await executeMonteCarlo({
        iterations,
        seed: Math.floor(Math.random() * 2 ** 31),
        assumptions: [
          { name: 'revenue', type: 'normal', mean: base, stdDev: base * 0.1 },
          { name: 'costs', type: 'normal', mean: baseCosts, stdDev: baseCosts * 0.08 },
        ],
      });
      const profits = response.results
        .map((r) => (r.values.revenue ?? 0) - (r.values.costs ?? 0))
        .sort((a, b) => a - b);
      const avgProfit = profits.length
        ? profits.reduce((sum, p) => sum + p, 0) / profits.length
        : 0;
      const median = profits[Math.floor(profits.length / 2)] ?? 0;
      const p10 = profits[Math.floor(profits.length * 0.1)] ?? 0;
      const p90 = profits[Math.floor(profits.length * 0.9)] ?? 0;
      const positiveOutcomes = profits.filter((p) => p >= 0).length;
      setMonteCarloResults({
        count: iterations,
        avgProfit,
        median,
        p10,
        p90,
        positivePct: (positiveOutcomes / iterations) * 100,
      });
    } catch (err) {
      setMcError(err instanceof Error ? err.message : 'Monte Carlo simulation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!actuals && mode !== 'breakeven') {
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

      {mode === 'breakeven' && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Break-Even Analysis</h3>
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
                Target Profit (for goal seek)
              </label>
              <Input
                id="target-profit-for-goal-seek"
                type="number"
                value={targetProfit}
                onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
              />
            </div>
            <Button onClick={runBreakeven}>Calculate</Button>
            {breakevenResults && (
              <div className="space-y-2 text-sm pt-4 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Contribution Margin</span>
                  <span className="font-semibold">
                    {formatPercent(breakevenResults.contributionMargin, 1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Break-Even Revenue</span>
                  <span className="font-semibold text-green-400">
                    {fmt.currency0(breakevenResults.breakevenRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Revenue for Target Profit</span>
                  <span className="font-semibold text-blue-400">
                    {fmt.currency0(breakevenResults.revenueForTarget)}
                  </span>
                </div>
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
              Base revenue: {actuals ? fmt.currency0(actuals.revenue) : '$1,000,000'}
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
            <Button onClick={runMonteCarlo} disabled={loading}>
              {loading ? 'Running...' : 'Run Simulation'}
            </Button>
            {loading && <Skeleton variant="rectangular" height="100px" />}
            {monteCarloResults && !loading && (
              <div className="space-y-2 text-sm pt-4 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Iterations</span>
                  <span>{monteCarloResults.count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Avg Profit</span>
                  <span className="font-semibold">
                    {fmt.currency0(monteCarloResults.avgProfit)}
                  </span>
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
