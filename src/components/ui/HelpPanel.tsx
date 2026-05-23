import { useEffect } from 'react';
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

export function HelpPanel({ title, sections, isOpen, onClose }: HelpPanelProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        role="presentation"
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
        }}
      />
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-700 p-6 overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        {sections.length === 0 ? (
          <p className="text-sm text-slate-400">No help content available for this page.</p>
        ) : (
          sections.map((s, i) => (
            <div key={i} className="mb-6">
              <h3 className="font-semibold text-sm mb-2">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{s.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
