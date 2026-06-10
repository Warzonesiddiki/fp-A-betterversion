import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore, dashboardSelectors } from './dashboardStore';

describe('dashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      dashboards: [],
      activeDashboardId: null,
      filters: {},
      isLoading: false,
      error: null,
    });
  });

  it('should have empty initial state', () => {
    const state = useDashboardStore.getState();
    expect(state.dashboards).toEqual([]);
    expect(state.activeDashboardId).toBeNull();
  });

  it('should add a dashboard', () => {
    const id = useDashboardStore.getState().addDashboard({
      name: 'Test Dashboard',
      description: 'A test',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'user1',
      isTemplate: false,
      tags: [],
    });
    expect(id).toMatch(/^dash-/);
    expect(useDashboardStore.getState().dashboards).toHaveLength(1);
    expect(useDashboardStore!.getState().dashboards[0]!.name).toBe('Test Dashboard');
  });

  it('should update a dashboard', () => {
    const id = useDashboardStore.getState().addDashboard({
      name: 'Old Name',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    useDashboardStore.getState().updateDashboard(id, { name: 'New Name' });
    expect(useDashboardStore!.getState().dashboards[0]!.name).toBe('New Name');
  });

  it('should delete a dashboard', () => {
    const id = useDashboardStore.getState().addDashboard({
      name: 'To Delete',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    useDashboardStore.getState().deleteDashboard(id);
    expect(useDashboardStore.getState().dashboards).toHaveLength(0);
  });

  it('should set active dashboard', () => {
    const id = useDashboardStore.getState().addDashboard({
      name: 'Active',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    useDashboardStore.getState().setActiveDashboard(id);
    expect(useDashboardStore.getState().activeDashboardId).toBe(id);
  });

  it('should add a widget', () => {
    const dashId = useDashboardStore.getState().addDashboard({
      name: 'Dash',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    useDashboardStore.getState().addWidget(dashId, {
      type: 'kpi',
      title: 'Revenue',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {},
    });
    const dash = useDashboardStore!.getState().dashboards[0]!;
    expect(dash.widgets).toHaveLength(1);
    expect(dash.widgets[0]!.title).toBe('Revenue');
  });

  it('should update a widget', () => {
    const dashId = useDashboardStore.getState().addDashboard({
      name: 'Dash',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    useDashboardStore.getState().addWidget(dashId, {
      type: 'kpi',
      title: 'KPI',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {},
    });
    const wid = useDashboardStore!.getState().dashboards[0]!.widgets[0]!.id;
    useDashboardStore.getState().updateWidget(dashId, wid, { title: 'Updated KPI' });
    expect(useDashboardStore!.getState().dashboards[0]!.widgets[0]!.title).toBe('Updated KPI');
  });

  it('should remove a widget', () => {
    const dashId = useDashboardStore.getState().addDashboard({
      name: 'Dash',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    useDashboardStore.getState().addWidget(dashId, {
      type: 'chart',
      title: 'Chart',
      position: { x: 0, y: 0, w: 6, h: 4 },
      config: {},
    });
    const wid = useDashboardStore!.getState().dashboards[0]!.widgets[0]!.id;
    useDashboardStore.getState().removeWidget(dashId, wid);
    expect(useDashboardStore!.getState().dashboards[0]!.widgets).toHaveLength(0);
  });

  it('should move a widget', () => {
    const dashId = useDashboardStore.getState().addDashboard({
      name: 'Dash',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    useDashboardStore.getState().addWidget(dashId, {
      type: 'kpi',
      title: 'KPI',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {},
    });
    const wid = useDashboardStore!.getState().dashboards[0]!.widgets[0]!.id;
    useDashboardStore.getState().moveWidget(dashId, wid, { x: 6, y: 4, w: 3, h: 2 });
    expect(useDashboardStore!.getState().dashboards[0]!.widgets[0]!.position).toEqual({
      x: 6,
      y: 4,
      w: 3,
      h: 2,
    });
  });

  it('should add a filter', () => {
    const dashId = useDashboardStore.getState().addDashboard({
      name: 'Dash',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    useDashboardStore.getState().addFilter(dashId, {
      name: 'Date Range',
      type: 'daterange',
      widgetIds: [],
      config: {},
    });
    expect(useDashboardStore.getState().filters[dashId]).toHaveLength(1);
    expect(useDashboardStore!.getState().filters[dashId]![0]!.name).toBe('Date Range');
  });

  it('should select active dashboard', () => {
    const id = useDashboardStore.getState().addDashboard({
      name: 'Active Dash',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    useDashboardStore.getState().setActiveDashboard(id);
    const active = dashboardSelectors.activeDashboard(useDashboardStore.getState());
    expect(active).not.toBeNull();
    expect(active!.name).toBe('Active Dash');
  });

  it('should return null for non-existent active dashboard', () => {
    useDashboardStore.getState().setActiveDashboard('nonexistent');
    const active = dashboardSelectors.activeDashboard(useDashboardStore.getState());
    expect(active).toBeNull();
  });

  it('should select dashboard count', () => {
    useDashboardStore.getState().addDashboard({
      name: 'D1',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    useDashboardStore.getState().addDashboard({
      name: 'D2',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    expect(dashboardSelectors.dashboardCount(useDashboardStore.getState())).toBe(2);
  });

  it('should select hasDashboards', () => {
    expect(dashboardSelectors.hasDashboards(useDashboardStore.getState())).toBe(false);
    useDashboardStore.getState().addDashboard({
      name: 'D1',
      description: '',
      widgets: [],
      layout: 'grid',
      columns: 12,
      createdBy: 'u1',
      isTemplate: false,
      tags: [],
    });
    expect(dashboardSelectors.hasDashboards(useDashboardStore.getState())).toBe(true);
  });
});
