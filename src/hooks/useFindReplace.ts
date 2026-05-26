import { useState, useCallback, useRef, useEffect } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { DataGridColumn } from '@/components/ui/DataGrid';

export function useFindReplace(
  gridRef: React.RefObject<AgGridReact | null>,
  columns: DataGridColumn[]
) {
  const findInputRef = useRef<HTMLInputElement>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  useEffect(() => {
    if (showFindReplace) {
      findInputRef.current?.focus();
    }
  }, [showFindReplace]);

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const handleFind = useCallback(() => {
    if (!gridRef.current || !findText) return;
    gridRef.current.api.setGridOption('quickFilterText', findText);
  }, [gridRef, findText]);

  const handleReplace = useCallback(() => {
    if (!gridRef.current || !findText) return;
    const api = gridRef.current.api;
    const escaped = escapeRegex(findText);
    api.forEachNode((node) => {
      if (node.data) {
        columns.forEach((col) => {
          const val = String(node.data[col.field] ?? '');
          if (val.toLowerCase().includes(findText.toLowerCase())) {
            node.setDataValue(col.field, val.replace(new RegExp(escaped, 'gi'), replaceText));
          }
        });
      }
    });
  }, [gridRef, findText, replaceText, columns]);

  const closeFindReplace = useCallback(() => {
    setShowFindReplace(false);
    gridRef.current?.api.setGridOption('quickFilterText', '');
  }, [gridRef]);

  return {
    findInputRef,
    showFindReplace,
    setShowFindReplace,
    findText,
    setFindText,
    replaceText,
    setReplaceText,
    handleFind,
    handleReplace,
    closeFindReplace,
  };
}
