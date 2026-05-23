import { useCallback, useState } from 'react';
import { X, Plus, Trash2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import {
  ReportBuilderEngine,
  type ConditionalFormat,
  type ConditionOperator,
  type CellStyle,
  type ReportCell,
} from '@/engines/ReportBuilderEngine';

/* ────────────────── props ────────────────── */

export interface ConditionalFormatPanelProps {
  cell: ReportCell;
  onUpdateFormats: (formats: ConditionalFormat[]) => void;
  onClose: () => void;
  className?: string;
}

/* ────────────────── constants ────────────────── */

const OPERATORS: Array<{ value: ConditionOperator; label: string; symbol: string }> = [
  { value: 'gt', label: 'Greater than', symbol: '>' },
  { value: 'lt', label: 'Less than', symbol: '<' },
  { value: 'gte', label: 'Greater or equal', symbol: '>=' },
  { value: 'lte', label: 'Less or equal', symbol: '<=' },
  { value: 'eq', label: 'Equal to', symbol: '=' },
  { value: 'neq', label: 'Not equal to', symbol: '!=' },
];

const PRESET_COLORS = [
  { label: 'Red', bg: '#FEE2E2', text: '#DC2626' },
  { label: 'Green', bg: '#DCFCE7', text: '#16A34A' },
  { label: 'Amber', bg: '#FEF3C7', text: '#D97706' },
  { label: 'Blue', bg: '#DBEAFE', text: '#2563EB' },
  { label: 'Purple', bg: '#F3E8FF', text: '#9333EA' },
  { label: 'Gray', bg: '#F3F4F6', text: '#6B7280' },
];

/* ────────────────── main component ────────────────── */

export function ConditionalFormatPanel({
  cell,
  onUpdateFormats,
  onClose,
  className,
}: ConditionalFormatPanelProps) {
  const cellContent = cell.content as {
    content: { conditionalFormats?: ConditionalFormat[] };
  };
  const formats = cellContent.content.conditionalFormats ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddFormat = useCallback(() => {
    const newFormat: ConditionalFormat = {
      id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      condition: 'gt',
      value: 0,
      style: { textColor: '#16A34A' },
      label: '',
    };
    onUpdateFormats([...formats, newFormat]);
    setEditingId(newFormat.id);
  }, [formats, onUpdateFormats]);

  const handleUpdateFormat = useCallback(
    (id: string, updates: Partial<ConditionalFormat>) => {
      const updated = formats.map((f) => (f.id === id ? { ...f, ...updates } : f));
      onUpdateFormats(updated);
    },
    [formats, onUpdateFormats]
  );

  const handleRemoveFormat = useCallback(
    (id: string) => {
      onUpdateFormats(formats.filter((f) => f.id !== id));
      if (editingId === id) setEditingId(null);
    },
    [formats, onUpdateFormats, editingId]
  );

  const handleApplyPreset = useCallback(
    (id: string, preset: (typeof PRESET_COLORS)[number]) => {
      handleUpdateFormat(id, {
        style: { textColor: preset.text, backgroundColor: preset.bg },
      });
    },
    [handleUpdateFormat]
  );

  return (
    <div className={cn('bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Palette className="h-4 w-4 text-blue-400" />
          Conditional Formatting
        </h4>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Close conditional formatting"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Cell type: <span className="text-slate-300 uppercase">{cell.type}</span>
      </p>

      {/* Format rules */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {formats.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            No conditional formats. Add a rule to get started.
          </p>
        ) : (
          formats.map((format) => (
            <div
              key={format.id}
              className={cn(
                'border rounded-lg p-3 space-y-2 transition-colors',
                editingId === format.id
                  ? 'border-blue-500 bg-blue-500/5'
                  : 'border-slate-700 bg-slate-800/30'
              )}
              onClick={() => setEditingId(format.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEditingId(format.id);
                }
              }}
            >
              {/* Condition row */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">If value</span>
                <select
                  value={format.condition}
                  onChange={(e) =>
                    handleUpdateFormat(format.id, {
                      condition: e.target.value as ConditionOperator,
                    })
                  }
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  aria-label="Condition operator"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.symbol} {op.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={format.value}
                  onChange={(e) =>
                    handleUpdateFormat(format.id, {
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  aria-label="Condition value"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFormat(format.id);
                  }}
                  className="ml-auto text-slate-500 hover:text-red-400"
                  aria-label="Remove format rule"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Label */}
              <input
                type="text"
                value={format.label ?? ''}
                onChange={(e) => handleUpdateFormat(format.id, { label: e.target.value })}
                placeholder="Optional label..."
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder:text-slate-600"
              />

              {/* Color presets */}
              {editingId === format.id && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-500">Quick colors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyPreset(format.id, preset);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded border border-slate-700 hover:border-slate-500 transition-colors"
                        title={preset.label}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: preset.text }}
                        />
                        <span className="text-xs text-slate-300">{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom colors */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">Text</label>
                    <input
                      type="color"
                      value={format.style.textColor ?? '#FFFFFF'}
                      onChange={(e) =>
                        handleUpdateFormat(format.id, {
                          style: { ...format.style, textColor: e.target.value },
                        })
                      }
                      className="w-6 h-6 rounded cursor-pointer"
                      aria-label="Text color"
                    />
                    <label className="text-xs text-slate-500">Background</label>
                    <input
                      type="color"
                      value={format.style.backgroundColor ?? '#000000'}
                      onChange={(e) =>
                        handleUpdateFormat(format.id, {
                          style: { ...format.style, backgroundColor: e.target.value },
                        })
                      }
                      className="w-6 h-6 rounded cursor-pointer"
                      aria-label="Background color"
                    />
                  </div>

                  {/* Style toggles */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={format.style.bold ?? false}
                        onChange={(e) =>
                          handleUpdateFormat(format.id, {
                            style: { ...format.style, bold: e.target.checked },
                          })
                        }
                        className="rounded"
                      />
                      Bold
                    </label>
                    <label className="flex items-center gap-1 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={format.style.italic ?? false}
                        onChange={(e) =>
                          handleUpdateFormat(format.id, {
                            style: { ...format.style, italic: e.target.checked },
                          })
                        }
                        className="rounded"
                      />
                      Italic
                    </label>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Preview:</span>
                <span
                  className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{
                    color: format.style.textColor,
                    backgroundColor:
                      format.style.backgroundColor === 'transparent'
                        ? undefined
                        : format.style.backgroundColor,
                    fontWeight: format.style.bold ? 700 : 400,
                    fontStyle: format.style.italic ? 'italic' : undefined,
                  }}
                >
                  {ReportBuilderEngine.formatNumber(format.value, 'currency', 0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add button */}
      <Button size="sm" variant="ghost" onClick={handleAddFormat} className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Rule
      </Button>
    </div>
  );
}
