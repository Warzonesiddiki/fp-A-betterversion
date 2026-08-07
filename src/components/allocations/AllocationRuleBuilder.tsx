import { useState, useCallback, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ArrowRight,
  Play,
  Settings2,
  GitBranch,
  Repeat,
  Network,
  Percent,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { AllocationEngine } from '@/engines/AllocationEngine';
import type {
  AllocationMethod,
  AllocationRule,
  AllocationResult,
  StepDownConfig,
  ReciprocalConfig,
} from '@/engines/AllocationEngine';
import { StepDownConfigPanel } from './StepDownConfigPanel';
import { ReciprocalConfigPanel } from './ReciprocalConfigPanel';
import { formatPercent } from '@/utils/financialFormatting';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AllocationSource {
  id: string;
  label: string;
  amount: number;
}

export interface AllocationDriver {
  id: string;
  label: string;
  values: Record<string, number>;
}

export interface AllocationRuleBuilderProps {
  sources: AllocationSource[];
  drivers: AllocationDriver[];
  targetOptions: Array<{ id: string; label: string }>;
  serviceDeptOptions?: Array<{ id: string; label: string; cost: number }>;
  productionDeptOptions?: Array<{ id: string; label: string }>;
  onPreview?: (result: AllocationResult | AllocationResult[]) => void;
  onSave?: (rule: AllocationRule) => void;
  className?: string;
}

interface TargetRow {
  id: string;
  dimensionMember: string;
  percentage: number;
  driverWeight: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METHOD_OPTIONS: Array<{
  value: AllocationMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'direct',
    label: 'Direct',
    description: 'Fixed percentages',
    icon: <Percent className="h-4 w-4" />,
  },
  {
    value: 'driver',
    label: 'Driver',
    description: 'Weighted drivers',
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    value: 'step-down',
    label: 'Step-Down',
    description: 'Sequential service',
    icon: <Repeat className="h-4 w-4" />,
  },
  {
    value: 'reciprocal',
    label: 'Reciprocal',
    description: 'Simultaneous service',
    icon: <Network className="h-4 w-4" />,
  },
];

function generateId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AllocationRuleBuilder({
  sources = [],
  drivers = [],
  targetOptions = [],
  serviceDeptOptions = [],
  productionDeptOptions = [],
  onPreview,
  onSave,
  className,
}: AllocationRuleBuilderProps) {
  const [ruleName, setRuleName] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [method, setMethod] = useState<AllocationMethod>('direct');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [error, setError] = useState<string | null>(null);
  const [stepDownCfg, setStepDownCfg] = useState<StepDownConfig>({
    serviceDepartments: [],
    productionDepartments: [],
    serviceCosts: {},
    servicePercentages: {},
  });
  const [reciprocalCfg, setReciprocalCfg] = useState<ReciprocalConfig>({
    departments: [],
    departmentCosts: {},
    servicePercentages: {},
  });

  const isDirectDriver = method === 'direct' || method === 'driver';

  useEffect(() => {
    if (method === 'step-down' && serviceDeptOptions.length > 0) {
      setStepDownCfg((prev) => ({
        ...prev,
        serviceDepartments: serviceDeptOptions.map((d) => d.id),
        productionDepartments: productionDeptOptions.map((d) => d.id),
        serviceCosts: Object.fromEntries(serviceDeptOptions.map((d) => [d.id, d.cost])),
      }));
    }
  }, [method, serviceDeptOptions, productionDeptOptions]);

  useEffect(() => {
    if (method === 'reciprocal' && serviceDeptOptions.length > 0) {
      const allDepts = [
        ...serviceDeptOptions,
        ...productionDeptOptions.map((d) => ({ ...d, cost: 0 })),
      ];

      setReciprocalCfg((prev) => ({
        ...prev,
        departments: allDepts.map((d) => d.id),
        departmentCosts: Object.fromEntries(allDepts.map((d) => [d.id, d.cost])),
      }));
    }
  }, [method, serviceDeptOptions, productionDeptOptions]);

  const addTarget = useCallback(() => {
    const used = new Set(targets.map((t) => t.dimensionMember));
    const available = targetOptions.find((o) => !used.has(o.id));
    if (!available) return;
    setTargets((prev) => [
      ...prev,
      { id: `t-${Date.now()}`, dimensionMember: available.id, percentage: 0, driverWeight: 1 },
    ]);
  }, [targets, targetOptions]);

  const removeTarget = useCallback(
    (id: string) => setTargets((prev) => prev.filter((t) => t.id !== id)),
    []
  );

  const updateTarget = useCallback((id: string, field: keyof TargetRow, value: string | number) => {
    setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }, []);

  const buildRule = useCallback(
    (): AllocationRule => ({
      id: generateId(),
      name: ruleName || 'Untitled',
      sourceAccount: selectedSource,
      method,
      targets: targets.map((t) => ({
        dimensionMember: t.dimensionMember,
        percentage: t.percentage,
        driverWeight: t.driverWeight,
      })),
      driverDimension: method === 'driver' ? selectedDriver : undefined,
      period,
      isRecurring,
    }),
    [ruleName, selectedSource, method, targets, selectedDriver, period, isRecurring]
  );

  const handlePreview = useCallback(() => {
    setError(null);
    try {
      if (method === 'step-down') {
        onPreview?.(AllocationEngine.allocateStepDown(stepDownCfg));
        return;
      }
      if (method === 'reciprocal') {
        onPreview?.(AllocationEngine.allocateReciprocal(reciprocalCfg));
        return;
      }
      const rule = buildRule();
      const sourceAmount = sources.find((s) => s.id === selectedSource)?.amount ?? 0;
      const driverValues = drivers.find((d) => d.id === selectedDriver)?.values ?? {};
      const result =
        method === 'driver'
          ? AllocationEngine.allocateByDriver(rule, sourceAmount, driverValues)
          : AllocationEngine.allocateDirect(rule, sourceAmount);
      onPreview?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Allocation failed');
    }
  }, [
    buildRule,
    sources,
    selectedSource,
    drivers,
    selectedDriver,
    method,
    stepDownCfg,
    reciprocalCfg,
    onPreview,
  ]);

  const handleSave = useCallback(() => {
    setError(null);
    try {
      const rule = buildRule();
      if (method === 'direct') AllocationEngine.validateDirectRule(rule);
      onSave?.(rule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    }
  }, [buildRule, method, onSave]);

  const pctTotal = targets.reduce((s, t) => s + t.percentage, 0);
  const pctValid = method !== 'direct' || Math.abs(pctTotal - 100) < 0.01;
  const canPreview = isDirectDriver ? !!selectedSource && targets.length > 0 : true;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)]',
        className
      )}
      role="region"
      aria-label="AllocationRuleBuilder"
    >
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Allocation Rule Builder
        </h3>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400">Rule Name</span>
        <input
          type="text"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          placeholder="e.g., Allocate IT Costs by Headcount"
          className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400">Allocation Method</span>
        <div className="grid grid-cols-4 gap-2">
          {METHOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMethod(opt.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md border p-2.5 text-center transition-colors',
                method === opt.value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-[var(--border-subtle)] hover:border-gray-400 text-[var(--text-secondary)]'
              )}
            >
              {opt.icon}
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[9px] opacity-70">{opt.description}</span>
            </button>
          ))}
        </div>
      </label>

      {isDirectDriver && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">Source</span>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select source...</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} (${s.amount.toLocaleString()})
              </option>
            ))}
          </select>
        </label>
      )}

      {method === 'driver' && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">Driver</span>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select driver...</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {isDirectDriver && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Targets</span>
            <button
              type="button"
              onClick={addTarget}
              disabled={targets.length >= targetOptions.length}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="h-3 w-3" /> Add Target
            </button>
          </div>
          {targets.length === 0 && (
            <p className="text-xs text-slate-500 italic">
              No targets added. Click &quot;Add Target&quot; to begin.
            </p>
          )}
          {targets.map((target) => (
            <div
              key={target.id}
              className="flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2"
            >
              <ArrowRight className="h-4 w-4 text-slate-500 shrink-0" />
              <select
                value={target.dimensionMember}
                onChange={(e) => updateTarget(target.id, 'dimensionMember', e.target.value)}
                className="flex-1 h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] outline-none"
              >
                {targetOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              {method === 'direct' && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={target.percentage}
                    onChange={(e) =>
                      updateTarget(target.id, 'percentage', parseFloat(e.target.value) || 0)
                    }
                    className="w-20 h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-right text-[var(--text-primary)] outline-none"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              )}
              {method === 'driver' && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500">W</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={target.driverWeight}
                    onChange={(e) =>
                      updateTarget(target.id, 'driverWeight', parseFloat(e.target.value) || 0)
                    }
                    className="w-16 h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-right text-[var(--text-primary)] outline-none"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeTarget(target.id)}
                className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {method === 'direct' && targets.length > 0 && (
            <div
              className={cn('text-xs font-medium', pctValid ? 'text-green-600' : 'text-red-600')}
            >
              Total: {formatPercent(pctTotal, 2)} {pctValid ? '\u2713' : '(must equal 100%)'}
            </div>
          )}
        </div>
      )}

      {method === 'step-down' && (
        <StepDownConfigPanel
          serviceDepts={serviceDeptOptions}
          productionDepts={productionDeptOptions}
          config={stepDownCfg}
          onChange={setStepDownCfg}
        />
      )}
      {method === 'reciprocal' && (
        <ReciprocalConfigPanel
          departments={[
            ...serviceDeptOptions,
            ...productionDeptOptions.map((d) => ({ ...d, cost: 0 })),
          ]}
          config={reciprocalCfg}
          onChange={setReciprocalCfg}
        />
      )}

      <div className="flex items-center gap-4">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs font-medium text-slate-400">Period</span>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="flex items-center gap-2 mt-5">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border-default)]"
          />
          <span className="text-xs text-[var(--text-secondary)]">Recurring</span>
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400"
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={handlePreview}
          disabled={!canPreview}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          <Play className="h-3.5 w-3.5" /> Preview
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canPreview || !ruleName}
          className="rounded-md border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-gray-400 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Save Rule
        </button>
      </div>
    </div>
  );
}
