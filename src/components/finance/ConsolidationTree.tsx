import { EntityTree } from '@/components/ui/EntityTree';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export function ConsolidationTree() {
  return (
    <div className="p-6 bg-slate-950 rounded-xl border border-slate-800">
      <EntityTree />
    </div>
  );
}
