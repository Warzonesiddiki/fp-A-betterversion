import { WaterfallChart } from '@/components/ui/WaterfallChart';

export function ChurnWaterfall() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <WaterfallChart
        data={[
          { label: 'Beginning', value: 100000 },
          { label: 'New', value: 20000 },
          { label: 'Expansion', value: 5000 },
          { label: 'Contraction', value: -2000 },
          { label: 'Churn', value: -8000 },
          { label: 'Ending', value: 115000, isTotal: true },
        ]}
      />
    </div>
  );
}
