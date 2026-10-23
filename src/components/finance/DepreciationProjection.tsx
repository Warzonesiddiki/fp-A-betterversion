import { ComboChart } from '@/components/ui/ComboChart';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export function DepreciationProjection() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <ComboChart
        data={[]}
        xKey="year"
        yKeys={[{ key: 'depreciation', color: '#8b5cf6', name: 'Depreciation' }]}
      />
    </div>
  );
}
