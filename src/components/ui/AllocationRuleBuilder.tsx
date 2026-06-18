import React, { useState, useCallback } from 'react';
import { Plus, Trash2, ArrowRight, Play, Settings2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type {
  AllocationMethod,
  AllocationRule,
  AllocationResult,
} from '@/engines/AllocationEngine';
import { AllocationEngine } from '@/engines/AllocationEngine';

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
  onPreview?: (result: AllocationResult) => void;
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
// Helpers
// ---------------------------------------------------------------------------

const METHOD_OPTIONS: Array<{ value: AllocationMethod; label: string; description: string }> = [
  { value: 'direct', label: 'Direct', description: 'Allocate by fixed percentages' },
  {
    value: 'driver',
    label: 'Driver-Based',
    description: 'Allocate by driver values (headcount, revenue, etc.)',
  },
  {
    value: 'step-down',
    label: 'Step-Down',
    description: 'Sequential service department allocation',
  },
  {
    value: 'reciprocal',
    label: 'Reciprocal',
    description: 'Simultaneous service department allocation',
  },
];

const PRESET_DRIVERS = [
  { id: 'headcount', label: 'Headcount' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'square_footage', label: 'Square Footage' },
  { id: 'machine_hours', label: 'Machine Hours' },
  { id: 'custom', label: 'Custom' },
];

function generateId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AllocationRuleBuilder: React.FC<AllocationRuleBuilderProps> = ({
  sources,
  drivers,
  targetOptions,
  onPreview,
  onSave,
  className,
}) => {
  const [ruleName, setRuleName] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [method, setMethod] = useState<AllocationMethod>('direct');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [error, setError] = useState<string | null>(null);

  // --- Target management ---

  const addTarget = useCallback(() => {
    const usedMembers = new Set(targets.map((t) => t.dimensionMember));
    const available = targetOptions.find((o) => !usedMembers.has(o.id));
    if (!available) return;

    setTargets((prev) => [
      ...prev,
      {
        id: `target-${Date.now()}`,
        dimensionMember: available.id,
        percentage: 0,
        driverWeight: 1,
      },
    ]);
  }, [targets, targetOptions]);

  const removeTarget = useCallback((id: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTarget = useCallback((id: string, field: keyof TargetRow, value: string | number) => {
    setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }, []);

  // --- Preview / Save ---

  const buildRule = useCallback(
    (): AllocationRule => ({
      id: generateId(),
      name: ruleName || 'Untitled Allocation',
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
  }, [buildRule, sources, selectedSource, drivers, selectedDriver, method, onPreview]);

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

  // --- Percentage total for direct method ---

  const percentageTotal = targets.reduce((sum, t) => sum + t.percentage, 0);
  const percentageValid = method !== 'direct' || Math.abs(percentageTotal - 100) < 0.01;

  // --- Render ---

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Allocation Rule Builder
        </h3>
      </div>

      {/* Rule Name */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-300">Rule Name</span>
        <input
          type="text"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          placeholder="e.g., Allocate IT Costs by Headcount"
          className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {/* Source Selection */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-300">Source</span>
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

      {/* Method Selection */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-300">Method</span>
        <div className="grid grid-cols-2 gap-2">
          {METHOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMethod(opt.value)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-md border p-2.5 text-left transition-colors',
                method === opt.value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-[var(--border-subtle)] hover:border-gray-400 text-[var(--text-secondary)]'
              )}
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] opacity-70">{opt.description}</span>
            </button>
          ))}
        </div>
      </label>

      {/* Driver Selection (driver method only) */}
      {method === 'driver' && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-300">Driver</span>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select driver...</option>
            {PRESET_DRIVERS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Targets */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-300">Targets</span>
          <button
            type="button"
            onClick={addTarget}
            disabled={targets.length >= targetOptions.length}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            Add Target
          </button>
        </div>

        {targets.length === 0 && (
          <p className="text-xs text-slate-500 italic">
            No targets added yet. Click &quot;Add Target&quot; to begin.
          </p>
        )}

        {targets.map((target) => (
          <div
            key={target.id}
            className="flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2"
          >
            <ArrowRight className="h-4 w-4 text-slate-500 shrink-0" />

            {/* Target member select */}
            <select
              value={target.dimensionMember}
              onChange={(e) => updateTarget(target.id, 'dimensionMember', e.target.value)}
              className="flex-1 h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] outline-none"
            >
              {targetOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Percentage (direct method) */}
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
                  className="w-20 h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] text-right outline-none"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>
            )}

            {/* Driver weight (driver method) */}
            {method === 'driver' && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500">Weight</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={target.driverWeight}
                  onChange={(e) =>
                    updateTarget(target.id, 'driverWeight', parseFloat(e.target.value) || 0)
                  }
                  className="w-16 h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] text-right outline-none"
                />
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeTarget(target.id)}
              className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {/* Percentage total indicator (direct method) */}
        {method === 'direct' && targets.length > 0 && (
          <div
            className={cn(
              'text-xs font-medium',
              percentageValid ? 'text-green-500' : 'text-red-600'
            )}
          >
            Total: {percentageTotal.toFixed(2)}% {percentageValid ? '✓' : '(must equal 100%)'}
          </div>
        )}
      </div>

      {/* Period & Recurring */}
      <div className="flex items-center gap-4">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-300">Period</span>
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

      {/* Error display */}
      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={handlePreview}
          disabled={!selectedSource || targets.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          Preview
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedSource || targets.length === 0 || !ruleName}
          className="rounded-md border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-gray-400 disabled:opacity-50"
        >
          Save Rule
        </button>
      </div>
    </div>
  );
};
