import { useCallback, useMemo, useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  RotateCcw,
  Zap,
  TrendingUp,
  TrendingDown,
  Copy,
  ArrowRight,
  Layers,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { WhatIfSandboxEngine, type Sandbox } from '@/engines/WhatIfSandboxEngine';
import { BreakEvenEngine } from '@/engines/BreakEvenEngine';
import { SolverEngine } from '@/engines/SolverEngine';
import { type SandboxModification, type SandboxComparison } from '@/engines/WhatIfSandboxEngine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

// Default assumptions for demo
const DEFAULT_ASSUMPTIONS = [
  {
    label: 'Revenue Growth',
    key: 'revenue-growth',
    min: -50,
    max: 100,
    step: 1,
    default: 10,
    unit: '%',
  },
  {
    label: 'COGS % of Revenue',
    key: 'cogs-pct',
    min: 0,
    max: 100,
    step: 1,
    default: 40,
    unit: '%',
  },
  { label: 'OpEx Growth', key: 'opex-growth', min: -50, max: 100, step: 1, default: 5, unit: '%' },
  {
    label: 'Headcount Change',
    key: 'headcount',
    min: -50,
    max: 200,
    step: 1,
    default: 0,
    unit: '',
  },
  {
    label: 'Price Increase',
    key: 'price-increase',
    min: 0,
    max: 50,
    step: 0.5,
    default: 0,
    unit: '%',
  },
  {
    label: 'Marketing Spend',
    key: 'marketing',
    min: 0,
    max: 5000000,
    step: 10000,
    default: 1000000,
    unit: '$',
  },
];

export default function WhatIfPage() {
  const [engine] = useState(() => new WhatIfSandboxEngine());
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([]);
  const [activeSandboxId, setActiveSandboxId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<SandboxComparison | null>(null);
  const [compareTargetId, setCompareTargetId] = useState<string | null>(null);
  const [assumptions, setAssumptions] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_ASSUMPTIONS.map((a) => [a.key, a.default]))
  );

  const activeSandbox = useMemo(
    () => sandboxes.find((s) => s.id === activeSandboxId) ?? null,
    [sandboxes, activeSandboxId]
  );

  const handleCreateSandbox = useCallback(() => {
    const name = `Scenario ${sandboxes.length + 1}`;
    const baseCells = new Map<string, number>();
    // Initialize with default values
    for (const a of DEFAULT_ASSUMPTIONS) {
      baseCells.set(a.key, a.default);
    }
    const sandbox = engine.createSandbox(name, undefined, 'base', baseCells);
    setSandboxes(engine.listSandboxes());
    setActiveSandboxId(sandbox.id);
    setComparison(null);
  }, [engine, sandboxes.length]);

  const handleAssumptionChange = useCallback(
    (key: string, value: number) => {
      setAssumptions((prev) => ({ ...prev, [key]: value }));
      if (activeSandboxId) {
        engine.applyModification(activeSandboxId, 'assumptions', { key }, 'value', value);
        setSandboxes(engine.listSandboxes());
      }
    },
    [engine, activeSandboxId]
  );

  const handleClone = useCallback(
    (sourceId: string) => {
      const source = engine.getSandbox(sourceId);
      if (!source) return;
      const clone = engine.cloneSandbox(sourceId, `${source.name} (copy)`);
      setSandboxes(engine.listSandboxes());
      setActiveSandboxId(clone.id);
      setComparison(null);
    },
    [engine]
  );

  const handleDelete = useCallback(
    (id: string) => {
      engine.deleteSandbox(id);
      setSandboxes(engine.listSandboxes());
      if (activeSandboxId === id) {
        setActiveSandboxId(null);
        setComparison(null);
      }
    },
    [engine, activeSandboxId]
  );

  const handleCompare = useCallback(() => {
    if (!activeSandboxId || !compareTargetId) return;
    try {
      const result = engine.compare(activeSandboxId, compareTargetId);
      setComparison(result);
    } catch {
      setComparison(null);
    }
  }, [engine, activeSandboxId, compareTargetId]);

  const handleReset = useCallback(() => {
    if (!activeSandboxId) return;
    for (const a of DEFAULT_ASSUMPTIONS) {
      engine.applyModification(activeSandboxId, 'assumptions', { key: a.key }, 'value', a.default);
      setAssumptions((prev) => ({ ...prev, [a.key]: a.default }));
    }
    setSandboxes(engine.listSandboxes());
  }, [engine, activeSandboxId]);

  const comparisonChartData = useMemo(() => {
    if (!comparison) return [];
    return comparison.differences.slice(0, 10).map((d) => ({
      name: d.coords.key ?? d.measure,
      delta: d.delta,
      percentChange: d.percentChange,
    }));
  }, [comparison]);

  const totalImpact = useMemo(() => {
    if (!activeSandbox) return 0;
    return activeSandbox.modifications.reduce(
      (sum, m) => sum + (m.modifiedValue - m.originalValue),
      0
    );
  }, [activeSandbox]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sliders className="h-6 w-6" />
            What-If Sandbox
          </h1>
          <p className="text-muted-foreground">
            Create scenarios, modify assumptions, compare results side-by-side
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateSandbox}>
            <Plus className="h-4 w-4 mr-1" /> New Scenario
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Scenarios"
              value={sandboxes.length}
              icon={<Layers className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Modifications"
              value={activeSandbox?.modifications.length ?? 0}
              icon={<Sliders className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Impact"
              value={formatCurrency(totalImpact)}
              icon={
                totalImpact >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Differences"
              value={comparison?.summary.totalDifferences ?? 0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sandbox List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sandboxes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No scenarios yet. Create one to start.
              </p>
            ) : (
              sandboxes.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    activeSandboxId === s.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    setActiveSandboxId(s.id);
                    // Load assumptions from sandbox modifications
                    const mods = engine.getModifications(s.id);
                    const newAssumptions = {
                      ...Object.fromEntries(DEFAULT_ASSUMPTIONS.map((a) => [a.key, a.default])),
                    };
                    for (const m of mods) {
                      if (m.coords.key) newAssumptions[m.coords.key] = m.modifiedValue;
                    }
                    setAssumptions(newAssumptions);
                    setComparison(null);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveSandboxId(s.id);
                      const mods = engine.getModifications(s.id);
                      const newAssumptions = {
                        ...Object.fromEntries(DEFAULT_ASSUMPTIONS.map((a) => [a.key, a.default])),
                      };
                      for (const m of mods) {
                        if (m.coords.key) newAssumptions[m.coords.key] = m.modifiedValue;
                      }
                      setAssumptions(newAssumptions);
                      setComparison(null);
                    }
                  }}
                >
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.modifications.length} modification{s.modifications.length !== 1 ? 's' : ''}{' '}
                      · {s.status}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClone(s.id);
                      }}
                      aria-label="Clone scenario"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id);
                      }}
                      aria-label="Delete scenario"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Assumption Sliders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Assumptions</span>
              {activeSandboxId && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeSandboxId ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Select a scenario to modify assumptions.
              </p>
            ) : (
              DEFAULT_ASSUMPTIONS.map((a) => (
                <div key={a.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{a.label}</label>
                    <span className="text-sm text-muted-foreground">
                      {a.unit === '$'
                        ? formatCurrency(assumptions[a.key]!)
                        : `${assumptions[a.key]!}${a.unit}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={a.min}
                    max={a.max}
                    step={a.step}
                    value={assumptions[a.key]}
                    onChange={(e) => handleAssumptionChange(a.key, parseFloat(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{a.unit === '$' ? formatCurrency(a.min) : `${a.min}${a.unit}`}</span>
                    <span>{a.unit === '$' ? formatCurrency(a.max) : `${a.max}${a.unit}`}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Comparison Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Compare</span>
              {activeSandboxId && sandboxes.length >= 2 && (
                <div className="flex gap-2 items-center">
                  <select
                    value={compareTargetId ?? ''}
                    onChange={(e) => setCompareTargetId(e.target.value || null)}
                    className="text-sm border rounded px-2 py-1 bg-background"
                  >
                    <option value="">Select target...</option>
                    {sandboxes
                      .filter((s) => s.id !== activeSandboxId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCompare}
                    disabled={!compareTargetId}
                  >
                    <Zap className="h-3 w-3 mr-1" /> Compare
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!comparison ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {sandboxes.length < 2
                  ? 'Create at least 2 scenarios to compare.'
                  : 'Select a target scenario and click Compare.'}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Avg Delta</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(comparison.summary.averageDelta)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Avg Change</p>
                    <p className="text-lg font-bold">
                      {formatPercent(comparison.summary.averagePercentChange)}
                    </p>
                  </div>
                </div>

                {comparisonChartData.length > 0 && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                        <Bar dataKey="delta" radius={[0, 4, 4, 0]}>
                          {comparisonChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.delta >= 0 ? '#16a34a' : '#dc2626'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {comparison.differences.slice(0, 15).map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                    >
                      <span className="truncate">{d.coords.key ?? d.measure}</span>
                      <span className={d.delta >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(d.delta)} ({formatPercent(d.percentChange)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
