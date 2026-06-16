/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LayoutGrid, Plus, Save, Download, Trash2, GripVertical } from 'lucide-react';

interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'text';
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

const DEFAULT_WIDGETS: Widget[] = [
  {
    id: '1',
    type: 'kpi',
    title: 'Total Revenue',
    config: { format: 'currency' },
    position: { x: 0, y: 0, w: 3, h: 1 },
  },
  {
    id: '2',
    type: 'kpi',
    title: 'Net Income',
    config: { format: 'currency' },
    position: { x: 3, y: 0, w: 3, h: 1 },
  },
  {
    id: '3',
    type: 'kpi',
    title: 'Operating Margin',
    config: { format: 'percent' },
    position: { x: 6, y: 0, w: 3, h: 1 },
  },
  {
    id: '4',
    type: 'kpi',
    title: 'Cash Flow',
    config: { format: 'currency' },
    position: { x: 9, y: 0, w: 3, h: 1 },
  },
  {
    id: '5',
    type: 'chart',
    title: 'Revenue Trend',
    config: { chartType: 'line' },
    position: { x: 0, y: 1, w: 6, h: 2 },
  },
  {
    id: '6',
    type: 'chart',
    title: 'Expense Breakdown',
    config: { chartType: 'pie' },
    position: { x: 6, y: 1, w: 6, h: 2 },
  },
  {
    id: '7',
    type: 'table',
    title: 'Top Accounts',
    config: { pageSize: 5 },
    position: { x: 0, y: 3, w: 12, h: 2 },
  },
];

export default function DashboardBuilderPage() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [isEditing, setIsEditing] = useState(false);
  // [Hera] PICK J a11y: live region for widget add/remove/move announcements
  const [announcement, setAnnouncement] = useState<string>('');
  const lastWidgetCount = useRef<number>(widgets.length);
  const announceRef = useRef<HTMLDivElement | null>(null);

  // [Hera] PICK J a11y: announce widget count on mount
  useEffect(() => {
    setAnnouncement(`Dashboard loaded with ${DEFAULT_WIDGETS.length} widgets`);
  }, []);

  // [Hera] PICK J a11y: announce widget count changes
  useEffect(() => {
    if (widgets.length !== lastWidgetCount.current) {
      const delta = widgets.length - lastWidgetCount.current;
      if (delta > 0) {
        setAnnouncement(`Widget added. Dashboard now has ${widgets.length} widgets`);
      } else {
        setAnnouncement(`Widget removed. Dashboard now has ${widgets.length} widgets`);
      }
      lastWidgetCount.current = widgets.length;
    }
  }, [widgets.length]);

  const handleAddWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: String(Date.now()),
      type,
      title: `New ${type} widget`,
      config: {},
      position: { x: 0, y: widgets.length, w: type === 'kpi' ? 3 : 6, h: type === 'kpi' ? 1 : 2 },
    };
    setWidgets([...widgets, newWidget]);
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  // [Hera] PICK J a11y: keyboard-accessible widget reordering (up/down)
  const handleMoveWidget = useCallback((id: string, direction: 'up' | 'down') => {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      const moved = next.splice(idx, 1)[0];
      if (!moved) return prev;
      next.splice(newIdx, 0, moved);
      setAnnouncement(
        `Widget ${moved.title} moved ${direction}. Now at position ${newIdx + 1} of ${next.length}`
      );
      return next;
    });
  }, []);

  const handleSave = () => {
    localStorage.setItem('custom-dashboard', JSON.stringify(widgets));
    setIsEditing(false);
  };

  return (
    <main className="p-6 space-y-6" aria-labelledby="db-builder-heading">
      {/* [Hera] PICK J a11y: live region for screen reader announcements */}
      <div
        ref={announceRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="widget-announcer"
      >
        {announcement}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 id="db-builder-heading" className="text-2xl font-bold">
            Dashboard Builder
            {isEditing && <span className="sr-only"> (edit mode active)</span>}
          </h1>
          <p className="text-muted-foreground">
            Create custom dashboards with drag-and-drop widgets
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                aria-label="Cancel and exit edit mode"
                data-testid="cancel-edit"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                aria-label="Save dashboard and exit edit mode"
                data-testid="save-dashboard"
              >
                <Save className="h-4 w-4 mr-1" aria-hidden="true" /> Save
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-pressed={isEditing}
              aria-label={isEditing ? 'Exit customize mode' : 'Customize dashboard'}
              data-testid="customize-toggle"
            >
              <LayoutGrid className="h-4 w-4 mr-1" aria-hidden="true" /> Customize
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddWidget('kpi')}
                data-testid="add-widget-kpi"
                aria-label="Add KPI widget"
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> KPI Card
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddWidget('chart')}
                data-testid="add-widget-chart"
                aria-label="Add chart widget"
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Chart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddWidget('table')}
                data-testid="add-widget-table"
                aria-label="Add table widget"
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Table
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddWidget('text')}
                data-testid="add-widget-text"
                aria-label="Add text block widget"
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Text Block
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div
        className="grid grid-cols-12 gap-4"
        role="region"
        aria-label={`Dashboard widget grid with ${widgets.length} widgets`}
        data-testid="widget-grid"
      >
        {widgets.map((widget) => (
          <div key={widget.id} className={`col-span-${Math.min(widget.position.w, 12)}`}>
            <Card className="relative group">
              {isEditing && (
                <div
                  className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                  role="group"
                  aria-label={`Reorder controls for ${widget.title}`}
                >
                  <button
                    className="p-1 rounded hover:bg-[var(--bg-hover)]"
                    onClick={() => handleMoveWidget(widget.id, 'up')}
                    title={`Move ${widget.title} up`}
                    aria-label={`Move ${widget.title} up`}
                    disabled={widgets.indexOf(widget) === 0}
                    data-testid={`move-up-${widget.id}`}
                  >
                    <GripVertical className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
                    <span className="sr-only">Move up</span>
                  </button>
                  <button
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => handleRemoveWidget(widget.id)}
                    title={`Remove ${widget.title}`}
                    aria-label={`Remove ${widget.title}`}
                    data-testid={`remove-${widget.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                    <span className="sr-only">Remove</span>
                  </button>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {widget.type === 'kpi' && <div className="text-2xl font-bold font-mono">$0.00</div>}
                {widget.type === 'chart' && (
                  <div className="h-40 bg-[var(--bg-surface)] rounded flex items-center justify-center text-sm text-[var(--text-muted)]">
                    Chart: {String(widget.config.chartType || 'bar')}
                  </div>
                )}
                {widget.type === 'table' && (
                  <div className="h-32 bg-[var(--bg-surface)] rounded flex items-center justify-center text-sm text-[var(--text-muted)]">
                    Data Table Widget
                  </div>
                )}
                {widget.type === 'text' && (
                  <div className="text-sm text-[var(--text-muted)]">
                    Click to edit this text block...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </main>
  );
}
