import { randomId } from '@/utils/cryptoId';
import { useState, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';

export type WidgetType =
  | 'kpi'
  | 'combo-chart'
  | 'gauge'
  | 'heatmap'
  | 'tornado'
  | 'sankey'
  | 'activity'
  | 'traffic-light';

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  icon: string;
  defaultSpan: 1 | 2 | 3 | 4;
  category: 'kpi' | 'chart' | 'analysis' | 'feed';
}

export interface PlacedWidget {
  id: string;
  type: WidgetType;
  span: 1 | 2 | 3 | 4;
  order: number;
}

export interface WidgetLibraryProps {
  /** Widgets currently on the dashboard */
  placedWidgets: PlacedWidget[];
  /** Called when widgets are reordered or added/removed */
  onChange: (widgets: PlacedWidget[]) => void;
  /** Optional class on the wrapper */
  className?: string;
}

const WIDGET_REGISTRY: WidgetDefinition[] = [
  { type: 'kpi', label: 'KPI Card', icon: '📊', defaultSpan: 1, category: 'kpi' },
  { type: 'gauge', label: 'Gauge Chart', icon: '🎯', defaultSpan: 1, category: 'kpi' },
  { type: 'combo-chart', label: 'Combo Chart', icon: '📈', defaultSpan: 2, category: 'chart' },
  { type: 'heatmap', label: 'Heatmap Grid', icon: '🗺', defaultSpan: 2, category: 'chart' },
  { type: 'tornado', label: 'Tornado Chart', icon: '🌪', defaultSpan: 2, category: 'analysis' },
  { type: 'sankey', label: 'Sankey Diagram', icon: '🔗', defaultSpan: 2, category: 'analysis' },
  { type: 'traffic-light', label: 'Traffic Light', icon: '🚦', defaultSpan: 1, category: 'kpi' },
  { type: 'activity', label: 'Activity Feed', icon: '📋', defaultSpan: 2, category: 'feed' },
];

const CATEGORIES = [
  { key: 'kpi' as const, label: 'KPIs' },
  { key: 'chart' as const, label: 'Charts' },
  { key: 'analysis' as const, label: 'Analysis' },
  { key: 'feed' as const, label: 'Activity' },
];

export function WidgetLibrary({
  placedWidgets = [],
  onChange = () => {},
  className,
}: WidgetLibraryProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const addWidget = useCallback(
    (def: WidgetDefinition) => {
      const newWidget: PlacedWidget = {
        id: randomId('widget'),
        type: def.type,
        span: def.defaultSpan,
        order: placedWidgets.length,
      };
      onChange([...placedWidgets, newWidget]);
    },
    [placedWidgets, onChange]
  );

  const removeWidget = useCallback(
    (id: string) => {
      onChange(placedWidgets.filter((w) => w.id !== id));
    },
    [placedWidgets, onChange]
  );

  const resizeWidget = useCallback(
    (id: string, span: 1 | 2 | 3 | 4) => {
      onChange(placedWidgets.map((w) => (w.id === id ? { ...w, span } : w)));
    },
    [placedWidgets, onChange]
  );

  const moveWidget = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx) return;
      const updated = [...placedWidgets];
      const moved = updated.splice(fromIdx, 1)[0]!;
      updated.splice(toIdx, 0, moved);
      onChange(updated.map((w, i) => ({ ...w, order: i })));
    },
    [placedWidgets, onChange]
  );

  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDropIndex(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragIndex !== null) {
      moveWidget(dragIndex, idx);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const getWidgetDef = (type: WidgetType) => WIDGET_REGISTRY.find((w) => w.type === type);

  return (
    <div className={cn('space-y-6', className)} role="region" aria-label="WidgetLibrary">
      {/* Widget palette */}
      <div>
        <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">Widget Library</div>
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const widgets = WIDGET_REGISTRY.filter((w) => w.category === cat.key);
            return (
              <div key={cat.key}>
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  {cat.label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {widgets.map((def) => (
                    <button
                      key={def.type}
                      onClick={() => addWidget(def)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium',
                        'bg-[var(--bg-surface)] border border-[var(--border-subtle)]',
                        'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                        'transition-all cursor-pointer'
                      )}
                      title={`Add ${def.label}`}
                    >
                      <span>{def.icon}</span>
                      <span>{def.label}</span>
                      <span className="text-[var(--text-muted)]">+</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Placed widgets */}
      {placedWidgets.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Dashboard Layout ({placedWidgets.length} widgets)
          </div>
          <div className="space-y-2">
            {placedWidgets.map((widget, idx) => {
              const def = getWidgetDef(widget.type);
              const isDragging = dragIndex === idx;
              const isDropTarget = dropIndex === idx;
              return (
                <div
                  key={widget.id}
                  ref={isDragging ? dragRef : undefined}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                    'bg-[var(--bg-surface)] border-[var(--border-subtle)]',
                    isDragging && 'opacity-50',
                    isDropTarget && 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  )}
                >
                  <span
                    className="cursor-grab text-[var(--text-muted)] select-none"
                    title="Drag to reorder"
                  >
                    ⠿
                  </span>
                  <span className="text-sm">{def?.icon}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] flex-1">
                    {def?.label ?? widget.type}
                  </span>

                  {/* Span selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--text-muted)]">Span:</span>
                    {([1, 2, 3, 4] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => resizeWidget(widget.id, s)}
                        className={cn(
                          'w-6 h-6 rounded text-xs font-medium transition-all',
                          widget.span === s
                            ? 'bg-blue-600 text-white'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:border-blue-400'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title={`Remove ${def?.label}`}
                  >
                    x
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {placedWidgets.length === 0 && (
        <div className="text-center py-8 text-sm text-[var(--text-muted)]">
          Click widgets above to add them to your dashboard
        </div>
      )}
    </div>
  );
}
