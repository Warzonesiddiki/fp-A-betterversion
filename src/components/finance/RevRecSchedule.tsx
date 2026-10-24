import { ComboChart } from '@/components/ui/ComboChart';

export function RevRecSchedule() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <ComboChart
        data={[]}
        xKey="period"
        yKeys={[{ key: 'revenue', color: '#3b82f6', name: 'Revenue' }]}
      />
    </div>
  );
}
