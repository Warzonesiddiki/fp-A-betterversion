import { ComboChart } from '@/components/ui/ComboChart';

export function MRRBreakdown() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <ComboChart
        data={[]}
        xKey="month"
        yKeys={[
          { key: 'new', color: '#22c55e', name: 'New' },
          { key: 'expansion', color: '#3b82f6', name: 'Expansion' },
          { key: 'contraction', color: '#f59e0b', name: 'Contraction' },
          { key: 'churn', color: '#ef4444', name: 'Churn' },
        ]}
      />
    </div>
  );
}
