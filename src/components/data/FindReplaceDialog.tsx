import { useCallback, useEffect, useRef, useState } from 'react';
import type { GridApi } from 'ag-grid-community';
import { cn } from '@/utils/cn';
import { Search, Replace, ChevronDown, ChevronUp, X, CaseSensitive, Regex } from 'lucide-react';

interface FindReplaceDialogProps {
  gridApi: GridApi | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MatchResult {
  rowIndex: number;
  colId: string;
  value: string;
}

export function FindReplaceDialog({ gridApi, isOpen, onClose }: FindReplaceDialogProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [searchInFormulas, setSearchInFormulas] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  const [replaceAllFeedback, setReplaceAllFeedback] = useState<string | null>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen && findInputRef.current) {
      findInputRef.current.focus();
      findInputRef.current.select();
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Search for matches
  const handleFind = useCallback(() => {
    if (!gridApi || !findText) {
      setMatches([]);
      setCurrentMatchIdx(-1);
      return;
    }

    const results: MatchResult[] = [];

    gridApi.forEachNode((node) => {
      if (!node.data) return;
      const cols = gridApi.getColumns() ?? [];
      for (const col of cols) {
        const colId = col.getColId();
        const rawValue = node.data[colId];
        if (rawValue == null) continue;

        let cellStr: string;
        if (searchInFormulas && typeof rawValue === 'string' && rawValue.startsWith('=')) {
          cellStr = rawValue;
        } else {
          cellStr = String(rawValue);
        }

        const compareStr = matchCase ? cellStr : cellStr.toLowerCase();

        let isMatch = false;
        if (useRegex) {
          try {
            const flags = matchCase ? 'g' : 'gi';
            const regex = new RegExp(findText, flags);
            isMatch = regex.test(cellStr);
          } catch {
            // Invalid regex — fall back to literal
            isMatch = compareStr.includes(searchStr);
          }
        } else {
          isMatch = compareStr.includes(searchStr);
        }

        if (isMatch) {
          results.push({
            rowIndex: node.rowIndex!,
            colId,
            value: cellStr,
          });
        }
      }
    });

    setMatches(results);
    setCurrentMatchIdx(results.length > 0 ? 0 : -1);

    // Navigate to first match
    if (results.length > 0) {
      navigateToMatch(results[0]);
    }
  }, [gridApi, findText, matchCase, useRegex, searchInFormulas]);

  const navigateToMatch = useCallback(
    (match: MatchResult) => {
      if (!gridApi) return;
      gridApi.setFocusedCell(match.rowIndex, match.colId);
      gridApi.ensureIndexVisible(match.rowIndex, 'middle');
    },
    [gridApi]
  );

  const goToNext = useCallback(() => {
    if (matches.length === 0) return;
    const next = (currentMatchIdx + 1) % matches.length;
    setCurrentMatchIdx(next);
    navigateToMatch(matches[next]);
  }, [matches, currentMatchIdx, navigateToMatch]);

  const goToPrev = useCallback(() => {
    if (matches.length === 0) return;
    const prev = (currentMatchIdx - 1 + matches.length) % matches.length;
    setCurrentMatchIdx(prev);
    navigateToMatch(matches[prev]);
  }, [matches, currentMatchIdx, navigateToMatch]);

  // Replace current match
  const handleReplace = useCallback(() => {
    if (!gridApi || currentMatchIdx < 0 || !matches[currentMatchIdx]) return;
    const match = matches[currentMatchIdx];
    const node = gridApi.getDisplayedRowAtIndex(match.rowIndex);
    if (node?.data) {
      const oldValue = String(node.data[match.colId] ?? '');
      let newValue: string;
      if (useRegex) {
        try {
          const flags = matchCase ? 'g' : 'gi';
          const regex = new RegExp(findText, flags);
          newValue = oldValue.replace(regex, replaceText);
        } catch {
          newValue = oldValue.split(findText).join(replaceText);
        }
      } else {
        const idx = matchCase
          ? oldValue.indexOf(findText)
          : oldValue.toLowerCase().indexOf(findText);
        if (idx >= 0) {
          newValue =
            oldValue.substring(0, idx) + replaceText + oldValue.substring(idx + findText.length);
        } else {
          newValue = oldValue;
        }
      }
      node.setDataValue(match.colId, newValue);
    }
    // Move to next match
    goToNext();
    // Re-search to update match positions
    handleFind();
  }, [
    gridApi,
    currentMatchIdx,
    matches,
    findText,
    replaceText,
    matchCase,
    useRegex,
    goToNext,
    handleFind,
  ]);

  // Replace all matches
  const handleReplaceAll = useCallback(() => {
    if (!gridApi || !findText) return;
    let count = 0;

    gridApi.forEachNode((node) => {
      if (!node.data) return;
      const cols = gridApi.getColumns() ?? [];
      for (const col of cols) {
        const colId = col.getColId();
        const rawValue = node.data[colId];
        if (rawValue == null) continue;

        const cellStr = String(rawValue);
        const compareStr = matchCase ? cellStr : cellStr.toLowerCase();

        let isMatch = false;
        if (useRegex) {
          try {
            const flags = matchCase ? 'g' : 'gi';
            const regex = new RegExp(findText, flags);
            isMatch = regex.test(cellStr);
          } catch {
            isMatch = compareStr.includes(searchStr);
          }
        } else {
          isMatch = compareStr.includes(searchStr);
        }

        if (isMatch) {
          let newValue: string;
          if (useRegex) {
            try {
              const flags = matchCase ? 'g' : 'gi';
              const regex = new RegExp(findText, flags);
              newValue = cellStr.replace(regex, replaceText);
            } catch {
              newValue = cellStr.split(findText).join(replaceText);
            }
          } else {
            if (matchCase) {
              newValue = cellStr.split(findText).join(replaceText);
            } else {
              const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
              newValue = cellStr.replace(regex, replaceText);
            }
          }
          node.setDataValue(colId, newValue);
          count++;
        }
      }
    });

    setReplaceAllFeedback(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`);
    setTimeout(() => setReplaceAllFeedback(null), 3000);
    handleFind();
  }, [gridApi, findText, replaceText, matchCase, useRegex, handleFind]);

  // Enter to find next
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          goToPrev();
        } else if (currentMatchIdx >= 0 && matches.length > 0) {
          goToNext();
        } else {
          handleFind();
        }
      }
    },
    [goToNext, goToPrev, handleFind, currentMatchIdx, matches.length]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 w-[420px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl"
      role="dialog"
      aria-label="Find and Replace"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)]">
        <span className="text-sm font-semibold text-[var(--text-primary)]">Find and Replace</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--bg-muted)] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Find row */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
          <input
            ref={findInputRef}
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find..."
            className="flex-1 px-2 py-1.5 text-sm border border-[var(--border-subtle)] rounded bg-[var(--bg-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Find text"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMatchCase(!matchCase)}
              className={cn(
                'p-1.5 rounded transition-colors',
                matchCase
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'hover:bg-[var(--bg-muted)] text-[var(--text-tertiary)]'
              )}
              aria-label="Match case"
              title="Match Case"
            >
              <CaseSensitive className="w-4 h-4" />
            </button>
            <button
              onClick={() => setUseRegex(!useRegex)}
              className={cn(
                'p-1.5 rounded transition-colors',
                useRegex
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'hover:bg-[var(--bg-muted)] text-[var(--text-tertiary)]'
              )}
              aria-label="Use regex"
              title="Regular Expression"
            >
              <Regex className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Replace row */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2">
          <Replace className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace..."
            className="flex-1 px-2 py-1.5 text-sm border border-[var(--border-subtle)] rounded bg-[var(--bg-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Replace text"
          />
          <label className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={searchInFormulas}
              onChange={(e) => setSearchInFormulas(e.target.checked)}
              className="rounded"
            />
            Formulas
          </label>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-muted)] rounded-b-lg">
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrev}
            disabled={matches.length === 0}
            className="p-1.5 rounded hover:bg-[var(--bg-surface)] disabled:opacity-30 transition-colors"
            aria-label="Previous match"
            title="Previous (Shift+Enter)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            disabled={matches.length === 0}
            className="p-1.5 rounded hover:bg-[var(--bg-surface)] disabled:opacity-30 transition-colors"
            aria-label="Next match"
            title="Next (Enter)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <span className="ml-2 text-xs text-[var(--text-tertiary)]" aria-live="polite">
            {matches.length > 0
              ? `${currentMatchIdx + 1} of ${matches.length}`
              : findText
                ? 'No results'
                : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {replaceAllFeedback && (
            <span className="text-xs fin-positive mr-2" role="status">
              {replaceAllFeedback}
            </span>
          )}
          <button
            onClick={handleReplace}
            disabled={currentMatchIdx < 0}
            className="px-2.5 py-1 text-xs font-medium rounded border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] disabled:opacity-30 transition-colors"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
            className="px-2.5 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 transition-colors"
          >
            Replace All
          </button>
        </div>
      </div>
    </div>
  );
}
