import { DataGrid } from '@/components/ui/DataGrid';

export function GLTrialBalanceGrid() {
  return (
    <div className="h-[600px] border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
      <DataGrid rows={[]} columns={[]} />
    </div>
  );
}
