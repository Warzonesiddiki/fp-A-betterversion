import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenarioStore } from '@/store/scenarioStore';
import { useGLStore } from '@/store/glStore';
import { runMonteCarlo } from '@/workers';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { FileText, Table as TableIcon, Save } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { addMoney, compareMoney, divideMoney, multiplyMoney, roundTo } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  deriveScenarioBase,
  profitFromScenarioDraw,
  scenarioGrossProfit,
  scenarioNetIncome,
  shockStdDev,
  simulateScenarioComparison,
  summarizeScenarioDraws,
  type OutcomeSummary,
} from './scenarioBuilderModel';

export { simulateScenarioComparison } from './scenarioBuilderModel';
export type { ScenarioComparisonInput, ScenarioComparisonResult } from './scenarioBuilderModel';

export default function ScenarioBuilderPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const { entries } = useGLStore();
  const { scenarios, createScenario } = useScenarioStore();

  const [growthRate, setGrowthRate] = useState(10);
  const [headcountChange, setHeadcountChange] = useState(0);
  const [pricingChange, setPricingChange] = useState(5);
  const [cogsChange, setCogsChange] = useState(-2);
  const [probability, setProbability] = useState(60);
  const [avgSalary, setAvgSalary] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mcLoading, setMcLoading] = useState(false);
  const [mcError, setMcError] = useState<string | null>(null);
  const [mcIterations, setMcIterations] = useState(2000);
  const [mcResults, setMcResults] = useState<OutcomeSummary | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro — Scenario Builder';
  }, []);

  const base = useMemo(() => deriveScenarioBase(entries), [entries]);

  const scenarioComparison = useMemo(
    () =>
      base
        ? simulateScenarioComparison({
            baseRevenue: base.revenue,
            cogs: base.cogs,
            opex: base.opex,
            growthRatePct: growthRate,
            pricingChangePct: pricingChange,
            cogsChangePct: cogsChange,
            headcountChange,
            avgSalary,
            probabilityPct: probability,
          })
        : null,
    [base, growthRate, headcountChange, pricingChange, cogsChange, avgSalary, probability]
  );

  const handleSave = () => {
    if (!scenarioComparison) return;
    setSaveError(null);
    try {
      createScenario({
        name: `Scenario ${scenarios.length + 1}`,
        description: `Growth ${growthRate}%, HC +${headcountChange}, Pricing +${pricingChange}%, COGS ${cogsChange}%, Prob ${probability}%`,
        baseBudgetId: '',
        baseBudgetName: '',
        type: 'Custom' as const,
        probability: probability / 100,
        isActive: true,
        assumptions: [],
        calculatedMetrics: {
          revenue: scenarioComparison.newRevenue,
          opex: scenarioComparison.newOpex,
          cogs: scenarioComparison.newCogs,
          grossProfit: scenarioGrossProfit(
            scenarioComparison.newRevenue,
            scenarioComparison.newCogs
          ),
          netIncome: scenarioNetIncome(
            scenarioComparison.newRevenue,
            scenarioComparison.newCogs,
            scenarioComparison.newOpex
          ),
          ebitda: scenarioNetIncome(
            scenarioComparison.newRevenue,
            scenarioComparison.newCogs,
            scenarioComparison.newOpex
          ),
        },
        createdBy: 'user',
        createdByName: 'User',
      } as unknown as Parameters<typeof createScenario>[0]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save scenario');
    }
  };

  const handleRunMonteCarlo = async () => {
    if (!scenarioComparison) return;
    setMcLoading(true);
    setMcError(null);
    setMcResults(null);
    try {
      const response = await runMonteCarlo({
        iterations: mcIterations,
        seed: Math.floor(Math.random() * 2 ** 31),
        assumptions: [
          {
            name: 'growthPct',
            type: 'normal',
            mean: growthRate,
            stdDev: shockStdDev(growthRate, 0.3),
          },
          { name: 'cogsPct', type: 'normal', mean: cogsChange, stdDev: 1.5 },
          { name: 'pricingPct', type: 'normal', mean: pricingChange, stdDev: 2 },
        ],
      });
      const samples = response.results.map((r) =>
        profitFromScenarioDraw({
          revenue: scenarioComparison.newRevenue,
          cogs: scenarioComparison.newCogs,
          opex: scenarioComparison.newOpex,
          growthPct: r.values.growthPct ?? 0,
          pricingPct: r.values.pricingPct ?? 0,
          cogsPct: r.values.cogsPct ?? 0,
        })
      );
      if (samples.length === 0) throw new Error('Monte Carlo returned no samples');
      setMcResults(summarizeScenarioDraws(samples));
    } catch (err) {
      setMcError(err instanceof Error ? err.message : 'Monte Carlo simulation failed');
    } finally {
      setMcLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!scenarioComparison || !base) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['Parameter', 'Base', 'Scenario', 'Impact'],
        rows: [
          [
            'Revenue',
            fmt.currency0(base.revenue),
            fmt.currency0(scenarioComparison.newRevenue),
            fmt.currency0(scenarioComparison.revenueVariance),
          ],
          [
            'COGS',
            fmt.currency0(base.cogs),
            fmt.currency0(scenarioComparison.newCogs),
            fmt.currency0(scenarioComparison.cogsImpact),
          ],
          [
            'OpEx',
            fmt.currency0(base.opex),
            fmt.currency0(scenarioComparison.newOpex),
            fmt.currency0(scenarioComparison.opexImpact),
          ],
          ['Net Impact', '', '', fmt.currency0(scenarioComparison.netImpact)],
        ],
      },
      { title: 'Scenario Analysis' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!scenarioComparison || !base) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Parameter', 'Base', 'Scenario', 'Impact'],
        rows: [
          [
            'Revenue',
            base.revenue,
            scenarioComparison.newRevenue,
            scenarioComparison.revenueVariance,
          ],
          ['COGS', base.cogs, scenarioComparison.newCogs, scenarioComparison.cogsImpact],
          ['OpEx', base.opex, scenarioComparison.newOpex, scenarioComparison.opexImpact],
        ],
      },
      { title: 'Scenario_Analysis' }
    ).catch(reportExportFailure);
  };

  if (!base || !scenarioComparison) {
    // K30 four-states: shared EmptyState under the page-level h1 (PageHeader
    // stays mounted in this branch). The CTA re-enters the import flow; no
    // demo revenue base is invented.
    return (
      <div className="p-6 space-y-6 max-w-7xl" aria-labelledby="scenario-builder-heading">
        <PageHeader
          title="Scenario Builder"
          titleId="scenario-builder-heading"
          purpose="Apply user-stated shocks to posted General Ledger actuals. Headcount cost is omitted until a salary is entered."
        />
        <EmptyState
          variant="no-data"
          title="No scenario builder data"
          description="Import General Ledger entries to set the scenario base from posted revenue, COGS and operating expenses. A demo revenue base is not invented."
          action={
            <Button onClick={() => navigate('/data/gl-upload')} data-testid="scenario-empty-import">
              Import Data
            </Button>
          }
        />
      </div>
    );
  }

  const costImpact = roundTo(
    addMoney(scenarioComparison.cogsImpact, scenarioComparison.opexImpact)
  );
  // Share of the posted cost base (COGS + OpEx) that the scenario moves —
  // feeds the Cost Impact card's change badge. Derived, never invented; zero
  // posted costs leave no percentage to state.
  const baseCosts = addMoney(base.cogs, base.opex);
  const costImpactPct =
    compareMoney(baseCosts, 0) === 0
      ? 0
      : roundTo(multiplyMoney(divideMoney(costImpact, baseCosts), 100));

  return (
    <main className="p-6 space-y-6" aria-labelledby="scenario-builder-heading">
      {saveError && (
        // K30 four-states: shared ErrorState (role=alert) whose retry control
        // re-runs exactly the failed save.
        <ErrorState
          title="Could not save scenario"
          message={saveError}
          onRetry={handleSave}
          retryLabel="Retry save"
          className="py-8"
        />
      )}
      <PageHeader
        title="Scenario Builder"
        titleId="scenario-builder-heading"
        purpose="Apply user-stated shocks to posted General Ledger actuals. Headcount cost is omitted until a salary is entered."
        actions={
          <div className="flex gap-2" role="group" aria-label="Scenario actions">
            <Button
              size="sm"
              onClick={handleSave}
              aria-label="Save scenario"
              data-testid="save-scenario"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Save Scenario
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExportPDF}
              aria-label="Export scenario as PDF"
              data-testid="export-scenario-pdf"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExportExcel}
              aria-label="Export scenario as Excel"
              data-testid="export-scenario-excel"
            >
              <TableIcon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Excel
            </Button>
          </div>
        }
      />

      <div
        className="grid grid-cols-4 gap-4"
        role="region"
        aria-label="Scenario impact key performance indicators"
        data-testid="scenario-kpis"
      >
        {/* K18: trend direction is computed from the sign of the derived
            impact, never hardcoded — a negative revenue shock must not point
            up. `change` carries the real derived percentage so the shared
            KPIValue renders the directional badge at all. */}
        <KPIValue
          label="Revenue Impact"
          value={fmt.currency0(scenarioComparison.revenueVariance)}
          change={scenarioComparison.variancePct}
          trend={compareMoney(scenarioComparison.revenueVariance, 0) >= 0 ? 'up' : 'down'}
        />
        <KPIValue
          label="Cost Impact"
          value={fmt.currency0(costImpact)}
          change={costImpactPct}
          trend={compareMoney(costImpact, 0) >= 0 ? 'up' : 'down'}
        />
        <KPIValue
          label="Net Impact"
          value={fmt.currency0(scenarioComparison.netImpact)}
          trend={compareMoney(scenarioComparison.netImpact, 0) >= 0 ? 'up' : 'down'}
        />
        <KPIValue label="Scenarios Saved" value={String(scenarios.length)} />
      </div>

      <div className="grid grid-cols-2 gap-4" data-testid="probability-kpis">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
              Prob. Weighted Rev
            </div>
            <div className="text-xl font-black tabular-nums" data-testid="prob-weighted-rev">
              {fmt.currency0(scenarioComparison.probabilityWeightedRevenue)}
            </div>
            <div className="text-xs text-[var(--text-muted)]">{probability}% probability</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
              Revenue Variance
            </div>
            <div className="text-xl font-black tabular-nums" data-testid="revenue-variance">
              {fmt.currency0(scenarioComparison.revenueVariance)}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {formatPercent(scenarioComparison.variancePct, 1)} vs posted base
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="monte-carlo-card">
        <CardHeader>
          <CardTitle>Monte Carlo Simulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Samples growth, pricing and COGS shocks around the current scenario (
            {mcIterations.toLocaleString()} iterations). The distribution is not invented.
          </p>
          <div className="flex items-center gap-3">
            <label htmlFor="mc-iterations" className="text-xs text-[var(--text-muted)]">
              Iterations
            </label>
            <input
              id="mc-iterations"
              type="number"
              min={100}
              max={100000}
              value={mcIterations}
              onChange={(e) => setMcIterations(Math.max(100, Number(e.target.value) || 2000))}
              className="w-28 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200"
              aria-label="Monte Carlo iterations"
            />
            <Button
              onClick={handleRunMonteCarlo}
              disabled={mcLoading}
              aria-label="Run Monte Carlo simulation"
              data-testid="run-monte-carlo"
            >
              {mcLoading ? 'Running...' : 'Run Monte Carlo'}
            </Button>
          </div>
          {mcError && (
            // K30 four-states: shared ErrorState whose retry re-runs the
            // simulation with the current assumptions.
            <ErrorState
              title="Monte Carlo simulation failed"
              message={mcError}
              onRetry={() => void handleRunMonteCarlo()}
              retryLabel="Retry simulation"
              className="py-8"
            />
          )}
          {mcLoading && (
            // K30 four-states: visible in-flight skeleton region (the run
            // button stays disabled via mcLoading; announced to assistive tech).
            <div data-testid="scenario-mc-skeleton" aria-busy="true" className="space-y-2">
              <Skeleton count={1} height="20px" width="35%" />
              <Skeleton count={4} variant="text" height="16px" />
            </div>
          )}
          {mcResults && (
            <div
              className="grid grid-cols-2 sm:grid-cols-5 gap-3"
              data-testid="monte-carlo-results"
            >
              <div className="rounded-lg bg-[var(--bg-elevated)] p-3 text-center">
                <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  Avg Profit
                </div>
                <div className="text-lg font-black tabular-nums" data-testid="mc-avg">
                  {fmt.currency0(mcResults.average)}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-elevated)] p-3 text-center">
                <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  Median
                </div>
                <div className="text-lg font-black tabular-nums" data-testid="mc-median">
                  {fmt.currency0(mcResults.median)}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-elevated)] p-3 text-center">
                <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  P10
                </div>
                <div className="text-lg font-black tabular-nums text-red-400" data-testid="mc-p10">
                  {fmt.currency0(mcResults.p10)}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-elevated)] p-3 text-center">
                <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  P90
                </div>
                <div
                  className="text-lg font-black tabular-nums text-emerald-400"
                  data-testid="mc-p90"
                >
                  {fmt.currency0(mcResults.p90)}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-elevated)] p-3 text-center">
                <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  Profit &gt; 0
                </div>
                <div className="text-lg font-black tabular-nums" data-testid="mc-positive">
                  {formatPercent(mcResults.positivePct, 1)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assumption Sliders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Posted base — revenue {fmt.currency0(base.revenue)}, COGS {fmt.currency0(base.cogs)},
            OpEx {fmt.currency0(base.opex)}.
          </p>
          {[
            {
              label: 'Revenue Growth Rate',
              value: growthRate,
              set: setGrowthRate,
              min: -20,
              max: 50,
              suffix: '%',
            },
            {
              label: 'Headcount Change',
              value: headcountChange,
              set: setHeadcountChange,
              min: -50,
              max: 100,
              suffix: '',
            },
            {
              label: 'Pricing Change',
              value: pricingChange,
              set: setPricingChange,
              min: -20,
              max: 30,
              suffix: '%',
            },
            {
              label: 'COGS Change',
              value: cogsChange,
              set: setCogsChange,
              min: -20,
              max: 20,
              suffix: '%',
            },
            {
              label: 'Average Salary (headcount cost)',
              value: avgSalary,
              set: setAvgSalary,
              min: 0,
              max: 500000,
              suffix: '',
            },
          ].map(({ label, value, set, min, max, suffix }) => {
            const valueId = `slider-value-${label.toLowerCase().replace(/\s+/g, '-')}`;
            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <label htmlFor={valueId} className="text-[var(--text-secondary)]">
                    {label}
                  </label>
                  <span
                    id={valueId}
                    className="text-[var(--text-primary)] font-mono"
                    aria-live="polite"
                  >
                    {value}
                    {suffix}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={value}
                  onChange={(e) => set(Number(e.target.value))}
                  className="w-full accent-blue-500"
                  aria-label={label}
                  aria-valuetext={`${value} ${suffix || 'units'} (range ${min} to ${max})`}
                  data-testid={`slider-${label.toLowerCase().replace(/\s+/g, '-')}`}
                />
              </div>
            );
          })}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex justify-between text-sm mb-1">
              <label htmlFor="prob-slider" className="text-[var(--text-secondary)]">
                Probability Weight
              </label>
              <span
                id="prob-slider-value"
                className="text-[var(--text-primary)] font-mono"
                aria-live="polite"
              >
                {probability}%
              </span>
            </div>
            <input
              id="prob-slider"
              type="range"
              min={0}
              max={100}
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="w-full accent-purple-500"
              aria-label="Probability Weight"
              aria-valuetext={`${probability}% (range 0 to 100)`}
              data-testid="slider-probability"
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
