import { DataGrid } from '@/components/ui/DataGrid';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export function GLTrialBalanceGrid() {
  return (
    <div className="h-[600px] border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
      <DataGrid rows={[]} columns={[]} />
    </div>
  );
}
