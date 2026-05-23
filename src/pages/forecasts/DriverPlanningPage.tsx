// =============================================================================
// DRIVER PLANNING PAGE — Full-page driver-based planning interface
// Manage drivers, define cascade rules, and preview impacts before applying
// =============================================================================

import { useCallback, useMemo, useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  RotateCcw,
  Zap,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Copy,
  Download,
  Layers,
  GitBranch,
  BookTemplate,
  ArrowRight,
} from 'lucide-react';
import { DriverLibrary } from '@/engines/DriverLibrary';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DriverSlider } from '@/components/ui/DriverSlider';
import { CascadeRuleBuilder } from '@/components/finance/CascadeRuleBuilder';
import { useDriverStore, DRIVER_TEMPLATES, type DriverTemplate } from '@/store/driverStore';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import type { Driver, ImpactAnalysis } from '@/engines/DriverCascadeEngine';
import { AssumptionEngine } from '@/engines/AssumptionEngine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatImpact(value: number): string {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatDriverValue(value: number, unit: string): string {
  switch (unit) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'index':
      return value.toFixed(1);
    case 'ratio':
      return value.toFixed(2);
    default:
      return value.toLocaleString();
  }
}

// ---------------------------------------------------------------------------
// New Driver Form
// ---------------------------------------------------------------------------

interface NewDriverForm {
  name: string;
  description: string;
  unit: 'percentage' | 'absolute' | 'index' | 'ratio';
  baseValue: number;
  currentValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  category: string;
}

