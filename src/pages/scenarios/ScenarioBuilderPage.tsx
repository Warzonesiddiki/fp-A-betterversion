import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenarioStore } from '@/store/scenarioStore';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable } from '@/components/ui/DataTable';
import { FileText, Table as TableIcon, Save } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  roundTo,
  sumMoney,
  subtractMoney,
  multiplyMoney,
  divideMoney,
  toDecimal,
} from '@/utils/money';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { VarianceChart } from '@/components/charts/VarianceChart';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact } from '@/utils/financialFormatting';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const baseMetrics = {
  revenue: 48000000,
  cogs: 28800000,
  opex: 14400000,
  headcount: 240,
  avgSalary: 85000,
};

const comparisonData = [
  { month: 'Jan', base: 4000000, scenario: 4200000 },
  { month: 'Feb', base: 3800000, scenario: 4100000 },
  { month: 'Mar', base: 4200000, scenario: 4600000 },
  { month: 'Apr', base: 4100000, scenario: 4500000 },
  { month: 'May', base: 4300000, scenario: 4800000 },
  { month: 'Jun', base: 4400000, scenario: 5000000 },
];

const sensitivityData = [
  { parameter: 'Revenue Growth', low: -5, base: 0, high: 15 },
  { parameter: 'COGS %', low: -2, base: 0, high: 5 },
  { parameter: 'Headcount', low: -10, base: 0, high: 30 },
  { parameter: 'Avg Salary', low: -3, base: 0, high: 8 },
];

export interface ScenarioComparisonInput {
  baseRevenue: number;
  cogs: number;
  growthRatePct: number;
  pricingChangePct: number;
  cogsChangePct: number;
  headcountChange: number;
  avgSalary: number;
  probabilityPct: number;
}

export interface ScenarioComparisonResult {
  baseRevenue: number;
  scenarioRevenue: number;
  revenueVariance: number;
  variancePct: number;
  cogsImpact: number;
  opexImpact: number;
  netImpact: number;
  newCogs: number;
  newOpex: number;
  newRevenue: number;
  probabilityWeightedRevenue: number;
  probabilityWeightedNet: number;
}

/**
 * Exact money primitive — simulate scenario comparison.
 *
 * Revenue: base × (1 + growth% + pricing%)
 * COGS modifier: cogs × cogsChange%
 * OPEX headcount: headcountChange × avgSalary
 * Variance: scenarioRevenue − baseRevenue, variancePct
 * Probability-weighted: scenarioRevenue × probability%
 */
export function simulateScenarioComparison(
  input: ScenarioComparisonInput
): ScenarioComparisonResult {
  const baseRev = toDecimal(input.baseRevenue);
  const growth = divideMoney(input.growthRatePct, 100);
  const pricing = divideMoney(input.pricingChangePct, 100);
  const cogsPct = divideMoney(input.cogsChangePct, 100);
  const prob = divideMoney(input.probabilityPct, 100);

  const revenueGrowth = multiplyMoney(baseRev, growth);
  const pricingImpact = multiplyMoney(baseRev, pricing);
  const newRevenueDec = baseRev.plus(revenueGrowth).plus(pricingImpact);
  const newRevenue = roundTo(newRevenueDec);

  const cogsImpactDec = multiplyMoney(input.cogs, cogsPct);
  const cogsImpact = roundTo(cogsImpactDec);
  const newCogs = roundTo(toDecimal(input.cogs).plus(cogsImpactDec));

  const opexImpactDec = multiplyMoney(input.headcountChange, input.avgSalary);
  const opexImpact = roundTo(opexImpactDec);
  const newOpex = roundTo(toDecimal(baseMetrics.opex).plus(opexImpactDec));

  const revenueVarianceDec = subtractMoney(newRevenue, input.baseRevenue);
  const revenueVariance = roundTo(revenueVarianceDec);
  const variancePct =
    input.baseRevenue === 0
      ? 0
      : roundTo(multiplyMoney(divideMoney(revenueVariance, input.baseRevenue), 100));

  const totalRevenueChange = roundTo(revenueGrowth.plus(pricingImpact));
  const totalCostChange = roundTo(cogsImpactDec.plus(opexImpactDec));
  const netImpact = roundTo(subtractMoney(totalRevenueChange, totalCostChange));

  const probabilityWeightedRevenue = roundTo(multiplyMoney(newRevenue, prob));
  const probabilityWeightedNet = roundTo(multiplyMoney(netImpact, prob));

  return {
    baseRevenue: input.baseRevenue,
    scenarioRevenue: newRevenue,
    revenueVariance,
    variancePct,
    cogsImpact,
    opexImpact,
    netImpact,
    newCogs,
    newOpex,
    newRevenue,
    probabilityWeightedRevenue,
    probabilityWeightedNet,
  };
}

