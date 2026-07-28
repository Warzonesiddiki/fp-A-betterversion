/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { runMonteCarlo as executeMonteCarlo } from '@/workers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Target, TrendingUp, BarChart3 } from 'lucide-react';

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

  const runMonteCarlo = () => {
    setLoading(true);
    setTimeout(() => {
      const sims = Array.from({ length: iterations }, () => {
        const revMultiplier = 0.8 + Math.random() * 0.4;
        const costMultiplier = 0.85 + Math.random() * 0.3;
        const base = actuals?.revenue || 1000000;
        const revenue = base * revMultiplier;
        const costs = (base * (variableCostPct / 100) + fixedCost) * costMultiplier;
        return { revenue, costs, profit: revenue - costs };
      });
      const profits = sims.map((s) => s.profit).sort((a, b) => a - b);
      const avgProfit = profits.reduce((s, p) => s + p, 0) / profits.length;
      const median = profits[Math.floor(profits.length / 2)];
      const p10 = profits[Math.floor(profits.length * 0.1)];
      const p90 = profits[Math.floor(profits.length * 0.9)];
      const positiveOutcomes = profits.filter((p) => p >= 0).length;
      setResults({
        simulations: sims,
        avgProfit,
        median,
        p10,
        p90,
        positivePct: (positiveOutcomes / iterations) * 100,
        count: iterations,
      });
      setLoading(false);
    }, 500);
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
