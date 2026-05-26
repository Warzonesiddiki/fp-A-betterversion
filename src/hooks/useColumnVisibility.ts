import { useState, useCallback, useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';

export function useColumnVisibility(columnDefs: ColDef[]) {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [groupColumn, setGroupColumn] = useState<string | null>(null);

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

  const visibleColumnDefs = useMemo<ColDef[]>(() => {
    const defs = columnDefs.filter((col) => !hiddenColumns.has(col.field ?? ''));
    if (groupColumn) {
      return [
        { field: groupColumn, rowGroup: true, hide: true },
        ...defs.filter((c) => c.field !== groupColumn),
      ];
    }
    return defs;
  }, [columnDefs, hiddenColumns, groupColumn]);

  return {
    hiddenColumns,
    showColumnMenu,
    setShowColumnMenu,
    groupColumn,
    toggleColumn,
    handleGroupBy,
    visibleColumnDefs,
  };
}
