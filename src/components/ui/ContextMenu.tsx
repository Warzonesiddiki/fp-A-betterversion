import React, { useEffect, useRef, useState } from 'react';
import {
  Scissors,
  Copy,
  ClipboardPaste,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Eraser,
  Filter,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export type ContextMenuAction =
  | 'cut'
  | 'copy'
  | 'paste'
  | 'insertRowAbove'
  | 'insertRowBelow'
  | 'deleteRow'
  | 'insertColLeft'
  | 'insertColRight'
  | 'deleteCol'
  | 'clearContents'
  | 'sortAsc'
  | 'sortDesc'
  | 'filter';

interface MenuItem {
  label: string;
  action: ContextMenuAction;
  icon: React.ReactNode;
  shortcut?: string;
  dividerAfter?: boolean;
  danger?: boolean;
}

const menuItems: MenuItem[] = [
  { label: 'Cut', action: 'cut', icon: <Scissors className="h-3.5 w-3.5" />, shortcut: 'Ctrl+X' },
  { label: 'Copy', action: 'copy', icon: <Copy className="h-3.5 w-3.5" />, shortcut: 'Ctrl+C' },
  {
    label: 'Paste',
    action: 'paste',
    icon: <ClipboardPaste className="h-3.5 w-3.5" />,
    shortcut: 'Ctrl+V',
    dividerAfter: true,
  },
  { label: 'Insert row above', action: 'insertRowAbove', icon: <Plus className="h-3.5 w-3.5" /> },
  { label: 'Insert row below', action: 'insertRowBelow', icon: <Plus className="h-3.5 w-3.5" /> },
  {
    label: 'Delete row',
    action: 'deleteRow',
    icon: <Minus className="h-3.5 w-3.5" />,
    danger: true,
    dividerAfter: true,
  },
  { label: 'Insert column left', action: 'insertColLeft', icon: <Plus className="h-3.5 w-3.5" /> },
  {
    label: 'Insert column right',
    action: 'insertColRight',
    icon: <Plus className="h-3.5 w-3.5" />,
  },
  {
    label: 'Delete column',
    action: 'deleteCol',
    icon: <Minus className="h-3.5 w-3.5" />,
    danger: true,
    dividerAfter: true,
  },
  {
    label: 'Clear contents',
    action: 'clearContents',
    icon: <Eraser className="h-3.5 w-3.5" />,
    shortcut: 'Delete',
  },
  { label: 'Sort A → Z', action: 'sortAsc', icon: <ArrowUp className="h-3.5 w-3.5" /> },
  { label: 'Sort Z → A', action: 'sortDesc', icon: <ArrowDown className="h-3.5 w-3.5" /> },
  { label: 'Filter', action: 'filter', icon: <Filter className="h-3.5 w-3.5" /> },
];

export interface ContextMenuProps {
  x: number;
  y: number;
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
  className?: string;
}

export function ContextMenu({ x, y, onAction, onClose, className }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex((prev) => (prev + 1) % menuItems.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onAction(menuItems[focusIndex].action);
        onClose();
      }
      if (e.key === 'Home') {
        e.preventDefault();
        setFocusIndex(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        setFocusIndex(menuItems.length - 1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onAction, focusIndex]);

  // Focus the active menu item
  useEffect(() => {
    const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
    (items?.[focusIndex] as HTMLElement)?.focus?.();
  }, [focusIndex]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 bg-white dark:bg-gray-800 dark:bg-gray-800 border border-[var(--border-subtle)] dark:border-gray-700 rounded-lg shadow-xl py-1.5 min-w-[200px] animate-in fade-in-0 zoom-in-95 duration-100',
        className
      )}
      style={{ left: x, top: y }}
      role="menu"
      aria-label="Cell context menu"
    >
      {menuItems.map((item) => (
        <React.Fragment key={item.action}>
          <button
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus-visible:ring-inset',
              item.danger
                ? 'fin-negative dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)] dark:hover:bg-gray-700'
            )}
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              onAction(item.action);
              onClose();
            }}
          >
            <span
              className={cn(
                item.danger
                  ? 'text-red-400'
                  : 'text-gray-400 dark:text-gray-500 dark:text-[var(--text-muted)]'
              )}
            >
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 dark:text-[var(--text-muted)] font-mono">
                {item.shortcut}
              </span>
            )}
          </button>
          {item.dividerAfter && (
            <div
              className="my-1 border-t border-gray-100 dark:border-gray-800 dark:border-gray-700"
              role="separator"
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
