import { Sparkline } from '@/components/ui/Sparkline';
import { DataTable } from '@/components/ui/DataTable';

export function GLAccountDrillDown() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">61000 - Professional Services</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Operating Expenses / Outside Services
          </p>
        </div>
        <div className="w-48 h-12">
          <Sparkline data={[10, 15, 8, 20, 12, 18, 25]} color="#3b82f6" />
        </div>
      </div>
      <DataTable data={[]} columns={[]} />
    </div>
  );
}
