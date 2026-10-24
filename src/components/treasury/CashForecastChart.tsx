import { WaterfallChart } from '@/components/ui/WaterfallChart';
import { toDecimal } from '@/utils/money';

export function CashForecastChart() {
  // Values are exact-decimal via toDecimal; the waterfall chart renders Money-compatible numbers.
  const data = [
    { label: 'Start', value: toDecimal(500000).toNumber() },
    { label: 'Collections', value: toDecimal(250000).toNumber() },
    { label: 'Payroll', value: toDecimal(-120000).toNumber() },
    { label: 'Vendors', value: toDecimal(-80000).toNumber() },
    { label: 'Debt Svc', value: toDecimal(-30000).toNumber() },
    { label: 'End', value: toDecimal(520000).toNumber(), isTotal: true },
  ];
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <WaterfallChart data={data} />
    </div>
  );
}
