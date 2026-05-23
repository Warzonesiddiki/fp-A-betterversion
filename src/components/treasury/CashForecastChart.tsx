import { WaterfallChart } from '@/components/ui/WaterfallChart';

export function CashForecastChart() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <WaterfallChart
        data={[
          { label: 'Start', value: 500000 },
          { label: 'Collections', value: 250000 },
          { label: 'Payroll', value: -120000 },
          { label: 'Vendors', value: -80000 },
          { label: 'Debt Svc', value: -30000 },
          { label: 'End', value: 520000, isTotal: true },
        ]}
      />
    </div>
  );
}