export default function ScenarioBuilderPage() {
  const { scenarios, createScenario } = useScenarioStore();

  const _navigate = useNavigate();

  const [growthRate, setGrowthRate] = useState(10);
  const [headcountChange, setHeadcountChange] = useState(20);
  const [pricingChange, setPricingChange] = useState(5);
  const [cogsChange, setCogsChange] = useState(-2);
  const [probability, setProbability] = useState(60);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro — Scenario Builder';
  }, []);

  const scenarioComparison = useMemo(
    () =>
      simulateScenarioComparison({
        baseRevenue: baseMetrics.revenue,
        cogs: baseMetrics.cogs,
        growthRatePct: growthRate,
        pricingChangePct: pricingChange,
        cogsChangePct: cogsChange,
        headcountChange,
        avgSalary: baseMetrics.avgSalary,
        probabilityPct: probability,
      }),
    [growthRate, headcountChange, pricingChange, cogsChange, probability]
  );

  // Recompute costImpact correctly with money primitive for KPIs
  const costImpactExact = useMemo(
    () => roundTo(sumMoney([scenarioComparison.cogsImpact, scenarioComparison.opexImpact])),
    [scenarioComparison]
  );

  const scenarioImpact = useMemo(() => {
    return {
      revenueImpact: scenarioComparison.revenueVariance,
      costImpact: costImpactExact,
      netImpact: scenarioComparison.netImpact,
      newRevenue: scenarioComparison.newRevenue,
      newOpex: scenarioComparison.newOpex,
      newCogs: scenarioComparison.newCogs,
      probabilityWeightedRevenue: scenarioComparison.probabilityWeightedRevenue,
      probabilityWeightedNet: scenarioComparison.probabilityWeightedNet,
      variancePct: scenarioComparison.variancePct,
      revenueVariance: scenarioComparison.revenueVariance,
    };
  }, [scenarioComparison, costImpactExact]);

  const handleSave = () => {
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
        assumptions: [
          {
            id: 'growth',
            name: 'Growth Rate',
            driverType: 'percentage',
            baseValue: 10,
            currentValue: growthRate,
            minValue: -50,
            maxValue: 100,
            stepSize: 1,
            unit: '%',
            affectedAccountIds: [],
          },
          {
            id: 'hc',
            name: 'Headcount Change',
            driverType: 'absolute',
            baseValue: 0,
            currentValue: headcountChange,
            minValue: -100,
            maxValue: 100,
            stepSize: 1,
            unit: 'FTE',
            affectedAccountIds: [],
          },
          {
            id: 'pricing',
            name: 'Pricing Change',
            driverType: 'percentage',
            baseValue: 0,
            currentValue: pricingChange,
            minValue: -50,
            maxValue: 50,
            stepSize: 1,
            unit: '%',
            affectedAccountIds: [],
          },
          {
            id: 'cogs',
            name: 'COGS Change',
            driverType: 'percentage',
            baseValue: 0,
            currentValue: cogsChange,
            minValue: -50,
            maxValue: 50,
            stepSize: 1,
            unit: '%',
            affectedAccountIds: [],
          },
        ],
        calculatedMetrics: {
          revenue: scenarioImpact.newRevenue,
          opex: scenarioImpact.newOpex,
          cogs: scenarioImpact.newCogs,
          grossProfit: scenarioImpact.newRevenue - scenarioImpact.newCogs,
          netIncome: scenarioImpact.newRevenue - scenarioImpact.newCogs - scenarioImpact.newOpex,
          ebitda: scenarioImpact.newRevenue - scenarioImpact.newCogs - scenarioImpact.newOpex,
        },
        createdBy: 'user',
        createdByName: 'User',
      } as unknown as Parameters<typeof createScenario>[0]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save scenario');
    }
  };

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Parameter', 'Base', 'Scenario', 'Impact'],
        rows: [
          [
            'Revenue',
            formatCurrency(baseMetrics.revenue),
            formatCurrency(scenarioComparison.newRevenue),
            formatCurrency(scenarioComparison.revenueVariance),
          ],
          [
            'COGS',
            formatCurrency(baseMetrics.cogs),
            formatCurrency(scenarioComparison.newCogs),
            formatCurrency(scenarioComparison.cogsImpact),
          ],
          [
            'OpEx',
            formatCurrency(baseMetrics.opex),
            formatCurrency(scenarioComparison.newOpex),
            formatCurrency(scenarioComparison.opexImpact),
          ],
          ['Net Impact', '', '', formatCurrency(scenarioComparison.netImpact)],
          [
            'Prob. Weighted Rev',
            '',
            formatCurrency(scenarioComparison.probabilityWeightedRevenue),
            `${probability}% prob`,
          ],
          [
            'Revenue Variance',
            formatCurrency(baseMetrics.revenue),
            formatCurrency(scenarioComparison.newRevenue),
            `${scenarioComparison.variancePct}%`,
          ],
        ],
      },
      { title: 'Scenario Analysis' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Parameter', 'Base', 'Scenario', 'Impact'],
        rows: [
          [
            'Revenue',
            baseMetrics.revenue,
            scenarioComparison.newRevenue,
            scenarioComparison.revenueVariance,
          ],
          ['COGS', baseMetrics.cogs, scenarioComparison.newCogs, scenarioComparison.cogsImpact],
          ['OpEx', baseMetrics.opex, scenarioComparison.newOpex, scenarioComparison.opexImpact],
          ['ProbWeightedRev', '', scenarioComparison.probabilityWeightedRevenue, probability],
          ['VariancePct', scenarioComparison.variancePct, '', ''],
        ],
      },
      { title: 'Scenario_Analysis' }
    ).catch(reportExportFailure);
  };

  return (
    <main className="p-6 space-y-6" aria-labelledby="scenario-builder-heading">
      {saveError && (
        <div
          className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-400"
          role="alert"
          aria-live="assertive"
        >
          {saveError}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 id="scenario-builder-heading" className="text-2xl font-bold">
            Scenario Builder
          </h1>
          <p className="text-sm text-slate-400 mt-1">Model assumptions and compare outcomes</p>
        </div>
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
      </div>

      <div
        className="grid grid-cols-4 gap-4"
        role="region"
        aria-label="Scenario impact key performance indicators"
        data-testid="scenario-kpis"
      >
        <KPIValue
          label="Revenue Impact"
          value={formatCurrency(scenarioComparison.revenueVariance)}
          trend="up"
        />
        <KPIValue label="Cost Impact" value={formatCurrency(costImpactExact)} trend="down" />
        <KPIValue
          label="Net Impact"
          value={formatCurrency(scenarioComparison.netImpact)}
          trend={scenarioComparison.netImpact >= 0 ? 'up' : 'down'}
        />
        <KPIValue label="Scenarios Saved" value={String(scenarios.length)} />
      </div>

      {/* Probability weighting KPIs */}
      <div className="grid grid-cols-2 gap-4" data-testid="probability-kpis">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">
              Prob. Weighted Rev
            </div>
            <div className="text-xl font-black tabular-nums" data-testid="prob-weighted-rev">
              {formatCurrency(scenarioComparison.probabilityWeightedRevenue)}
            </div>
            <div className="text-xs text-slate-500">{probability}% probability</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">
              Revenue Variance
            </div>
            <div className="text-xl font-black tabular-nums" data-testid="revenue-variance">
              {formatCurrency(scenarioComparison.revenueVariance)}
            </div>
            <div className="text-xs text-slate-500">{scenarioComparison.variancePct}% vs base</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assumption Sliders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            ].map(({ label, value, set, min, max, suffix }) => {
              const valueId = `slider-value-${label.toLowerCase().replace(/\s+/g, '-')}`;
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <label htmlFor={valueId} className="text-slate-300">
                      {label}
                    </label>
                    <span id={valueId} className="text-white font-mono" aria-live="polite">
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
                <label htmlFor="prob-slider" className="text-slate-300">
                  Probability Weight
                </label>
                <span id="prob-slider-value" className="text-white font-mono" aria-live="polite">
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
              <p className="text-xs text-slate-500 mt-1">
                Weights scenario outcomes for expected value
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Base vs Scenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              role="img"
              aria-label="Base versus scenario monthly comparison bar chart from January to June. Each month shows two bars: base case (gray) and scenario case (blue) in US dollars."
            >
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${formatCompact(v)}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    formatter={(v) => formatCurrency(Number(v))}
                  />
                  <Legend />
                  <Bar dataKey="base" fill="#64748b" name="Base" />
                  <Bar dataKey="scenario" fill="#3b82f6" name="Scenario" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Variance</CardTitle>
        </CardHeader>
        <CardContent>
          <VarianceChart
            data={comparisonData.map((d) => ({
              name: d.month,
              budget: d.base,
              actual: d.scenario,
            }))}
            height={200}
            ariaLabel="Scenario variance chart comparing base vs scenario"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sensitivity Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            caption="Scenario sensitivity analysis: low, base, and high case impact percentages for each parameter"
            ariaLabel="Scenario sensitivity analysis table"
            columns={[
              { key: 'parameter', header: 'Parameter' },
              { key: 'low', header: 'Low Case', align: 'right', render: (v) => `${v}%` },
              { key: 'base', header: 'Base Case', align: 'right', render: (v) => `${v}%` },
              { key: 'high', header: 'High Case', align: 'right', render: (v) => `${v}%` },
            ]}
            data={sensitivityData as unknown as Record<string, unknown>[]}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </main>
  );
}
