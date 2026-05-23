import { DataGrid } from '@/components/ui/DataGrid';
import { FormulaBar } from '@/components/ui/FormulaBar';
import type { BudgetLineItem, GLAccount } from '@/types';

export interface BudgetGridProps {
  lineItems: BudgetLineItem[];
  accounts: GLAccount[];
  onCellEdit: (id: string, amount: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function BudgetGrid({
  lineItems,
  onCellEdit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: BudgetGridProps) {
  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      <div className="p-2 border-b border-slate-800 flex items-center gap-4 bg-slate-900">
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-30 text-slate-300"
          >
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-30 text-slate-300"
          >
            Redo
          </button>
        </div>
        <FormulaBar className="flex-1" />
      </div>
      <div className="flex-1 overflow-hidden">
        <DataGrid data={lineItems} onCellChange={(id, value) => onCellEdit(id, Number(value))} />
      </div>
    </div>
  );
}
