import { GaugeChart } from '@/components/ui/GaugeChart';
import { Card } from '@/components/ui/Card';

export function ESGDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 flex flex-col items-center gap-4">
        <span className="text-sm font-bold text-[var(--text-muted)] uppercase">
          Carbon Footprint
        </span>
        <GaugeChart value={65} min={0} max={100} label="Carbon Footprint" />
      </Card>
      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        <Card className="p-6">
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">
            Emissions Breakdown
          </h4>
          <div className="space-y-3">
            {['Scope 1', 'Scope 2', 'Scope 3'].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-16">{s}</span>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">Diversity Score</span>
          <span className="text-4xl font-bold text-slate-900 dark:text-white">82</span>
        </Card>
      </div>
    </div>
  );
}
