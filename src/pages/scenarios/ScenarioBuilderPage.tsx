import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenarioStore } from '@/store/scenarioStore';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { TrendingUp, Plus, Download, FileText, Table as TableIcon, Play, Save } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { AssumptionEngine } from '@/engines/AssumptionEngine';
import { SensitivityTableEngine } from '@/engines/SensitivityTableEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { VarianceChart } from '@/components/charts/VarianceChart';

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

export default function ScenarioBuilderPage() {
  const { scenarios, createScenario } = useScenarioStore();
  const { entries } = useGLStore();
  const navigate = useNavigate();

  const [growthRate, setGrowthRate] = useState(10);
  const [headcountChange, setHeadcountChange] = useState(20);
  const [pricingChange, setPricingChange] = useState(5);
  const [cogsChange, setCogsChange] = useState(-2);

  useEffect(() => {
    document.title = 'FinPlan Pro — Scenario Builder';
  }, []);

  const scenarioImpact = useMemo(() => {
    const revenueImpact = baseMetrics.revenue * (growthRate / 100);
    const pricingImpact = baseMetrics.revenue * (pricingChange / 100);
    const headcountCost = headcountChange * baseMetrics.avgSalary;
    const cogsImpact = baseMetrics.cogs * (cogsChange / 100);
    const totalRevenueChange = revenueImpact + pricingImpact;
    const totalCostChange = headcountCost + cogsImpact;
    const netImpact = totalRevenueChange - totalCostChange;
    return {
      revenueImpact: totalRevenueChange,
      costImpact: totalCostChange,
      netImpact,
      newRevenue: baseMetrics.revenue + totalRevenueChange,
      newOpex: baseMetrics.opex + headcountCost,
      newCogs: baseMetrics.cogs + cogsImpact,
    };
  }, [growthRate, headcountChange, pricingChange, cogsChange]);

  const handleSave = () => {
    createScenario({
      name: `Scenario ${scenarios.length + 1}`,
      description: `Growth ${growthRate}%, HC +${headcountChange}, Pricing +${pricingChange}%, COGS ${cogsChange}%`,
      assumptions: { growthRate, headcountChange, pricingChange, cogsChange },
      results: {
        revenue: scenarioImpact.newRevenue,
        opex: scenarioImpact.newOpex,
        cogs: scenarioImpact.newCogs,
      },
      status: 'draft',
    });
  };

  const handleExportPDF = () => {
    ExportEngine.exportToPDF(
      {
        headers: ['Parameter', 'Base', 'Scenario', 'Impact'],
        rows: [
          [
            'Revenue',
            formatCurrency(baseMetrics.revenue),
            formatCurrency(scenarioImpact.newRevenue),
            formatCurrency(scenarioImpact.revenueImpact),
          ],
          [
            'COGS',
            formatCurrency(baseMetrics.cogs),
            formatCurrency(scenarioImpact.newCogs),
            formatCurrency(scenarioImpact.newCogs - baseMetrics.cogs),
          ],
          [
            'OpEx',
            formatCurrency(baseMetrics.opex),
            formatCurrency(scenarioImpact.newOpex),
            formatCurrency(scenarioImpact.newOpex - baseMetrics.opex),
          ],
          ['Net Impact', '', '', formatCurrency(scenarioImpact.netImpact)],
        ],
      },
      { title: 'Scenario Analysis' }
    );
  };

  const handleExportExcel = () => {
    ExportEngine.exportToExcel(
      {
        headers: ['Parameter', 'Base', 'Scenario', 'Impact'],
        rows: [
          ['Revenue', baseMetrics.revenue, scenarioImpact.newRevenue, scenarioImpact.revenueImpact],
          [
            'COGS',
            baseMetrics.cogs,
            scenarioImpact.newCogs,
            scenarioImpact.newCogs - baseMetrics.cogs,
          ],
          [
            'OpEx',
            baseMetrics.opex,
            scenarioImpact.newOpex,
            scenarioImpact.newOpex - baseMetrics.opex,
          ],
        ],
      },
      { title: 'Scenario_Analysis' }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scenario Builder</h1>
          <p className="text-sm text-slate-400 mt-1">Model assumptions and compare outcomes</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Scenario
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportPDF}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportExcel}>
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPIValue
          label="Revenue Impact"
          value={formatCurrency(scenarioImpact.revenueImpact)}
          trend="up"
        />
        <KPIValue
          label="Cost Impact"
          value={formatCurrency(scenarioImpact.costImpact)}
          trend="down"
        />
        <KPIValue
          label="Net Impact"
          value={formatCurrency(scenarioImpact.netImpact)}
          trend={scenarioImpact.netImpact >= 0 ? 'up' : 'down'}
        />
        <KPIValue label="Scenarios Saved" value={String(scenarios.length)} />
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
            ].map(({ label, value, set, min, max, suffix }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{label}</span>
                  <span className="text-white font-mono">
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
                />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Base vs Scenario</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v: any) => formatCurrency(v)}
                />
                <Legend />
                <Bar dataKey="base" fill="#64748b" name="Base" />
                <Bar dataKey="scenario" fill="#3b82f6" name="Scenario" />
              </BarChart>
            </ResponsiveContainer>
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
    </div>
  );
}
