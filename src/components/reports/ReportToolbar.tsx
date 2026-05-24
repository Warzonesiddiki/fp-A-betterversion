import React from 'react';
import { Eye, Save, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ReportToolbarProps {
  name: string;
  errorCount: number;
  historyIndex: number;
  historyLength: number;
  previewMode: boolean;
  onNameChange: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onTogglePreview: () => void;
  onSave: () => void;
}

export function ReportToolbar({
  name,
  errorCount,
  historyIndex,
  historyLength,
  previewMode,
  onNameChange,
  onUndo,
  onRedo,
  onTogglePreview,
  onSave,
}: ReportToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="bg-transparent text-lg font-semibold text-white border-b border-transparent hover:border-slate-600 focus:border-blue-500 focus:outline-none px-1"
          aria-label="Report name"
        />
        {errorCount > 0 && (
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
            {errorCount} issue{errorCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onUndo}
          disabled={historyIndex === 0}
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRedo}
          disabled={historyIndex === historyLength - 1}
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-slate-700 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={onTogglePreview}
          aria-label={previewMode ? 'Switch to edit mode' : 'Switch to preview mode'}
        >
          <Eye className="h-4 w-4 mr-1.5" />
          {previewMode ? 'Edit' : 'Preview'}
        </Button>
        <Button size="sm" onClick={onSave}>
          <Save className="h-4 w-4 mr-1.5" />
          Save
        </Button>
      </div>
    </div>
  );
}
