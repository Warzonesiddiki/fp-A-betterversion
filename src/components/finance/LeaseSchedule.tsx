import { ComboChart } from '@/components/ui/ComboChart';

export function LeaseSchedule() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <ComboChart
        data={[]}
        xKey="period"
        yKeys={[
          { key: 'rou', color: '#10b981', name: 'ROU Asset' },
          { key: 'liability', color: '#f43f5e', name: 'Liability' },
        ]}
      />
    </div>
  );
}
