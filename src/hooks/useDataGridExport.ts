import { useCallback } from 'react';
import type { DataGridColumn } from '@/components/ui/DataGrid';

export function useDataGridExport(
  columns: DataGridColumn[],
  rows: Record<string, unknown>[],
  hiddenColumns: Set<string>
) {
  const handleExport = useCallback(() => {
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
  }, [columns, rows, hiddenColumns]);

  return { handleExport };
}
