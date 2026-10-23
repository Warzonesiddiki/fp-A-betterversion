import React, { useState, useRef, useCallback } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SheetTab {
  id: string;
  name: string;
}

export interface SheetTabsProps {
  sheets: SheetTab[];
  activeSheetId: string;
  onSheetChange: (sheetId: string) => void;
  onSheetAdd: () => void;
  onSheetRename: (sheetId: string, name: string) => void;
  onSheetDelete: (sheetId: string) => void;
  onSheetReorder: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

export function SheetTabs({
  sheets,
  activeSheetId,
  onSheetChange,
  onSheetAdd,
  onSheetRename,
  onSheetDelete,
  onSheetReorder,
  className,
}: SheetTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; sheetId: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback((sheet: SheetTab) => {
    setEditingId(sheet.id);
    setEditValue(sheet.name);
    setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  const handleRenameSubmit = useCallback(
    (sheetId: string) => {
      if (editValue.trim()) {
        onSheetRename(sheetId, editValue.trim());
      }
      setEditingId(null);
    },
    [editValue, onSheetRename]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent, sheetId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, sheetId });
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== index) {
        onSheetReorder(dragIndex, index);
        setDragIndex(index);
      }
    },
    [dragIndex, onSheetReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 px-2 py-1 bg-[var(--bg-muted)] border border-t-0 border-[var(--border-subtle)] rounded-b-lg overflow-x-auto',
        className
      )}
      role="tablist"
      aria-label="Spreadsheet Sheets"
    >
      {sheets.map((sheet, index) => (
        <div
          key={sheet.id}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-t-md cursor-pointer transition-colors select-none',
            'border border-b-0 border-transparent focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
            sheet.id === activeSheetId
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-subtle)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]/50',
            dragIndex === index && 'opacity-50'
          )}
          role="tab"
          tabIndex={0}
          aria-selected={sheet.id === activeSheetId}
          onClick={() => onSheetChange(sheet.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSheetChange(sheet.id);
            }
          }}
          onDoubleClick={() => handleDoubleClick(sheet)}
          onContextMenu={(e) => handleContextMenu(e, sheet.id)}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
        >
          <GripVertical className="h-3 w-3 opacity-30 cursor-grab" />

          {editingId === sheet.id ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleRenameSubmit(sheet.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(sheet.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="w-20 px-1 py-0 text-xs bg-[var(--bg-surface)] border border-blue-400 rounded outline-none"
              aria-label={`Rename sheet ${sheet.name}`}
            />
          ) : (
            <span>{sheet.name}</span>
          )}

          {sheets.length > 1 && sheet.id === activeSheetId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSheetDelete(sheet.id);
              }}
              className="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--text-muted)] hover:fin-negative transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              aria-label={`Delete sheet ${sheet.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {/* Add Sheet Button */}
      <button
        onClick={onSheetAdd}
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50 rounded-t-md transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        aria-label="Add new sheet"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setContextMenu(null);
            }}
            role="button"
            tabIndex={0}
          />
          <div
            className="fixed z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md shadow-lg py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: 'auto', bottom: 40 }}
            role="menu"
            aria-label="Sheet actions"
          >
            <button
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              role="menuitem"
              onClick={() => {
                const sheet = sheets.find((s) => s.id === contextMenu.sheetId);
                if (sheet) handleDoubleClick(sheet);
                setContextMenu(null);
              }}
            >
              Rename
            </button>
            {sheets.length > 1 && (
              <button
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-hover)] fin-negative focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                role="menuitem"
                onClick={() => {
                  onSheetDelete(contextMenu.sheetId);
                  setContextMenu(null);
                }}
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
