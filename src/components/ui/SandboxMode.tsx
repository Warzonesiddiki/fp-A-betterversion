import React from 'react';
import { FlaskConical, ChevronRight } from 'lucide-react';

export interface SandboxModeProps {
  isActive: boolean;
  onToggle: () => void;
}

export const SandboxMode: React.FC<SandboxModeProps> = ({ isActive, onToggle }) => {
  if (!isActive) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 flex items-center space-x-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full shadow-sm hover:bg-amber-100 transition-all group"
      >
        <FlaskConical className="h-4 w-4" />
        <span className="text-xs font-semibold">Sandbox Mode</span>
        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </button>
    );
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-1.5 flex items-center justify-between sticky top-0 z-[60] shadow-md animate-fade-in">
      <div className="flex items-center space-x-3">
        <div className="p-1 bg-amber-600 rounded">
          <FlaskConical className="h-4 w-4" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider">Sandbox Mode Active</span>
          <span className="text-[10px] text-amber-100 font-medium opacity-90 hidden sm:inline">
            |
          </span>
          <span className="text-[10px] text-amber-50 font-medium">
            Changes are temporary and will not be persisted to the main database.
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onToggle}
          className="bg-[var(--bg-surface)] text-amber-600 px-3 py-1 rounded text-xs font-bold hover:bg-amber-50 transition-colors shadow-sm"
        >
          Exit Sandbox
        </button>
      </div>
    </div>
  );
};
