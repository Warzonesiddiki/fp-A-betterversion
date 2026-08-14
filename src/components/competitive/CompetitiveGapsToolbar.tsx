/**
 * CompetitiveGapsToolbar — Phase 4 G12 UI bar
 *
 * Renders the 7 competitive gap actions in a compact toolbar:
 *  - Merge Scenario (1)
 *  - Lock/Unlock Scenario (2)
 *  - Drag-Fill (3)
 *  - Context Menu (4)
 *  - Auto-Sum (5)
 *  - Sheet Tabs (6)
 *  - Auto-Update (7)
 *
 * Connect this to any spreadsheet-like page (ScenarioBuilder, ForecastBuilder,
 * etc.) to expose the competitive feature set.
 */
import { useState, useCallback } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';
import {
  useSheetTabs,
  useGridContextMenu,
  useSheetStore,
  applyDragFill,
  applyAutoSum,
  useAutoUpdate,
  type ContextMenuItem,
} from '@/utils/competitiveGaps';
import { Lock, Unlock, Combine, ArrowDown, Sigma, Plus, X, Edit2 } from 'lucide-react';

interface CompetitiveGapsToolbarProps {
  activeSheetId?: string | null;
  onContextMenu?: (cellRef: string) => void;
  selectedRange?: { start: string; end: string } | null;
}

