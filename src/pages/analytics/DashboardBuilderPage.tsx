import { useState, useMemo } from 'react';
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

  const handleSave = () => {
    localStorage.setItem('custom-dashboard', JSON.stringify(widgets));
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Builder</h1>
          <p className="text-muted-foreground">
            Create custom dashboards with drag-and-drop widgets
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <LayoutGrid className="h-4 w-4 mr-1" /> Customize
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleAddWidget('kpi')}>
                <Plus className="h-4 w-4 mr-1" /> KPI Card
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddWidget('chart')}>
                <Plus className="h-4 w-4 mr-1" /> Chart
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddWidget('table')}>
                <Plus className="h-4 w-4 mr-1" /> Table
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddWidget('text')}>
                <Plus className="h-4 w-4 mr-1" /> Text Block
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-4">
        {widgets.map((widget) => (
          <div key={widget.id} className={`col-span-${Math.min(widget.position.w, 12)}`}>
            <Card className="relative group">
              {isEditing && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1 rounded hover:bg-[var(--bg-hover)]"
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4 text-[var(--text-muted)]" />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => handleRemoveWidget(widget.id)}
                    title="Remove widget"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
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
    </div>
  );
}
