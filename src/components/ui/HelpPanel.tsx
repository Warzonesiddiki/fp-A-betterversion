import { memo, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface HelpSection {
  title: string;
  content: string;
}

interface HelpPanelProps {
  title: string;
  sections: HelpSection[];
  isOpen: boolean;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const HelpPanel = memo(function HelpPanel({ title, sections, isOpen, onClose }: HelpPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleEscape);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const container = panelRef.current;
    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    container.addEventListener('keydown', handleTabTrap);
    return () => container.removeEventListener('keydown', handleTabTrap);
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        role="presentation"
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
        }}
      />
      <div
        ref={panelRef}
        className="relative w-full max-w-md bg-slate-900 dark:bg-gray-900 border-l border-slate-700 dark:border-gray-700 p-6 overflow-y-auto shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close help panel"
            className="p-1 rounded hover:bg-slate-800 dark:hover:bg-gray-800 text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {sections.length === 0 ? (
          <p className="text-sm text-slate-400">No help content available for this page.</p>
        ) : (
          sections.map((s, i) => (
            <div key={i} className="mb-6">
              <h3 className="font-semibold text-sm mb-2 dark:text-gray-200">{s.title}</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
                {s.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
