import { useState, useCallback } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { DataGridColumn, SelectionStats } from './DataGrid.types';

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function useDataGridHandlers(
  gridRef: React.RefObject<AgGridReact | null>,
  columns: DataGridColumn[],
  rows: Record<string, unknown>[]
) {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [groupColumn, setGroupColumn] = useState<string | null>(null);
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

  const handleExport = useCallback(() => {
    if (!gridRef.current) return;
    const visibleCols = columns.filter((c) => !hiddenColumns.has(c.field));
    const header = visibleCols.map((c) => c.headerName).join(',');
    const dataRows = rows.map((row) =>
      visibleCols
        .map((c) => {
          const val = row[c.field];
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return String(val ?? '');
        })
        .join(',')
    );
    const csv = [header, ...dataRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [gridRef, columns, rows, hiddenColumns]);

  const toggleColumn = useCallback((field: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }, []);

  const handleGroupBy = useCallback((field: string | null) => {
    setGroupColumn(field);
  }, []);

  const handleFind = useCallback(
    (findText: string) => {
      if (!gridRef.current || !findText) return;
      gridRef.current.api.setGridOption('quickFilterText', findText);
    },
    [gridRef]
  );

  const handleReplace = useCallback(
    (findText: string, replaceText: string) => {
      if (!gridRef.current || !findText) return;
      const escaped = escapeRegex(findText);
      gridRef.current.api.forEachNode((node) => {
        if (node.data) {
          columns.forEach((col) => {
            const val = String(node.data[col.field] ?? '');
            if (val.toLowerCase().includes(findText.toLowerCase())) {
              node.setDataValue(col.field, val.replace(new RegExp(escaped, 'gi'), replaceText));
            }
          });
        }
      });
    },
    [gridRef, columns]
  );

  return {
    hiddenColumns,
    groupColumn,
    selectionStats,
    updateSelectionStats,
    handleExport,
    toggleColumn,
    handleGroupBy,
    handleFind,
    handleReplace,
  };
}
