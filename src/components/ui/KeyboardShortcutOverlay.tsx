import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Keyboard, Search, Printer, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { keyboardShortcuts, formatShortcut } from '@/config/keyboardShortcuts';
import { ExcelKeyboardShortcuts, type ShortcutCategory } from '@/engines/ExcelKeyboardShortcuts';

// ─── Types ───────────────────────────────────────────────────────────

type PageContext = 'grid' | 'dashboard' | 'reports' | 'general';

interface UnifiedShortcut {
  id: string;
  keys: string;
  description: string;
  category: string;
  source: 'app' | 'excel';
  contexts: PageContext[];
}

// ─── Context detection ───────────────────────────────────────────────

function getPageContext(pathname: string): PageContext {
  if (
    pathname.includes('/budgets') ||
    pathname.includes('/forecasts') ||
    pathname.includes('/scenarios') ||
    pathname.includes('/data/') ||
    pathname.includes('/gl-') ||
    pathname.includes('/chart-of-accounts')
  ) {
    return 'grid';
  }
  if (pathname === '/' || pathname.includes('/dashboard')) return 'dashboard';
  if (pathname.includes('/reports')) return 'reports';
  return 'general';
}

function getContextLabel(ctx: PageContext): string {
  switch (ctx) {
    case 'grid':
      return 'Spreadsheet / Grid';
    case 'dashboard':
      return 'Dashboard';
    case 'reports':
      return 'Reports';
    case 'general':
      return 'General';
  }
}

// ─── Shortcut merging ────────────────────────────────────────────────

function buildUnifiedShortcuts(): UnifiedShortcut[] {
  const result: UnifiedShortcut[] = [];

  // App-level shortcuts
  for (const s of keyboardShortcuts) {
    result.push({
      id: `app-${s.key}-${s.ctrl ? 'c' : ''}${s.shift ? 's' : ''}${s.alt ? 'a' : ''}`,
      keys: formatShortcut(s),
      description: s.description,
      category: s.category === 'General' ? 'Application' : s.category,
      source: 'app',
      contexts: ['general', 'dashboard', 'reports', 'grid'],
    });
  }

  // Excel-level shortcuts
  const excelAll = ExcelKeyboardShortcuts.getAll();
  for (const s of excelAll) {
    const keys = ExcelKeyboardShortcuts.formatKeys(s);
    // Skip duplicates already in app shortcuts
    const isDuplicate = result.some(
      (r) => r.keys === keys && r.description.toLowerCase() === s.description.toLowerCase()
    );
    if (isDuplicate) continue;

    const contexts: PageContext[] = ['grid'];
    if (s.category === 'Application') contexts.push('general', 'dashboard', 'reports');

    result.push({
      id: `excel-${s.id}`,
      keys,
      description: s.description,
      category: mapExcelCategory(s.category),
      source: 'excel',
      contexts,
    });
  }

  return result;
}

function mapExcelCategory(cat: ShortcutCategory): string {
  const map: Record<ShortcutCategory, string> = {
    Navigation: 'Grid Navigation',
    Selection: 'Grid Selection',
    Editing: 'Grid Editing',
    Clipboard: 'Clipboard',
    Formatting: 'Formatting',
    Formulas: 'Formulas',
    Data: 'Data',
    Sheets: 'Sheets',
    Application: 'Application',
  };
  return map[cat] ?? cat;
}

// ─── Key badge ───────────────────────────────────────────────────────

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5',
        'text-[11px] font-mono rounded border',
        'bg-gray-100 border-gray-300 text-gray-700',
        'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
      )}
      style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.1)' }}
    >
      {children}
    </kbd>
  );
}

function KeyCombo({ keys }: { keys: string }) {
  const parts = keys.split(' + ');
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-[10px] text-gray-400 dark:text-gray-500">+</span>}
          <KeyBadge>{p}</KeyBadge>
        </span>
      ))}
    </div>
  );
}

// ─── Category section ────────────────────────────────────────────────

function CategorySection({
  name,
  shortcuts,
  defaultOpen,
}: {
  name: string;
  shortcuts: UnifiedShortcut[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left',
          'hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors'
        )}
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        )}
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {name}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
          {shortcuts.length}
        </span>
      </button>
      {open && (
        <div className="ml-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 pb-2">
          {shortcuts.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded group">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate mr-3">
                {s.description}
              </span>
              <KeyCombo keys={s.keys} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Print styles ────────────────────────────────────────────────────

const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden; }
    #shortcut-print-area, #shortcut-print-area * { visibility: visible; }
    #shortcut-print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 24px;
      background: white;
      color: black;
    }
    #shortcut-print-area kbd {
      border: 1px solid #ccc;
      background: #f5f5f5;
      color: #333;
    }
  }
