import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import type { StepDownConfig } from '@/engines/AllocationEngine';
import { formatPercent } from '@/utils/financialFormatting';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StepDownConfigPanelProps {
  serviceDepts: Array<{ id: string; label: string; cost: number }>;
  productionDepts: Array<{ id: string; label: string }>;
  config: StepDownConfig;
  onChange: (cfg: StepDownConfig) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepDownConfigPanel({
  serviceDepts = [],
  productionDepts = [],
  config = {
    serviceDepartments: [],
    productionDepartments: [],
    serviceCosts: {},
    servicePercentages: {},
  },
  onChange = () => {},
}: StepDownConfigPanelProps) {
  const allReceivers = useMemo(
    () => [...serviceDepts, ...productionDepts],
    [serviceDepts, productionDepts]
  );

  const updatePct = (svcId: string, recvId: string, val: number) => {
    const next = { ...config.servicePercentages };
    next[svcId] = { ...(next[svcId] ?? {}), [recvId]: val };
    onChange({ ...config, servicePercentages: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium text-slate-400">Service Department Percentages</span>
      {serviceDepts.map((svc) => {
        const total = allReceivers
          .filter((r) => r.id !== svc.id)
          .reduce((s, r) => s + (config.servicePercentages[svc.id]?.[r.id] ?? 0), 0);
        return (
          <div key={svc.id} className="rounded-md border border-[var(--border-subtle)] p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--text-primary)]">{svc.label}</span>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  Math.abs(total - 100) < 0.01 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatPercent(total, 1)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {allReceivers
                .filter((r) => r.id !== svc.id)
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
                      value={config.servicePercentages[svc.id]?.[recv.id] ?? 0}
                      onChange={(e) => updatePct(svc.id, recv.id, parseFloat(e.target.value) || 0)}
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
