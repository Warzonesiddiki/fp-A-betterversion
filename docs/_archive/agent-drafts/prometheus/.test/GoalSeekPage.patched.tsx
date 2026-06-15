/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Target, TrendingUp, BarChart3 } from 'lucide-react';
import { runMonteCarlo as runMonteCarloWorker } from '@/workers';
import type { MonteCarloRequest } from '@/workers/types';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

export default function GoalSeekPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'goalseek' | 'montecarlo' | 'breakeven'>('breakeven');
  const [targetProfit, setTargetProfit] = useState(1000000);
  const [fixedCost, setFixedCost] = useState(500000);
  const [variableCostPct, setVariableCostPct] = useState(60);
  const [iterations, setIterations] = useState(1000);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const actuals = useMemo(() => {
    if (entries.length === 0) return null;
    const revenue = entries
      .filter((e) => (e.accountCode || '').startsWith('4'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const expenses = entries
      .filter((e) => (e.accountCode || '').startsWith('5') || (e.accountCode || '').startsWith('6'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    return { revenue, expenses, netIncome: revenue - expenses };
  }, [entries]);

  const runBreakeven = () => {
    const contributionMargin = 100 - variableCostPct;
    const beRevenue = contributionMargin > 0 ? fixedCost / (contributionMargin / 100) : 0;
    const revForTarget =
      contributionMargin > 0 ? (fixedCost + targetProfit) / (contributionMargin / 100) : 0;
    setResults({
      breakevenRevenue: beRevenue,
      revenueForTarget: revForTarget,
      contributionMargin,
      fixedCost,
      variableCostPct,
    });
  };

  const runMonteCarlo = async () => {
    setLoading(true);
    try {
      const baseRevenue = actuals?.revenue ?? 0;
      const baseCosts = (baseRevenue * (variableCostPct / 100)) + fixedCost;
      const req: MonteCarloRequest = {
        iterations,
        seed: Date.now(),
        assumptions: [
          { name: 'revenue', type: 'uniform', min: baseRevenue * 0.8, max: baseRevenue * 1.2 },
          { name: 'costs', type: 'uniform', min: baseCosts * 0.85, max: baseCosts * 1.15 },
        ],
      };
      const resp = await runMonteCarloWorker(req);
      const sims = resp.results.map((r) => ({
        revenue: r.values.revenue ?? 0,
        costs: r.values.costs ?? 0,
        profit: (r.values.revenue ?? 0) - (r.values.costs ?? 0),
      }));
      const profits = sims.map((s) => s.profit).sort((a, b) => a - b);
      const n = profits.length;
      const sum = profits.reduce((s, v) => s + v, 0);
      const avgProfit = n > 0 ? sum / n : 0;
      const median = n > 0 ? profits[Math.floor(n / 2)] : 0;
      const p10 = n > 0 ? profits[Math.floor(n * 0.1)] : 0;
      const p90 = n > 0 ? profits[Math.floor(n * 0.9)] : 0;
      const positivePct = n > 0 ? (profits.filter((p) => p > 0).length / n) * 100 : 0;
      setResults({
        simulations: sims,
        avgProfit,
        median,
        p10,
        p90,
        positivePct,
        count: n,
      });
    } catch (err) {
      console.error('Monte Carlo simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!actuals && mode !== 'breakeven') {
    return (
      <div className="p-12 text-center">
        <Target className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data for Monte Carlo simulations.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Financial Modeling</h1>
      <div className="flex gap-2">
        {['breakeven', 'goalseek', 'montecarlo'].map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m as typeof mode);
              setResults(null);
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
              <label className="block text-xs text-slate-400 mb-1">Fixed Costs</label>
              <Input
                type="number"
                value={fixedCost}
                onChange={(e) => setFixedCost(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Variable Cost (% of Revenue)
              </label>
              <Input
                type="number"
                value={variableCostPct}
                onChange={(e) => setVariableCostPct(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Target Profit (for goal seek)
              </label>
              <Input
                type="number"
                value={targetProfit}
                onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
              />
            </div>
            <Button onClick={runBreakeven}>Calculate</Button>
            {results && (
              <div className="space-y-2 text-sm pt-4 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Contribution Margin</span>
                  <span className="font-semibold">{results.contributionMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Break-Even Revenue</span>
                  <span className="font-semibold text-green-400">
                    {formatCurrency(results.breakevenRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Revenue for Target Profit</span>
                  <span className="font-semibold text-blue-400">
                    {formatCurrency(results.revenueForTarget)}
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
            <p className="text-sm text-slate-400">
              Base revenue: {actuals ? formatCurrency(actuals.revenue) : '$1,000,000'}
            </p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Iterations</label>
              <Input
                type="number"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value) || 100)}
              />
            </div>
            <Button onClick={runMonteCarlo} disabled={loading}>
              {loading ? 'Running...' : 'Run Simulation'}
            </Button>
            {loading && <Skeleton variant="rectangular" height="100px" />}
            {results && !loading && (
              <div className="space-y-2 text-sm pt-4 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Iterations</span>
                  <span>{results.count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Profit</span>
                  <span className="font-semibold">{formatCurrency(results.avgProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Median</span>
                  <span className="font-semibold">{formatCurrency(results.median)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">P10 / P90</span>
                  <span>
                    {formatCurrency(results.p10)} / {formatCurrency(results.p90)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Positive Outcomes</span>
                  <span
                    className={
                      'font-semibold ' +
                      (results.positivePct > 50 ? 'text-green-400' : 'text-red-400')
                    }
                  >
                    {results.positivePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
