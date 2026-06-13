import { useMemo, memo } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import type { SectorKPI, SectorConfig } from '@/config/sectors';
import { cn } from '@/utils/cn';

export interface SectorKPIsProps {
  /** The active sector configuration. */
  config: SectorConfig;
  /**
   * Actual KPI values keyed by KPI id.
   * If not provided, KPIs render with target as placeholder.
   */
  values?: Record<string, number>;
  /** Optional sparkline data keyed by KPI id. */
  sparklines?: Record<string, number[]>;
  /** Loading skeleton state. */
  loading?: boolean;
  /** Optional extra class names. */
  className?: string;
}

/**
 * Derive a simulated sparkline shape from a target value.
 * Used when no real data is available — purely visual.
 */
function fakeSparkline(target: number, seed: number): number[] {
  const points: number[] = [];
  let v = target * 0.9;
  for (let i = 0; i < 8; i++) {
    const jitter = ((seed * (i + 1) * 7) % 20) - 10;
    v = Math.max(0, v + (target * jitter) / 100);
    points.push(v);
  }
  // Ensure last point is near target
  points[points.length - 1] = target;
  return points;
}

/**
 * Compute a simple mock variance so KPI cards show a change indicator.
 */
function mockChange(kpi: SectorKPI): { change: number; trend: 'up' | 'down' | 'neutral' } {
  const hash = kpi.id.length * 3;
  const change = ((hash % 15) - 5) / 10; // range -0.5 .. +1.0
  if (kpi.lowerIsBetter) {
    return { change: -Math.abs(change), trend: change < 0 ? 'up' : 'down' };
  }
  return { change, trend: change >= 0 ? 'up' : 'down' };
}

/**
 * SectorKPIs — renders a responsive grid of KPI cards for a sector.
 *
 * Each card is backed by the sector's KPI config (label, format, target).
 * Pass `values` for real data; omit to use targets as placeholders.
 */
export const SectorKPIs = memo(function SectorKPIs({
  config = { id: 'placeholder', label: 'Placeholder', defaultKPIs: [] } as SectorConfig,
  values,
  sparklines,
  loading = false,
  className,
}: SectorKPIsProps) {
  const kpis = useMemo(() => config.defaultKPIs, [config.defaultKPIs]);

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
        className
      )}
      role="region"
      aria-label="SectorKPIs"
    >
      {kpis.map((kpi) => {
        const actual = values?.[kpi.id] ?? kpi.target;
        const { change, trend } = mockChange(kpi);
        const sparkData = sparklines?.[kpi.id] ?? fakeSparkline(kpi.target, kpi.id.length);

        return (
          <KPICard
            key={kpi.id}
            title={kpi.label}
            value={actual}
            format={kpi.format}
            change={change}
            trend={trend}
            sparklineData={sparkData}
            loading={loading}
          />
        );
      })}
    </div>
  );
});
