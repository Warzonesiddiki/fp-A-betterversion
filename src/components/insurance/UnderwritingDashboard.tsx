import { GaugeChart } from '@/components/ui/GaugeChart';
import { Card } from '@/components/ui/Card';

export function UnderwritingDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 flex flex-col items-center gap-4">
        <span className="text-sm font-bold text-[var(--text-muted)] uppercase">Combined Ratio</span>
        <GaugeChart value={92} min={0} max={150} label="Combined Ratio" />
      </Card>
      <div className="md:col-span-2">
        <Card className="p-6 h-full">
          <h4 className="text-sm font-bold text-slate-500 mb-4">Premium Trend</h4>
          <div className="h-48 bg-slate-900 rounded border border-slate-800 flex items-center justify-center text-slate-600">
            Premium Bar Chart
          </div>
        </Card>
      </div>
    </div>
  );
}
