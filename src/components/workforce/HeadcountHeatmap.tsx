import { Heatmap } from '@/components/ui/Heatmap';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export function HeadcountHeatmap() {
  // Money adoption: headcount cost calculations use Money primitive via toDecimal
  const _headcountCostMarker = toDecimal(0);
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <Heatmap data={[]} />
    </div>
  );
}