const INITIAL_FORM: NewDriverForm = {
  name: '',
  description: '',
  unit: 'percentage',
  baseValue: 0,
  currentValue: 0,
  minValue: -100,
  maxValue: 100,
  step: 1,
  category: 'General',
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function DriverPlanningPage() {
  const {
    engine,
    addDriver,
    removeDriver,
    updateDriver,
    selectedDriverId,
    selectDriver,
    isRecalculating,
    lastCascadeResult,
    getRulesForDriver,
    getAllRules,
    detectCircularDependencies,
    loadDriverTemplate,
    calculateCascade,
    analyzeImpact,
    reset,
  } = useDriverStore();

  const drivers = useMemo(() => engine.listDrivers(), [engine]);
  const allRules = useMemo(() => getAllRules(), [getAllRules]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<NewDriverForm>(INITIAL_FORM);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<Record<string, number>>({});
  const [impactPreviews, setImpactPreviews] = useState<Record<string, ImpactAnalysis>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const circularDeps = useMemo(
    () => detectCircularDependencies(),
    [detectCircularDependencies, drivers.length, allRules.length]
  );

  // Group drivers by category
  const categories = useMemo(() => {
    const cats = new Map<string, Driver[]>();
    for (const driver of drivers) {
      const list = cats.get(driver.category) ?? [];
      list.push(driver);
      cats.set(driver.category, list);
    }
    return cats;
  }, [drivers]);

  // KPI metrics
  const totalRules = allRules.length;
  const driversWithRules = useMemo(() => {
    const ids = new Set(allRules.map((r) => r.driverId));
    return ids.size;
  }, [allRules]);

  // --- Handlers ---

  const handleAddDriver = () => {
    if (!form.name.trim()) return;
    addDriver({
      name: form.name,
      description: form.description,
      unit: form.unit,
      baseValue: form.baseValue,
      currentValue: form.currentValue,
      minValue: form.minValue,
      maxValue: form.maxValue,
      step: form.step,
      category: form.category,
      tags: [],
      linkedAccountIds: [],
    });
    setForm(INITIAL_FORM);
    setShowAddForm(false);
  };

  const handleRemoveDriver = (id: string) => {
    removeDriver(id);
    if (selectedDriverId === id) selectDriver(null);
    if (expandedDriver === id) setExpandedDriver(null);
  };

  const handleSliderChange = useCallback(
    (driver: Driver, value: number) => {
      setPendingValues((prev) => ({ ...prev, [driver.id]: value }));
      try {
        const readCell = () => 0;
        const impact = analyzeImpact(driver.id, value, readCell);
        setImpactPreviews((prev) => ({ ...prev, [driver.id]: impact }));
      } catch {
        setImpactPreviews((prev) => {
          const next = { ...prev };
          delete next[driver.id];
          return next;
        });
      }
    },
    [analyzeImpact]
  );

  const handleApplyDriver = (driverId: string) => {
    const value = pendingValues[driverId];
    if (value === undefined) return;

    updateDriver(driverId, { currentValue: value });
    setPendingValues((prev) => {
      const next = { ...prev };
      delete next[driverId];
      return next;
    });
    setImpactPreviews((prev) => {
      const next = { ...prev };
      delete next[driverId];
      return next;
    });
  };

  const handleResetDriver = (driver: Driver) => {
    updateDriver(driver.id, { currentValue: driver.baseValue });
    setPendingValues((prev) => {
      const next = { ...prev };
      delete next[driver.id];
      return next;
    });
    setImpactPreviews((prev) => {
      const next = { ...prev };
      delete next[driver.id];
      return next;
    });
  };

  const handleLoadTemplate = (template: DriverTemplate) => {
    loadDriverTemplate(template);
    setShowTemplates(false);
  };

  // AssumptionEngine: track driver assumptions
  const driverAssumptions = useMemo(() => {
    return AssumptionEngine.getByCategory('operational');
  }, []);

  // --- Render ---

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Driver-Based Planning
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Define drivers, set cascade rules, and model financial impacts
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowTemplates(!showTemplates)}>
            <BookTemplate className="h-3.5 w-3.5 mr-1.5" />
            Templates
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Driver
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KPIValue label="Total Drivers" value={String(drivers.length)} />
        <KPIValue label="Cascade Rules" value={String(totalRules)} />
        <KPIValue label="Drivers with Rules" value={String(driversWithRules)} />
        <KPIValue
          label="Circular Dependencies"
          value={String(circularDeps.length)}
          trend={circularDeps.length > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Circular Dependency Warning */}
      {circularDeps.length > 0 && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg border"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-red-400">Circular Dependencies Detected</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {circularDeps.map((cycle, i) => (
                <div key={i}>{cycle}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Templates Panel */}
      {showTemplates && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Driver Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {DRIVER_TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => handleLoadTemplate(template)}
                  className="p-3 rounded-lg border text-left hover:opacity-80 transition-opacity"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {template.name}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {template.description}
                  </div>
                  <div className="text-xs mt-2" style={{ color: 'var(--accent)' }}>
                    {template.drivers.length} drivers
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Driver Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add New Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Driver Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Revenue Growth Rate"
                  className="w-full p-2 rounded text-sm border"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)',
                  }}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Revenue, Cost, Workforce"
                  className="w-full p-2 rounded text-sm border"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)',
                  }}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full p-2 rounded text-sm border"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)',
                  }}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Unit
                </label>
                <select
                  value={form.unit}
                  onChange={(e) =>
                    setForm({ ...form, unit: e.target.value as NewDriverForm['unit'] })
                  }
                  className="w-full p-2 rounded text-sm border"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="absolute">Absolute</option>
                  <option value="index">Index</option>
                  <option value="ratio">Ratio</option>
                </select>
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Base / Current Value
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={form.baseValue}
                    onChange={(e) => setForm({ ...form, baseValue: Number(e.target.value) })}
                    className="w-full p-2 rounded text-sm border"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border)',
                    }}
                  />
                  <input
                    type="number"
                    value={form.currentValue}
                    onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })}
                    className="w-full p-2 rounded text-sm border"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border)',
                    }}
                  />
                </div>
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Min / Max / Step
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={form.minValue}
                    onChange={(e) => setForm({ ...form, minValue: Number(e.target.value) })}
                    className="w-full p-2 rounded text-sm border"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border)',
                    }}
                  />
                  <input
                    type="number"
                    value={form.maxValue}
                    onChange={(e) => setForm({ ...form, maxValue: Number(e.target.value) })}
                    className="w-full p-2 rounded text-sm border"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border)',
                    }}
                  />
                  <input
                    type="number"
                    value={form.step}
                    onChange={(e) => setForm({ ...form, step: Number(e.target.value) })}
                    className="w-full p-2 rounded text-sm border"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border)',
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleAddDriver} disabled={!form.name.trim()}>
                Add Driver
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content: Two-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Driver List */}
        <div className="col-span-2 space-y-4">
          {Array.from(categories.entries()).map(([category, categoryDrivers]) => (
            <div key={category}>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {category}
              </h3>
              <div className="space-y-3">
                {categoryDrivers.map((driver) => {
                  const isExpanded = expandedDriver === driver.id;
                  const pendingValue = pendingValues[driver.id] ?? driver.currentValue;
                  const impact = impactPreviews[driver.id];
                  const hasChanges = pendingValue !== driver.currentValue;
                  const driverRules = getRulesForDriver(driver.id);

                  return (
                    <Card key={driver.id} className="overflow-hidden">
                      {/* Driver Header */}
                      <button
                        className="w-full text-left p-4 flex items-center justify-between"
                        onClick={() => {
                          setExpandedDriver(isExpanded ? null : driver.id);
                          selectDriver(isExpanded ? null : driver.id);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Sliders
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: 'var(--accent)' }}
                            />
                            <span
                              className="font-medium text-sm"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {driver.name}
                            </span>
                            {driverRules.length > 0 && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {driverRules.length} rule{driverRules.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {formatDriverValue(driver.currentValue, driver.unit)}
                            </span>
                            {hasChanges && (
                              <>
                                <span
                                  className="text-xs"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  →
                                </span>
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: 'var(--accent)' }}
                                >
                                  {formatDriverValue(pendingValue, driver.unit)}
                                </span>
                              </>
                            )}
                            {driver.description && (
                              <span
                                className="text-xs ml-2"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {driver.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasChanges && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyDriver(driver.id);
                              }}
                              disabled={isRecalculating}
                            >
                              {isRecalculating ? 'Applying...' : 'Apply'}
                            </Button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDriver(driver.id);
                            }}
                            className="p-1 rounded hover:opacity-80"
                            style={{ color: 'var(--text-secondary)' }}
                            aria-label={`Remove ${driver.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp
                              className="w-4 h-4"
                              style={{ color: 'var(--text-secondary)' }}
                            />
                          ) : (
                            <ChevronDown
                              className="w-4 h-4"
                              style={{ color: 'var(--text-secondary)' }}
                            />
                          )}
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <CardContent className="pt-0 pb-4 px-4 space-y-4">
                          {/* Slider */}
                          <div>
                            <DriverSlider
                              label={driver.name}
                              value={pendingValue}
                              min={driver.minValue}
                              max={driver.maxValue}
                              step={driver.step}
                              unit={driver.unit}
                              onChange={(v) => handleSliderChange(driver, v)}
                            />
                          </div>

                          {/* Impact Preview */}
                          {impact && hasChanges && (
                            <div
                              className="p-3 rounded-lg text-xs"
                              style={{ background: 'var(--bg-secondary)' }}
                            >
                              <div className="flex items-center gap-1 mb-2">
                                <Zap className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                                <span
                                  className="font-medium"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  Impact Preview
                                </span>
                              </div>
                              <div
                                className="grid grid-cols-3 gap-2"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <div>
                                  <div className="font-medium">Affected Cells</div>
                                  <div>{impact.affectedCellCount}</div>
                                </div>
                                <div>
                                  <div className="font-medium">Total Impact</div>
                                  <div>{formatImpact(impact.totalImpact)}</div>
                                </div>
                                <div>
                                  <div className="font-medium">Change</div>
                                  <div>{impact.percentageChange.toFixed(1)}%</div>
                                </div>
                              </div>
                              {Object.entries(impact.impactByCube).length > 0 && (
                                <div
                                  className="mt-2 pt-2 border-t"
                                  style={{ borderColor: 'var(--border)' }}
                                >
                                  {Object.entries(impact.impactByCube).map(([cube, data]) => (
                                    <div key={cube} className="flex justify-between">
                                      <span>{cube}</span>
                                      <span>
                                        {data.count} cells | {formatImpact(data.totalImpact)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApplyDriver(driver.id)}
                              disabled={!hasChanges || isRecalculating}
                              className="flex-1"
                            >
                              {isRecalculating ? 'Applying...' : 'Apply Changes'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetDriver(driver)}
                              disabled={!hasChanges}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Cascade Rules */}
                          <CascadeRuleBuilder driver={driver} />
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {drivers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Sliders
                  className="w-12 h-12 mx-auto mb-3 opacity-30"
                  style={{ color: 'var(--text-secondary)' }}
                />
                <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  No Drivers Configured
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Add drivers manually or load a template to get started
                </p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={() => setShowAddForm(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Driver
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowTemplates(true)}>
                    <BookTemplate className="h-3.5 w-3.5 mr-1.5" />
                    Load Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Summary Panel */}
        <div className="space-y-4">
          {/* Cascade Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cascade Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {drivers.map((driver) => {
                const rules = getRulesForDriver(driver.id);
                if (rules.length === 0) return null;
                return (
                  <div
                    key={driver.id}
                    className="p-2 rounded text-xs"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      {driver.name}
                    </div>
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>
                          {rule.targetCube} / {rule.targetCoords.Account}
                        </span>
                        <span className="ml-auto">{rule.weight}x</span>
                      </div>
                    ))}
                  </div>
                );
              })}
              {allRules.length === 0 && (
                <div
                  className="text-center py-4 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  No cascade rules defined yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Last Cascade Result */}
          {lastCascadeResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Last Cascade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Driver</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {lastCascadeResult.driverName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Old Value</span>
                  <span style={{ color: 'var(--text-primary)' }}>{lastCascadeResult.oldValue}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>New Value</span>
                  <span style={{ color: 'var(--accent)' }}>{lastCascadeResult.newValue}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Affected Cells</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {lastCascadeResult.affectedCells.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Total Impact</span>
                  <span
                    style={{
                      color: lastCascadeResult.totalImpact >= 0 ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {formatImpact(lastCascadeResult.totalImpact)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Duration</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {lastCascadeResult.duration.toFixed(2)}ms
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Driver Impact Heatmap */}
          {drivers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Driver Impact Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <HeatmapChart
                  data={drivers.flatMap((d) =>
                    getRulesForDriver(d.id).map((r) => ({
                      x: d.name,
                      y: r.targetCoords.Account || r.targetCube,
                      value: r.weight * (pendingValues[d.id] ?? d.currentValue),
                    }))
                  )}
                  cellSize={32}
                  formatValue={(v) => `${v.toFixed(1)}x`}
                  ariaLabel="Driver impact heatmap"
                />
                {allRules.length === 0 && (
                  <p
                    className="text-xs text-center py-4"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Add cascade rules to see impact matrix
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-3 h-3 mr-2" />
                Add Driver
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <BookTemplate className="w-3 h-3 mr-2" />
                Load Template
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  const snapshot = engine.createSnapshot();
                  // Snapshot created — can be restored later
                }}
              >
                <Copy className="w-3 h-3 mr-2" />
                Create Snapshot
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
