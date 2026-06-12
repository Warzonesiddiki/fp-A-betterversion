/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { GripVertical, Settings, Columns, Rows } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ROW_TYPES, COLUMN_TYPES, type DragItem } from './reportBuilder.constants';

export interface ReportLeftPanelProps {
  activePanel: 'rows' | 'columns' | 'properties';
  reportName: string;
  reportDescription: string;
  errors: string[];
  onPanelChange: (panel: 'rows' | 'columns' | 'properties') => void;
  onDragStart: (e: React.DragEvent, item: DragItem) => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function ReportLeftPanel({
  activePanel,
  reportName,
  reportDescription,
  errors,
  onPanelChange,
  onDragStart,
  onNameChange,
  onDescriptionChange,
}: ReportLeftPanelProps) {
  return (
    <div className="w-56 border-r border-slate-800 flex flex-col overflow-hidden">
      <div className="flex border-b border-slate-800">
        <button
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium text-center transition-colors',
            activePanel === 'rows'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-white'
          )}
          onClick={() => onPanelChange('rows')}
        >
          <Rows className="h-3.5 w-3.5 inline mr-1" />
          Rows
        </button>
        <button
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium text-center transition-colors',
            activePanel === 'columns'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-white'
          )}
          onClick={() => onPanelChange('columns')}
        >
          <Columns className="h-3.5 w-3.5 inline mr-1" />
          Cols
        </button>
        <button
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium text-center transition-colors',
            activePanel === 'properties'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-white'
          )}
          onClick={() => onPanelChange('properties')}
        >
          <Settings className="h-3.5 w-3.5 inline mr-1" />
          Props
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activePanel === 'rows' && (
          <>
            <p className="text-xs text-slate-500 mb-2">Drag to add rows</p>
            {ROW_TYPES.map((rt) => (
              <div
                key={rt.type}
                draggable
                onDragStart={(e) => onDragStart(e, { type: 'row-type', value: rt.type })}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 cursor-grab hover:border-blue-500 hover:bg-slate-800 transition-colors text-sm"
              >
                <GripVertical className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-mono bg-slate-700 px-1.5 py-0.5 rounded">
                  {rt.icon}
                </span>
                <span className="text-slate-300">{rt.label}</span>
              </div>
            ))}
          </>
        )}

        {activePanel === 'columns' && (
          <>
            <p className="text-xs text-slate-500 mb-2">Drag to add columns</p>
            {COLUMN_TYPES.map((ct) => (
              <div
                key={ct.label}
                draggable
                onDragStart={(e) => onDragStart(e, { type: 'column-type', value: ct.label })}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 cursor-grab hover:border-blue-500 hover:bg-slate-800 transition-colors text-sm"
              >
                <GripVertical className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-slate-300">{ct.label}</span>
              </div>
            ))}
          </>
        )}

        {activePanel === 'properties' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Report Name</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Description</label>
              <textarea
                value={reportDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white resize-none"
                rows={3}
              />
            </div>

            {errors.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-xs font-medium text-amber-400">Validation Issues</p>
                {errors.map((err: string, i: number) => (
                  <p key={i} className="text-xs text-amber-400/80">
                    • {err}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
