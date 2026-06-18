/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Keyboard, Search, Plus, Trash2 } from 'lucide-react';
import {
  ExcelKeyboardShortcuts,
  type ShortcutDef,
  type ShortcutGroup,
  type ShortcutCategory,
  SHORTCUT_CATEGORIES,
} from '@/engines/ExcelKeyboardShortcuts';

// ─── Key badge component ─────────────────────────────────────────────

function KeyBadge({ keyName }: { keyName: string }) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-mono rounded border"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)',
        boxShadow: '0 1px 0 var(--border)',
      }}
    >
      {keyName}
    </kbd>
  );
}

function KeyCombo({ shortcut }: { shortcut: ShortcutDef }) {
  const parts = ExcelKeyboardShortcuts.formatKeys(shortcut).split('+');
  return (
    <div className="flex items-center gap-0.5">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span className="text-xs mx-0.5" style={{ color: 'var(--text-secondary)' }}>
              +
            </span>
          )}
          <KeyBadge keyName={p} />
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Custom shortcut dialog ──────────────────────────────────────────

interface AddDialogProps {
  onAdd: (shortcut: Omit<ShortcutDef, 'id' | 'isCustom'>) => void;
  onClose: () => void;
}

function AddShortcutDialog({ onAdd, onClose }: AddDialogProps) {
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [action, setAction] = useState('');
  const [category, setCategory] = useState<ShortcutCategory>('Application');
  const [ctrl, setCtrl] = useState(false);
  const [shift, setShift] = useState(false);
  const [alt, setAlt] = useState(false);

  const handleKeyDownCapture = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const k = e.key;
    if (k === 'Control' || k === 'Shift' || k === 'Alt' || k === 'Meta') return;
    setKey(k);
    setCtrl(e.ctrlKey || e.metaKey);
    setShift(e.shiftKey);
    setAlt(e.altKey);
  }, []);

  const canSave = key && description && action;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClose?.();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-2xl border p-6"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Add Custom Shortcut
        </h3>

        <div className="space-y-3">
          {/* Key capture */}
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Key Combination
            </label>
            <div
              role="textbox"
              tabIndex={0}
              onKeyDownCapture={handleKeyDownCapture}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-text min-h-[2.5rem]"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              {key ? (
                <>
                  {ctrl && <KeyBadge keyName="Ctrl" />}
                  {ctrl && (shift || alt || key) && <span className="text-xs">+</span>}
                  {shift && <KeyBadge keyName="Shift" />}
                  {shift && (alt || key) && <span className="text-xs">+</span>}
                  {alt && <KeyBadge keyName="Alt" />}
                  {alt && key && <span className="text-xs">+</span>}
                  <KeyBadge keyName={key} />
                </>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Press a key combination...
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="e.g. Toggle freeze panes"
            />
          </div>

          {/* Action */}
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Action ID
            </label>
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="e.g. toggleFreezePanes"
            />
          </div>

          {/* Category */}
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ShortcutCategory)}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              {SHORTCUT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (canSave) onAdd({ key, ctrl, shift, alt, description, action, category });
            }}
            disabled={!canSave}
            className="px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Add Shortcut
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main overlay ────────────────────────────────────────────────────

interface KeyboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardOverlay({ isOpen, onClose }: KeyboardOverlayProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [groups, setGroups] = useState<ShortcutGroup[]>([]);

  // Load shortcuts on mount and subscribe to changes
  const hasLoaded = useRef(false);
  useEffect(() => {
    ExcelKeyboardShortcuts.loadCustom();
    if (!hasLoaded.current) {
      setGroups(ExcelKeyboardShortcuts.getGrouped());
      hasLoaded.current = true;
    }
    const unsub = ExcelKeyboardShortcuts.subscribe(() =>
      setGroups(ExcelKeyboardShortcuts.getGrouped())
    );
    return unsub;
  }, []);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const prevIsOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setSearch('');
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showCustom) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showCustom]);

  if (!isOpen) return null;

  const allShortcuts = groups.flatMap((g) => g.shortcuts);
  const filtered = search ? ExcelKeyboardShortcuts.search(search) : allShortcuts;
  const filteredGroups = SHORTCUT_CATEGORIES.map((cat) => ({
    category: cat,
    shortcuts: filtered.filter((s) => s.category === cat),
  })).filter((g) => g.shortcuts.length > 0);

  const handleAdd = (def: Omit<ShortcutDef, 'id' | 'isCustom'>) => {
    ExcelKeyboardShortcuts.register(def);
    ExcelKeyboardShortcuts.saveCustom();
    setShowCustom(false);
  };

  const handleRemove = (id: string) => {
    if (!window.confirm('Remove this custom shortcut?')) return;
    ExcelKeyboardShortcuts.removeCustom(id);
    ExcelKeyboardShortcuts.saveCustom();
  };

  const customCount = allShortcuts.filter((s) => s.isCustom).length;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose?.();
        }}
      >
        <div
          className="w-full max-w-3xl max-h-[85vh] rounded-xl shadow-2xl border overflow-hidden flex flex-col"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Keyboard Shortcuts
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                {allShortcuts.length} shortcuts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustom(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                title="Add custom shortcut"
              >
                <Plus className="w-3.5 h-3.5" />
                Custom
              </button>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1 rounded hover:opacity-80 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shortcuts by description, key, or action..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Shortcuts grid */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredGroups.map((group) => (
              <div key={group.category} className="mb-6 last:mb-0">
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {group.category}
                  <span className="font-normal opacity-60">({group.shortcuts.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-1.5 group"
                    >
                      <span
                        className="text-sm flex items-center gap-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {shortcut.description}
                        {shortcut.isCustom && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--accent)', color: '#fff', opacity: 0.8 }}
                          >
                            custom
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <KeyCombo shortcut={shortcut} />
                        {shortcut.isCustom && (
                          <button
                            onClick={() => handleRemove(shortcut.id)}
                            className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-opacity"
                            title="Remove custom shortcut"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                No shortcuts found for &quot;{search}&quot;
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div
            className="px-6 py-2 border-t text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Press <KeyBadge keyName="?" /> or <KeyBadge keyName="Ctrl" /> + <KeyBadge keyName="/" />{' '}
            to toggle this overlay
            {customCount > 0 && (
              <span className="ml-3">
                ({customCount} custom shortcut{customCount !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add custom shortcut dialog */}
      {showCustom && <AddShortcutDialog onAdd={handleAdd} onClose={() => setShowCustom(false)} />}
    </>
  );
}
