import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LayoutGrid, Plus, Save, Download, Trash2, GripVertical } from 'lucide-react';
import { useDashboardStore, type Widget, type WidgetType } from '@/store/dashboardStore';
import { useAuthStore } from '@/store/authStore';

const DEFAULT_DASHBOARD_NAME = 'My Dashboard';

const DEFAULT_WIDGETS: ReadonlyArray<Omit<Widget, 'id'>> = [
  {
    type: 'kpi',
    title: 'Total Revenue',
    config: { format: 'currency' },
    position: { x: 0, y: 0, w: 3, h: 1 },
  },
  {
    type: 'kpi',
    title: 'Net Income',
    config: { format: 'currency' },
    position: { x: 3, y: 0, w: 3, h: 1 },
  },
  {
    type: 'kpi',
    title: 'Operating Margin',
    config: { format: 'percent' },
    position: { x: 6, y: 0, w: 3, h: 1 },
  },
  {
    type: 'kpi',
    title: 'Cash Flow',
    config: { format: 'currency' },
    position: { x: 9, y: 0, w: 3, h: 1 },
  },
  {
    type: 'chart',
    title: 'Revenue Trend',
    config: { chartType: 'line' },
    position: { x: 0, y: 1, w: 6, h: 2 },
  },
  {
    type: 'chart',
    title: 'Expense Breakdown',
    config: { chartType: 'pie' },
    position: { x: 6, y: 1, w: 6, h: 2 },
  },
  {
    type: 'table',
    title: 'Top Accounts',
    config: { pageSize: 5 },
    position: { x: 0, y: 3, w: 12, h: 2 },
  },
];

/**
 * Dashboard Builder — custom widget dashboards.
 *
 * PREVIOUSLY: widgets lived in raw `useState` and "Save" wrote to a
 * `localStorage` key nothing ever read back — edits appeared to save (no
 * error, edit mode exited) but were silently discarded on the next load.
 * Meanwhile `dashboardStore` (this file's current data source) already
 * existed as a fully built, fully tested (14/14 passing), RBAC-enforced,
 * masterStorage-persisted, multi-dashboard CRUD store with the exact same
 * Widget/WidgetPosition shape — and was never imported by any page. This
 * page now uses that store directly: every add/remove/move/save operation
 * is a real, persisted, cross-session mutation instead of a component-local
 * illusion of one.
 */
export default function DashboardBuilderPage() {
  const dashboards = useDashboardStore((s) => s.dashboards);
  const activeDashboardId = useDashboardStore((s) => s.activeDashboardId);
  const addDashboard = useDashboardStore((s) => s.addDashboard);
  const setActiveDashboard = useDashboardStore((s) => s.setActiveDashboard);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const updateDashboard = useDashboardStore((s) => s.updateDashboard);
  const currentUser = useAuthStore((s) => s.user);

  const announceRef = useRef<HTMLDivElement | null>(null);

  // Bootstrap: create the user's first dashboard on first visit, exactly
  // once. Without this, dashboards.length === 0 forever and the page would
  // have nothing to render — the store provides no default data itself
  // (correctly: a generic "seed a dashboard" concern belongs to the page,
  // not the store).
  useEffect(() => {
    if (dashboards.length === 0) {
      const id = addDashboard({
        name: DEFAULT_DASHBOARD_NAME,
        description: 'Default financial overview dashboard',
        widgets: DEFAULT_WIDGETS.map((w, i) => ({ ...w, id: `seed-${i}` })),
        layout: 'grid',
        columns: 12,
        createdBy: currentUser?.id ?? 'system',
        isTemplate: false,
        tags: [],
      });
      setActiveDashboard(id);
    } else if (!activeDashboardId) {
      setActiveDashboard(dashboards[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboards.length]);

  const activeDashboard = useMemo(
    () => dashboards.find((d) => d.id === activeDashboardId) ?? null,
    [dashboards, activeDashboardId]
  );

  const widgets = useMemo(() => activeDashboard?.widgets ?? [], [activeDashboard]);

  const [isEditing, setIsEditingState] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const lastWidgetCount = useRef<number>(widgets.length);
  const preEditSnapshot = useRef<Widget[] | null>(null);

  useEffect(() => {
    setAnnouncement(`Dashboard loaded with ${widgets.length} widgets`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDashboardId]);

  useEffect(() => {
    if (widgets.length !== lastWidgetCount.current) {
      const delta = widgets.length - lastWidgetCount.current;
      setAnnouncement(
        delta > 0
          ? `Widget added. Dashboard now has ${widgets.length} widgets`
          : `Widget removed. Dashboard now has ${widgets.length} widgets`
      );
      lastWidgetCount.current = widgets.length;
    }
  }, [widgets.length, setAnnouncement]);

  const handleAddWidget = (type: WidgetType) => {
    if (!activeDashboard) return;
    addWidget(activeDashboard.id, {
      type,
      title: `New ${type} widget`,
      config: {},
      position: { x: 0, y: widgets.length, w: type === 'kpi' ? 3 : 6, h: type === 'kpi' ? 1 : 2 },
    });
  };

  const handleRemoveWidget = (id: string) => {
    if (!activeDashboard) return;
    removeWidget(activeDashboard.id, id);
  };

  const handleMoveWidget = useCallback(
    (id: string, direction: 'up' | 'down') => {
      if (!activeDashboard) return;
      const idx = widgets.findIndex((w) => w.id === id);
      if (idx === -1) return;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= widgets.length) return;
      const next = [...widgets];
      const moved = next.splice(idx, 1)[0];
      if (!moved) return;
      next.splice(newIdx, 0, moved);
      updateDashboard(activeDashboard.id, { widgets: next });
      setAnnouncement(
        `Widget ${moved.title} moved ${direction}. Now at position ${newIdx + 1} of ${next.length}`
      );
    },
    [activeDashboard, widgets, updateDashboard, setAnnouncement]
  );

  const handleEnterEdit = () => {
    preEditSnapshot.current = widgets;
    setIsEditingState(true);
  };

  const handleCancelEdit = () => {
    if (preEditSnapshot.current && activeDashboard) {
      updateDashboard(activeDashboard.id, { widgets: preEditSnapshot.current });
    }
    preEditSnapshot.current = null;
    setIsEditingState(false);
  };

  const handleSave = () => {
    // dashboardStore's updateDashboard already persists through
    // masterStorage on every mutation (addWidget/removeWidget/moveWidget
    // above already wrote through immediately); "Save" here simply commits
    // the edit session and clears the undo snapshot, matching the same UX
    // contract the previous version exposed (Save = exit edit mode keeping
    // changes; Cancel = exit edit mode discarding changes).
    preEditSnapshot.current = null;
    setIsEditingState(false);
    setAnnouncement('Dashboard saved.');
  };

  const handleExportLayout = () => {
    if (!activeDashboard) return;
    const blob = new Blob([JSON.stringify(activeDashboard, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDashboard.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="p-6 space-y-6" aria-labelledby="db-builder-heading">
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLayout}
            aria-label="Export dashboard layout as JSON"
            data-testid="export-dashboard"
            disabled={!activeDashboard}
          >
            <Download className="h-4 w-4 mr-1" aria-hidden="true" /> Export
          </Button>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
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
              onClick={handleEnterEdit}
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
                    <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
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
