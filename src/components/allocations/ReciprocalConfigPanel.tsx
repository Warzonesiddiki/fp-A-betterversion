import { cn } from '@/utils/cn';
import type { ReciprocalConfig } from '@/engines/AllocationEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReciprocalConfigPanelProps {
  departments: Array<{ id: string; label: string; cost: number }>;
  config: ReciprocalConfig;
  onChange: (cfg: ReciprocalConfig) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReciprocalConfigPanel({
  departments = [],
  config = {
    servicePercentages: {},
    iterations: 5,
    tolerance: 0.001,
  } as unknown as ReciprocalConfig,
  onChange = () => {},
}: ReciprocalConfigPanelProps) {
  const updatePct = (fromId: string, toId: string, val: number) => {
    const next = { ...config.servicePercentages };
    next[fromId] = { ...(next[fromId] ?? {}), [toId]: val };
    onChange({ ...config, servicePercentages: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium text-slate-400">
        Inter-Department Service Percentages
      </span>
      {departments.map((dept) => {
        const total = departments
          .filter((d) => d.id !== dept.id)
          .reduce((s, d) => s + (config.servicePercentages[dept.id]?.[d.id] ?? 0), 0);
        return (
          <div key={dept.id} className="rounded-md border border-[var(--border-subtle)] p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--text-primary)]">{dept.label}</span>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  total <= 100 ? 'text-green-500' : 'text-red-600'
                )}
              >
                {total.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {departments
                .filter((d) => d.id !== dept.id)
                .map((recv) => (
                  <div key={recv.id} className="flex items-center gap-1">
                    <span className="text-[10px] text-[var(--text-secondary)] truncate flex-1">
                      {recv.label}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={config.servicePercentages[dept.id]?.[recv.id] ?? 0}
                      onChange={(e) => updatePct(dept.id, recv.id, parseFloat(e.target.value) || 0)}
                      className="w-14 h-6 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 text-[10px] text-right text-[var(--text-primary)] outline-none"
                    />
                    <span className="text-[10px] text-slate-500">%</span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
