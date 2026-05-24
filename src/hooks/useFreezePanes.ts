import { useCallback, useState } from 'react';
import type { GridApi } from 'ag-grid-community';

interface FreezeState {
  frozenRows: number;
  frozenCols: number;
}

export function useFreezePanes(gridApi: GridApi | null) {
  const [freezeState, setFreezeState] = useState<FreezeState>({ frozenRows: 0, frozenCols: 0 });

  const freezeTopRow = useCallback(() => {
    if (!gridApi) return;
    setFreezeState((prev) => ({ ...prev, frozenRows: 1 }));
  }, [gridApi]);

  const freezeFirstColumns = useCallback(
    (count: number) => {
      if (!gridApi) return;
      const allCols = gridApi.getColumns();
      if (!allCols) return;
      allCols.forEach((col, i) => {
        if (i < count) {
          gridApi.setColumnsPinned([col.getColId()], 'left');
        } else {
          gridApi.setColumnsPinned([col.getColId()], null);
        }
      });
      setFreezeState((prev) => ({ ...prev, frozenCols: count }));
    },
    [gridApi]
  );

  const freezeBoth = useCallback(
    (rowCount: number, colCount: number) => {
      freezeTopRow();
      freezeFirstColumns(colCount);
    },
    [freezeTopRow, freezeFirstColumns]
  );

  const unfreeze = useCallback(() => {
    if (!gridApi) return;
    const allCols = gridApi.getColumns();
    if (allCols) {
      allCols.forEach((col) => {
        gridApi.setColumnsPinned([col.getColId()], null);
      });
    }
    setFreezeState({ frozenRows: 0, frozenCols: 0 });
  }, [gridApi]);

  return {
    ...freezeState,
    freezeTopRow,
    freezeFirstColumns,
    freezeBoth,
    unfreeze,
    isFrozen: freezeState.frozenRows > 0 || freezeState.frozenCols > 0,
  };
}
