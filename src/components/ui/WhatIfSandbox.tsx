import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import { formatNumber, formatPercent } from '@/utils/financialFormatting';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { ScenarioEngine, type ScenarioDriver } from '@/engines/ScenarioEngine';
import type { ScenarioMetrics } from '@/types';
import { Plus, X, GitMerge, Lock, Unlock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { subtractMoney, divideMoney, multiplyMoney, compareMoney, roundTo } from '@/utils/money';

interface ScenarioDefinition {
  id: string;
  name: string;
  color: string;
  drivers: ScenarioDriver[];
  metrics: ScenarioMetrics | null;
  isLocked: boolean;
}

interface WhatIfSandboxProps {
  baseMetrics: ScenarioMetrics;
  onScenarioChange?: (scenarios: ScenarioDefinition[]) => void;
  className?: string;
}

const SCENARIO_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
function formatPctWithSign(n: number): string {
  return `${n >= 0 ? '+' : ''}${formatNumber(n, 1)}%`;
}

function DiffIndicator({ current, base }: { current: number; base: number }) {
  const diff = roundTo(subtractMoney(current, base));
  const pctDiff =
    compareMoney(base, 0) !== 0 ? multiplyMoney(divideMoney(diff, base), 100).toNumber() : 0;
  const isNeutral = Math.abs(pctDiff) < 0.01;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        isNeutral
          ? 'text-[var(--text-muted)]'
          : diff > 0
            ? 'fin-positive dark:text-green-400'
            : 'fin-negative dark:text-red-400'
      )}
    >
      {isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : diff > 0 ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {formatPctWithSign(pctDiff)}
    </span>
  );
}

