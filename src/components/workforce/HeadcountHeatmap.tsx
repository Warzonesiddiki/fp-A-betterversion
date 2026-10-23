import { Heatmap } from '@/components/ui/Heatmap';

export function HeadcountHeatmap() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <Heatmap data={[]} />
    </div>
  );
}
