import { DriverSlider } from '@/components/ui/DriverSlider';
import type { ScenarioAssumption } from '@/types';

export interface DriverTreeViewProps {
  assumptions: ScenarioAssumption[];
  onUpdate: (assumptionId: string, value: number) => void;
  readOnly?: boolean;
}

export function DriverTreeView({
  assumptions = [],
  onUpdate = () => {},
  readOnly,
}: DriverTreeViewProps) {
  if (assumptions.length === 0) {
    return (
      <div
        className="p-6 text-center text-[var(--text-muted)] bg-slate-900 rounded-lg"
        role="region"
        aria-label="DriverTreeView"
      >
        No drivers defined
      </div>
    );
  }

  const groups = assumptions.reduce(
    (acc, a) => {
      const existing = acc[a.driverType];
      acc[a.driverType] = existing ? [...existing, a] : [a];
      return acc;
    },
    {} as Record<string, ScenarioAssumption[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([type, list]) => (
        <div key={type} className="space-y-3">
          <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest px-2">
            {type} Drivers
          </h4>
          <div className="space-y-2">
            {list.map((a) => (
              <DriverSlider
                key={a.id}
                label={a.name}
                value={a.currentValue}
                min={a.minValue}
                max={a.maxValue}
                step={1}
                unit={a.unit}
                onChange={(v) => onUpdate(a.id, v)}
                disabled={readOnly}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