export function CompetitiveGapsToolbar({
  activeSheetId = null,
  onContextMenu,
  selectedRange = null,
}: CompetitiveGapsToolbarProps) {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const selectedId = useScenarioStore((s) => s.selectedScenarioId);
  const lockScenario = useScenarioStore((s) => s.lockScenario);
  const unlockScenario = useScenarioStore((s) => s.unlockScenario);
  const mergeScenarios = useScenarioStore((s) => s.mergeScenarios);

  const { sheets, addSheet, removeSheet, renameSheet, setActiveSheet } = useSheetTabs();
  const { openMenu } = useGridContextMenu();

  // Drive auto-update for active sheet
  useAutoUpdate(activeSheetId);

  const selectedScenario = scenarios.find((s) => s.id === selectedId);
  const isLocked = selectedScenario?.isLocked === true;

  const [mergeSourceId, setMergeSourceId] = useState<string>('');
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState<string>('');

  const handleLockToggle = useCallback(() => {
    if (!selectedId) return;
    if (isLocked) {
      unlockScenario(selectedId);
    } else {
      lockScenario(selectedId);
    }
  }, [selectedId, isLocked, lockScenario, unlockScenario]);

  const handleMerge = useCallback(() => {
    if (!mergeSourceId || !mergeTargetId) return;
    if (mergeSourceId === mergeTargetId) return;
    mergeScenarios(mergeSourceId, mergeTargetId);
    setMergeSourceId('');
    setMergeTargetId('');
  }, [mergeSourceId, mergeTargetId, mergeScenarios]);

  const handleAutoSum = useCallback(() => {
    if (!activeSheetId || !selectedRange) return;
    const result = applyAutoSum(selectedRange.start, selectedRange.end);
    if (result.formula) {
      // The page consumer is expected to handle the actual cell write
      onContextMenu?.(`autosum:${activeSheetId}:${result.formula}`);
    }
  }, [activeSheetId, selectedRange, onContextMenu]);

  const openContextMenuForActive = useCallback(
    (e: React.MouseEvent, cellRef: string) => {
      e.preventDefault();
      const items: ContextMenuItem[] = [
        { id: 'cut', label: 'Cut', onClick: () => onContextMenu?.(`cut:${cellRef}`) },
        { id: 'copy', label: 'Copy', onClick: () => onContextMenu?.(`copy:${cellRef}`) },
        { id: 'paste', label: 'Paste', onClick: () => onContextMenu?.(`paste:${cellRef}`) },
        { id: 'sep1', label: '', separator: true, onClick: () => {} },
        {
          id: 'insert-row',
          label: 'Insert Row Above',
          onClick: () => onContextMenu?.(`insert-row:${cellRef}`),
        },
        {
          id: 'insert-col',
          label: 'Insert Column Left',
          onClick: () => onContextMenu?.(`insert-col:${cellRef}`),
        },
        { id: 'sep2', label: '', separator: true, onClick: () => {} },
        {
          id: 'fill-down',
          label: 'Fill Down',
          onClick: () => onContextMenu?.(`fill-down:${cellRef}`),
        },
        {
          id: 'fill-right',
          label: 'Fill Right',
          onClick: () => onContextMenu?.(`fill-right:${cellRef}`),
        },
        { id: 'autosum', label: 'Auto-Sum (Σ)', onClick: handleAutoSum, disabled: !selectedRange },
      ];
      openMenu(e.clientX, e.clientY, cellRef, items);
    },
    [openMenu, onContextMenu, handleAutoSum, selectedRange]
  );

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
      data-testid="competitive-gaps-toolbar"
    >
      {/* (1) Scenario Merge */}
      <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
        <Combine className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
        <select
          aria-label="Merge source scenario"
          value={mergeSourceId}
          onChange={(e) => setMergeSourceId(e.target.value)}
          className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs px-1 py-0.5"
        >
          <option value="">Source…</option>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Merge target scenario"
          value={mergeTargetId}
          onChange={(e) => setMergeTargetId(e.target.value)}
          className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs px-1 py-0.5"
        >
          <option value="">Target…</option>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleMerge}
          disabled={!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId}
          className="inline-flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs px-2 py-1"
          title="Merge source and target into a new scenario"
        >
          Merge
        </button>
      </div>

      {/* (2) Scenario Locking */}
      <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
        {isLocked ? (
          <Lock className="h-4 w-4 text-amber-700" aria-hidden="true" />
        ) : (
          <Unlock className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={handleLockToggle}
          disabled={!selectedId}
          className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-600 text-xs px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          title={isLocked ? 'Unlock scenario to allow edits' : 'Lock scenario to prevent edits'}
        >
          {isLocked ? 'Unlock' : 'Lock'}
        </button>
      </div>

      {/* (3) Drag-Fill + (4) Context Menu + (5) Auto-Sum (these are grid-driven, toolbar shows hint) */}
      <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 text-xs text-slate-600 dark:text-slate-300">
        <ArrowDown className="h-4 w-4" aria-hidden="true" />
        <span>Drag corner to fill</span>
        <button
          type="button"
          onClick={(e) => openContextMenuForActive(e, activeSheetId ? 'A1' : '')}
          className="ml-2 rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Open context menu (right-click also works)"
        >
          Context Menu
        </button>
        <button
          type="button"
          onClick={handleAutoSum}
          disabled={!selectedRange}
          className="inline-flex items-center gap-1 ml-1 rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          title="Insert SUM() into active cell over selected range"
        >
          <Sigma className="h-3 w-3" /> Auto-Sum
        </button>
      </div>

      {/* (6) Sheet Tabs */}
      <div
        className="flex items-center gap-1 flex-1 min-w-0"
        role="tablist"
        aria-label="Workbook sheets"
      >
        {sheets.map((sh) => (
          <div
            key={sh.id}
            className={`flex items-center gap-1 rounded-t-md border-b-2 px-2 py-1 text-xs cursor-pointer ${
              sh.id === activeSheetId
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
            role="tab"
            aria-selected={sh.id === activeSheetId}
            tabIndex={0}
            onClick={() => setActiveSheet(sh.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveSheet(sh.id);
              }
            }}
          >
            {renamingId === sh.id ? (
              <input
                value={renamingValue}
                onChange={(e) => setRenamingValue(e.target.value)}
                onBlur={() => {
                  if (renamingValue.trim()) renameSheet(sh.id, renamingValue.trim());
                  setRenamingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (renamingValue.trim()) renameSheet(sh.id, renamingValue.trim());
                    setRenamingId(null);
                  }
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                className="w-20 rounded border border-slate-300 bg-white dark:bg-slate-800 px-1 text-xs"
                aria-label={`Rename sheet ${sh.name}`}
                onFocus={(e) => e.currentTarget.select()}
              />
            ) : (
              <>
                <span>{sh.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(sh.id);
                    setRenamingValue(sh.name);
                  }}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label={`Rename ${sh.name}`}
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                {sheets.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSheet(sh.id);
                    }}
                    className="text-slate-400 hover:text-red-600"
                    aria-label={`Delete ${sh.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addSheet(`Sheet${sheets.length + 1}`)}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 dark:border-slate-600 px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Add new sheet"
        >
          <Plus className="h-3 w-3" /> Sheet
        </button>
      </div>

      {/* (7) Auto-Update indicator (always-on, just shown) */}
      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
        Auto-Update: ON
      </div>
    </div>
  );
}

/**
 * Helper hook that pages can use to expose (3) Drag-Fill programmatically.
 * Pair with the toolbar's onContextMenu to apply the fill.
 */
export function useGridDragFill(sheetId: string) {
  const setCell = useSheetStore((s) => s.setCell);
  const getCell = useSheetStore((s) => s.getCell);
  return useCallback(
    (sourceRef: string, targetRefs: string[]) => {
      const source = getCell(sheetId, sourceRef);
      if (!source) return;
      const fillMap = applyDragFill(source, sourceRef, targetRefs);
      for (const [ref, cell] of Object.entries(fillMap)) {
        setCell(sheetId, ref, cell);
      }
    },
    [sheetId, getCell, setCell]
  );
}

// Re-export for convenience
export { useSheetStore };
