import { randomId } from '@/utils/cryptoId';
// =============================================================================
// DASHBOARD BUILDER ENGINE
// Grid layout, widget management, templates, sharing
// Pure TypeScript, deterministic, testable
// =============================================================================

export type WidgetType =
  | 'kpi'
  | 'chart'
  | 'table'
  | 'text'
  | 'image'
  | 'filter'
  | 'gauge'
  | 'sparkline';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  config: Record<string, unknown>;
  dataSource?: string;
  refreshInterval?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: 'grid' | 'free';
  columns: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isTemplate: boolean;
  tags: string[];
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text';
  widgetIds: string[];
  config: Record<string, unknown>;
}

export class DashboardBuilderEngine {
  private dashboards = new Map<string, Dashboard>();
  private templates = new Map<string, Dashboard>();
  private filters = new Map<string, DashboardFilter[]>();

  // ---------------------------------------------------------------------------
  // Dashboard CRUD
  // ---------------------------------------------------------------------------

  createDashboard(
    name: string,
    description: string,
    createdBy: string,
    layout: 'grid' | 'free' = 'grid',
    columns: number = 12
  ): Dashboard {
    const id = randomId('dash');
    const now = new Date().toISOString();
    const dashboard: Dashboard = {
      id,
      name,
      description,
      widgets: [],
      layout,
      columns,
      createdAt: now,
      updatedAt: now,
      createdBy,
      isTemplate: false,
      tags: [],
    };
    this.dashboards.set(id, dashboard);
    return dashboard;
  }

  getDashboard(id: string): Dashboard | undefined {
    return this.dashboards.get(id);
  }

  listDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  deleteDashboard(id: string): boolean {
    return this.dashboards.delete(id);
  }

  updateDashboard(id: string, updates: Partial<Dashboard>): Dashboard | null {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) return null;
    Object.assign(dashboard, updates, { updatedAt: new Date().toISOString() });
    return dashboard;
  }

  // ---------------------------------------------------------------------------
  // Widget Management
  // ---------------------------------------------------------------------------

  addWidget(dashboardId: string, widget: Widget): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;
    dashboard.widgets.push(widget);
    dashboard.updatedAt = new Date().toISOString();
    return true;
  }

  removeWidget(dashboardId: string, widgetId: string): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;
    const idx = dashboard.widgets.findIndex((w) => w.id === widgetId);
    if (idx === -1) return false;
    dashboard.widgets.splice(idx, 1);
    dashboard.updatedAt = new Date().toISOString();
    return true;
  }

  updateWidget(dashboardId: string, widgetId: string, updates: Partial<Widget>): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;
    const widget = dashboard.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;
    Object.assign(widget, updates);
    dashboard.updatedAt = new Date().toISOString();
    return true;
  }

  moveWidget(dashboardId: string, widgetId: string, position: WidgetPosition): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;
    const widget = dashboard.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;
    widget.position = position;
    dashboard.updatedAt = new Date().toISOString();
    return true;
  }

  // ---------------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------------

  saveAsTemplate(dashboardId: string, name: string): Dashboard | null {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;
    const template: Dashboard = {
      ...dashboard,
      id: 'tmpl-' + Date.now(),
      name,
      isTemplate: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.set(template.id, template);
    return template;
  }

  getTemplate(id: string): Dashboard | undefined {
    return this.templates.get(id);
  }

  listTemplates(): Dashboard[] {
    return Array.from(this.templates.values());
  }

  createFromTemplate(templateId: string, name: string, createdBy: string): Dashboard | null {
    const template = this.templates.get(templateId);
    if (!template) return null;
    const dashboard = this.createDashboard(
      name,
      template.description,
      createdBy,
      template.layout,
      template.columns
    );
    dashboard.widgets = template.widgets.map((w) => ({
      ...w,
      id: randomId('w'),
    }));
    return dashboard;
  }

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  addFilter(dashboardId: string, filter: DashboardFilter): void {
    const filters = this.filters.get(dashboardId) ?? [];
    filters.push(filter);
    this.filters.set(dashboardId, filters);
  }

  removeFilter(dashboardId: string, filterId: string): boolean {
    const filters = this.filters.get(dashboardId);
    if (!filters) return false;
    const idx = filters.findIndex((f) => f.id === filterId);
    if (idx === -1) return false;
    filters.splice(idx, 1);
    return true;
  }

  getFilters(dashboardId: string): DashboardFilter[] {
    return this.filters.get(dashboardId) ?? [];
  }

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------

  exportDashboard(id: string): string | null {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) return null;
    return JSON.stringify(dashboard, null, 2);
  }

  importDashboard(json: string): Dashboard | null {
    try {
      const dashboard = JSON.parse(json) as Dashboard;
      dashboard.id = 'dash-' + Date.now();
      dashboard.createdAt = new Date().toISOString();
      dashboard.updatedAt = new Date().toISOString();
      this.dashboards.set(dashboard.id, dashboard);
      return dashboard;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  getStats(): {
    totalDashboards: number;
    totalWidgets: number;
    byWidgetType: Record<WidgetType, number>;
  } {
    const dashboards = Array.from(this.dashboards.values());
    const byWidgetType: Record<WidgetType, number> = {
      kpi: 0,
      chart: 0,
      table: 0,
      text: 0,
      image: 0,
      filter: 0,
      gauge: 0,
      sparkline: 0,
    };
    let totalWidgets = 0;

    for (const d of dashboards) {
      totalWidgets += d.widgets.length;
      for (const w of d.widgets) {
        byWidgetType[w.type]++;
      }
    }

    return { totalDashboards: dashboards.length, totalWidgets, byWidgetType };
  }
}