export function WhatIfSandbox({ baseMetrics, onScenarioChange, className }: WhatIfSandboxProps) {
  const fmt = useCurrencyFormatter();
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([
    {
      id: 'scenario-1',
      name: 'Optimistic',
      color: SCENARIO_COLORS[0]!,
      drivers: [
        {
          id: 'd1',
          name: 'Revenue Growth',
          type: 'revenue',
          impactType: 'percentage',
          value: 15,
          isActive: true,
        },
        {
          id: 'd2',
          name: 'COGS Reduction',
          type: 'expense',
          impactType: 'percentage',
          value: -5,
          isActive: true,
        },
      ],
      metrics: null,
      isLocked: false,
    },
    {
      id: 'scenario-2',
      name: 'Pessimistic',
      color: SCENARIO_COLORS[1]!,
      drivers: [
        {
          id: 'd3',
          name: 'Revenue Decline',
          type: 'revenue',
          impactType: 'percentage',
          value: -10,
          isActive: true,
        },
        {
          id: 'd4',
          name: 'Cost Increase',
          type: 'expense',
          impactType: 'percentage',
          value: 8,
          isActive: true,
        },
      ],
      metrics: null,
      isLocked: false,
    },
  ]);

  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(scenarios.map((s) => s.id));
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  const computedScenarios = useMemo(() => {
    return scenarios.map((s) => ({
      ...s,
      metrics: ScenarioEngine.applyDrivers(baseMetrics, s.drivers),
    }));
  }, [scenarios, baseMetrics]);

  const selectedComputed = useMemo(() => {
    return computedScenarios.filter((s) => selectedScenarios.includes(s.id));
  }, [computedScenarios, selectedScenarios]);

  const handleAddScenario = useCallback(() => {
    const newId = `scenario-${Date.now()}`;
    const colorIndex = scenarios.length % SCENARIO_COLORS.length;
    const newScenario: ScenarioDefinition = {
      id: newId,
      name: `Scenario ${scenarios.length + 1}`,
      color: SCENARIO_COLORS[colorIndex]!,
      drivers: [],
      metrics: null,
      isLocked: false,
    };
    const updated = [...scenarios, newScenario];
    setScenarios(updated);
    setSelectedScenarios((prev) => [...prev, newId]);
    onScenarioChange?.(updated);
  }, [scenarios, onScenarioChange]);

  const handleRemoveScenario = useCallback(
    (id: string) => {
      if (!window.confirm('Remove this scenario?')) return;
      const updated = scenarios.filter((s) => s.id !== id);
      setScenarios(updated);
      setSelectedScenarios((prev) => prev.filter((sid) => sid !== id));
      onScenarioChange?.(updated);
    },
    [scenarios, onScenarioChange]
  );

  const handleToggleLock = useCallback(
    (id: string) => {
      const updated = scenarios.map((s) => (s.id === id ? { ...s, isLocked: !s.isLocked } : s));
      setScenarios(updated);
      onScenarioChange?.(updated);
    },
    [scenarios, onScenarioChange]
  );

  const handleDriverChange = useCallback(
    (scenarioId: string, driverId: string, value: number) => {
      const updated = scenarios.map((s) => {
        if (s.id !== scenarioId || s.isLocked) return s;
        return {
          ...s,
          drivers: s.drivers.map((d) => (d.id === driverId ? { ...d, value } : d)),
        };
      });
      setScenarios(updated);
      onScenarioChange?.(updated);
    },
    [scenarios, onScenarioChange]
  );

  const handleToggleDriver = useCallback(
    (scenarioId: string, driverId: string) => {
      const updated = scenarios.map((s) => {
        if (s.id !== scenarioId || s.isLocked) return s;
        return {
          ...s,
          drivers: s.drivers.map((d) => (d.id === driverId ? { ...d, isActive: !d.isActive } : d)),
        };
      });
      setScenarios(updated);
      onScenarioChange?.(updated);
    },
    [scenarios, onScenarioChange]
  );

  const handleMerge = useCallback(() => {
    if (selectedComputed.length < 2) return;
    const weightedMetrics = selectedComputed.map((s) => ({
      metrics: s.metrics!,
      probability: 1 / selectedComputed.length,
    }));
    ScenarioEngine.probabilityWeighted(weightedMetrics);
    setShowMergeDialog(false);
    // Emit merged result via callback or display inline
  }, [selectedComputed]);

  const metricsKeys: (keyof ScenarioMetrics)[] = [
    'revenue',
    'ebitda',
    'netIncome',
    'cashFlow',
    'grossMargin',
    'ebitdaMargin',
  ];

  const metricLabels: Record<string, string> = {
    revenue: 'Revenue',
    ebitda: 'EBITDA',
    netIncome: 'Net Income',
    // K33/K17 basis label: cashFlow is the engine's 80%-of-EBITDA conversion
    // assumption, not measured cash movement (headcount/runway/burnRate are
    // not rendered by this component).
    cashFlow: 'Cash Flow (base assumption)',
    grossMargin: 'Gross Margin',
    ebitdaMargin: 'EBITDA Margin',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] dark:text-gray-100">
          What-If Sandbox
        </h2>
        <div className="flex items-center gap-2">
          {selectedComputed.length >= 2 && (
            <Button variant="outline" size="sm" onClick={() => setShowMergeDialog(true)}>
              <GitMerge className="mr-1.5 h-4 w-4" />
              Merge Scenarios
            </Button>
          )}
          {scenarios.length < 4 && (
            <Button variant="outline" size="sm" onClick={handleAddScenario}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Scenario
            </Button>
          )}
        </div>
      </div>

      {/* Side-by-side scenario panels */}
      <div
        className={cn(
          'grid gap-4',
          selectedComputed.length === 1 && 'grid-cols-1',
          selectedComputed.length === 2 && 'grid-cols-2',
          selectedComputed.length === 3 && 'grid-cols-3',
          selectedComputed.length >= 4 && 'grid-cols-4'
        )}
      >
        {/* Base case */}
        <Card className="border-2 border-[var(--border-default)] dark:border-gray-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
              Base Case
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metricsKeys.map((key) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                  {metricLabels[key]}
                </span>
                <span className="font-medium text-[var(--text-primary)] dark:text-gray-100">
                  {key.includes('Margin')
                    ? formatPercent(baseMetrics[key]!, 1)
                    : fmt.currency0(baseMetrics[key]!)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Scenario panels */}
        {selectedComputed.map((scenario) => (
          <Card
            key={scenario.id}
            className={cn('border-2 transition-shadow', scenario.isLocked && 'opacity-80')}
            style={{ borderColor: scenario.color }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={scenario.name}
                  onChange={(e) => {
                    const updated = scenarios.map((s) =>
                      s.id === scenario.id ? { ...s, name: e.target.value } : s
                    );
                    setScenarios(updated);
                  }}
                  className="bg-transparent text-sm font-medium text-[var(--text-primary)] dark:text-gray-100 outline-none border-b border-transparent focus:border-[var(--border-default)] dark:focus:border-gray-600 w-full"
                  disabled={scenario.isLocked}
                />
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleToggleLock(scenario.id)}
                    className="p-1 rounded hover:bg-[var(--bg-hover)] dark:hover:bg-gray-700"
                    title={scenario.isLocked ? 'Unlock' : 'Lock'}
                  >
                    {scenario.isLocked ? (
                      <Lock className="h-3.5 w-3.5 text-amber-700" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemoveScenario(scenario.id)}
                    className="p-1 rounded hover:bg-[var(--bg-hover)] dark:hover:bg-gray-700"
                    disabled={scenario.isLocked}
                  >
                    <X className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {metricsKeys.map((key) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                    {metricLabels[key]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--text-primary)] dark:text-gray-100">
                      {key.includes('Margin')
                        ? formatPercent(scenario.metrics![key], 1)
                        : fmt.currency0(scenario.metrics![key])}
                    </span>
                    <DiffIndicator current={scenario.metrics![key]} base={baseMetrics[key]} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Impact Summary */}
      {selectedComputed.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Impact Summary vs Base Case</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedComputed.map((scenario) => {
                const revenueDiff = roundTo(
                  subtractMoney(scenario.metrics!.revenue, baseMetrics.revenue)
                );
                const ebitdaDiff = roundTo(
                  subtractMoney(scenario.metrics!.ebitda, baseMetrics.ebitda)
                );
                return (
                  <div
                    key={scenario.id}
                    className="rounded-lg border border-[var(--border-subtle)] dark:border-gray-700 p-3"
                  >
                    <div className="text-xs font-medium mb-2" style={{ color: scenario.color }}>
                      {scenario.name}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-muted)]">Revenue Δ</span>
                        <span
                          className={cn(
                            'font-medium',
                            revenueDiff >= 0 ? 'fin-positive' : 'fin-negative'
                          )}
                        >
                          {fmt.currency0(revenueDiff)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-muted)]">EBITDA Δ</span>
                        <span
                          className={cn(
                            'font-medium',
                            ebitdaDiff >= 0 ? 'fin-positive' : 'fin-negative'
                          )}
                        >
                          {fmt.currency0(ebitdaDiff)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver controls */}
      {selectedComputed.map((scenario) => (
        <Card key={`drivers-${scenario.id}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: scenario.color }}>
              {scenario.name} — Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scenario.drivers.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No drivers configured</p>
            ) : (
              <div className="space-y-3">
                {scenario.drivers.map((driver) => (
                  <div key={driver.id} className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={driver.isActive}
                        onChange={() => handleToggleDriver(scenario.id, driver.id)}
                        disabled={scenario.isLocked}
                        className="rounded border-[var(--border-default)]"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300 min-w-[120px]">
                        {driver.name}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={driver.impactType === 'percentage' ? -50 : -1000000}
                      max={driver.impactType === 'percentage' ? 50 : 1000000}
                      step={driver.impactType === 'percentage' ? 0.5 : 1000}
                      value={driver.value}
                      onChange={(e) =>
                        handleDriverChange(scenario.id, driver.id, parseFloat(e.target.value))
                      }
                      disabled={scenario.isLocked || !driver.isActive}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-16 text-right text-[var(--text-primary)] dark:text-gray-100">
                      {driver.impactType === 'percentage'
                        ? `${driver.value > 0 ? '+' : ''}${driver.value}%`
                        : fmt.currency0(driver.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Merge dialog */}
      {showMergeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Merge Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
                Create a probability-weighted merge of{' '}
                {selectedComputed.map((s) => s.name).join(', ')}.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowMergeDialog(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleMerge}>
                  <GitMerge className="mr-1.5 h-4 w-4" />
                  Merge
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
