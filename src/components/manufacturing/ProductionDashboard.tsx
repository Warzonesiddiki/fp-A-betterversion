import { GaugeChart } from '@/components/ui/GaugeChart';
import { Card } from '@/components/ui/Card';
import type { ProductionMetrics } from '@/types/sector-types';

export interface ProductionDashboardProps {
  metrics: ProductionMetrics;
}

export function ProductionDashboard({ metrics }: ProductionDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="flex flex-col items-center gap-2 p-4">
        <span className="text-xs font-bold text-slate-500 uppercase">OEE</span>
        <GaugeChart value={metrics.oee} min={0} max={100} label="OEE" />
      </Card>
      <div className="md:col-span-3 grid grid-cols-3 gap-4">
        {['Availability', 'Performance', 'Quality'].map((k) => (
          <Card key={k} className="p-4 flex flex-col justify-center text-center">
            <span className="text-xs text-[var(--text-muted)] mb-1">{k}</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              {(metrics as unknown as Record<string, number>)[k.toLowerCase()]}%
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