`;

// ─── Main component ──────────────────────────────────────────────────

interface KeyboardShortcutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutOverlay({ isOpen, onClose }: KeyboardShortcutOverlayProps) {
  const { pathname } = useLocation();
  const pageContext = getPageContext(pathname);
  const [search, setSearch] = useState('');
  const [contextFilter, setContextFilter] = useState<PageContext | 'all'>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  const allShortcuts = useMemo(() => buildUnifiedShortcuts(), []);

  // Filter shortcuts
  const filtered = useMemo(() => {
    let items = allShortcuts;

    // Context filter
    if (contextFilter !== 'all') {
      items = items.filter((s) => s.contexts.includes(contextFilter));
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (s) =>
          s.description.toLowerCase().includes(q) ||
          s.keys.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    return items;
  }, [allShortcuts, search, contextFilter]);

  // Group by category preserving order
  const grouped = useMemo(() => {
    const order = [
      'Navigation',
      'Grid Navigation',
      'Grid Selection',
      'Grid Editing',
      'Clipboard',
      'Editing',
      'Formatting',
      'Formulas',
      'Data',
      'Sheets',
      'Actions',
      'Application',
      'Reports',
    ];
    const map = new Map<string, UnifiedShortcut[]>();
    for (const s of filtered) {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return order
      .filter((cat) => map.has(cat))
      .map((cat) => ({ name: cat, shortcuts: map.get(cat)! }));
  }, [filtered]);

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setContextFilter('all');
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [isOpen]);

  // Escape to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <style>{PRINT_STYLES}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts reference"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          className={cn(
            'relative w-full max-w-3xl max-h-[85vh] rounded-xl shadow-2xl',
            'border border-gray-200 dark:border-gray-700',
            'bg-white dark:bg-gray-800',
            'flex flex-col overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2.5">
              <Keyboard className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Keyboard Shortcuts
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {filtered.length} of {allShortcuts.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrint}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg',
                  'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors'
                )}
                title="Print cheat sheet"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Toolbar: search + context filter */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-200 dark:border-gray-700">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by description, key, or category..."
                className={cn(
                  'w-full pl-8 pr-3 py-1.5 text-sm rounded-lg',
                  'border border-gray-200 dark:border-gray-600',
                  'bg-gray-50 dark:bg-gray-900',
                  'text-gray-900 dark:text-gray-100',
                  'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500'
                )}
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(['all', 'grid', 'dashboard', 'reports', 'general'] as const).map((ctx) => (
                <button
                  key={ctx}
                  onClick={() => setContextFilter(ctx)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-md transition-colors',
                    contextFilter === ctx
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {ctx === 'all' ? 'All' : getContextLabel(ctx)}
                </button>
              ))}
            </div>
          </div>

          {/* Shortcuts list */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {grouped.length > 0 ? (
              grouped.map((group, i) => (
                <CategorySection
                  key={group.name}
                  name={group.name}
                  shortcuts={group.shortcuts}
                  defaultOpen={i < 4}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                <Search className="w-8 h-8 mb-3 opacity-40" />
                <p className="text-sm">No shortcuts match &ldquo;{search}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-2 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-400 dark:text-gray-500">
            <span>
              Showing shortcuts for{' '}
              <span className="font-medium text-gray-500 dark:text-gray-400">
                {getContextLabel(pageContext)}
              </span>{' '}
              context
            </span>
            <span>
              Press <KeyBadge>?</KeyBadge> or <KeyBadge>Ctrl</KeyBadge> + <KeyBadge>/</KeyBadge> to
              toggle
            </span>
          </div>
        </div>
      </div>

      {/* Print-only area (hidden on screen, visible when printing) */}
      <div id="shortcut-print-area" className="hidden print:block">
        <h1 className="text-xl font-bold mb-4">FinPlan Pro — Keyboard Shortcuts</h1>
        {grouped.map((group) => (
          <div key={group.name} className="mb-4 break-inside-avoid">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-2 border-b pb-1">
              {group.name}
            </h2>
            <table className="w-full text-xs">
              <tbody>
                {group.shortcuts.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="py-1 pr-4 text-gray-600">{s.description}</td>
                    <td className="py-1 text-right font-mono text-gray-800">{s.keys}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Global hook for "?" key listener ────────────────────────────────

export function useShortcutOverlayTrigger(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // "?" key (Shift + /)
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        onOpen();
        return;
      }

      // Ctrl + /
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}
