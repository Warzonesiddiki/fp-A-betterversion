import { useState, useCallback } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { DataGridColumn } from '@/components/ui/DataGrid';

export interface SelectionStats {
  sum: number;
  avg: number;
  count: number;
  min: number;
  max: number;
}

export function useSelectionStats(
  gridRef: React.RefObject<AgGridReact | null>,
  columns: DataGridColumn[]
) {
  const [selectionStats, setSelectionStats] = useState<SelectionStats | null>(null);

  const updateSelectionStats = useCallback(() => {
    if (!gridRef.current) {
      setSelectionStats(null);
      return;
    }
    const selected = gridRef.current.api.getSelectedRows();
    if (!selected.length) {
      setSelectionStats(null);
      return;
    }
    const numericValues = selected
      .flatMap((row) =>
        columns
          .filter((c) => c.type === 'currency' || c.type === 'number' || c.type === 'percent')
          .map((c) => row[c.field])
      )
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (!numericValues.length) {
      setSelectionStats(null);
      return;
    }
    const sum = numericValues.reduce((a, b) => a + b, 0);
    setSelectionStats({
      sum,
      avg: sum / numericValues.length,
      count: numericValues.length,
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
    });
  }, [gridRef, columns]);

  return { selectionStats, updateSelectionStats };
}
