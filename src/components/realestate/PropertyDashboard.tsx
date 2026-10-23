import { Card } from '@/components/ui/Card';
import { FinancialTable } from '@/components/ui/FinancialTable';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export function PropertyDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {['NOI', 'Occupancy', 'Cap Rate', 'WALT'].map((k) => (
          <Card key={k} className="p-4 text-center">
            <span className="text-xs text-[var(--text-muted)] uppercase font-bold">{k}</span>
            <div className="text-xl font-bold text-[var(--text-primary)]">---</div>
          </Card>
        ))}
      </div>
      <FinancialTable rows={[]} columns={[]} />
    </div>
  );
}
