import { Card } from '@/components/ui/Card';
import { FinancialTable } from '@/components/ui/FinancialTable';

export function PropertyDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {['NOI', 'Occupancy', 'Cap Rate', 'WALT'].map((k) => (
          <Card key={k} className="p-4 text-center">
            <span className="text-xs text-slate-500 uppercase font-bold">{k}</span>
            <div className="text-xl font-bold text-[var(--text-primary)]">---</div>
          </Card>
        ))}
      </div>
      <FinancialTable rows={[]} columns={[]} />
    </div>
  );
}
