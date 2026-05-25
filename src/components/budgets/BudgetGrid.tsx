import { useMemo } from 'react';
import { DataGrid, type DataGridColumn } from '@/components/ui/DataGrid';
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
  const columns: DataGridColumn[] = useMemo(
    () => [
      { field: 'accountCode', headerName: 'Code', width: 100 },
      { field: 'accountName', headerName: 'Account', flex: 1 },
      { field: 'amount', headerName: 'Amount', width: 120, type: 'currency', editable: true },
    ],
    []
  );

  const rows = useMemo(
    () => lineItems.map((item) => ({ ...item }) as Record<string, unknown>),
    [lineItems]
  );

  const handleCellValueChanged = (event: {
    data: Record<string, unknown>;
    colDef: { field?: string };
    newValue: unknown;
  }) => {
    if (event.colDef.field === 'amount') {
      onCellEdit(event.data.id as string, Number(event.newValue));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      <div className="p-2 border-b border-[var(--border-subtle)] flex items-center gap-4 bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            className="p-1.5 hover:bg-[var(--bg-hover)] rounded disabled:opacity-30 text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            className="p-1.5 hover:bg-[var(--bg-hover)] rounded disabled:opacity-30 text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            Redo
          </button>
        </div>
        <FormulaBar className="flex-1" />
      </div>
      <div className="flex-1 overflow-hidden">
        <DataGrid
          rows={rows}
          columns={columns}
          onCellValueChanged={handleCellValueChanged as any}
        />
      </div>
    </div>
  );
}
