import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardBuilderEngine, type Widget } from './DashboardBuilderEngine';

describe('DashboardBuilderEngine', () => {
  let engine: DashboardBuilderEngine;

  beforeEach(() => {
    engine = new DashboardBuilderEngine();
  });

  it('should create a dashboard', () => {
    const dashboard = engine.createDashboard('CFO Dashboard', 'Financial overview', 'admin');
    expect(dashboard.id).toBeDefined();
    expect(dashboard.name).toBe('CFO Dashboard');
    expect(dashboard.columns).toBe(12);
  });

  it('should list dashboards', () => {
    engine.createDashboard('D1', 'test', 'admin');
    engine.createDashboard('D2', 'test', 'admin');
    expect(engine.listDashboards()).toHaveLength(2);
  });

  it('should delete a dashboard', () => {
    const d = engine.createDashboard('Test', 'test', 'admin');
    expect(engine.deleteDashboard(d.id)).toBe(true);
    expect(engine.getDashboard(d.id)).toBeUndefined();
  });

  it('should add widgets', () => {
    const d = engine.createDashboard('Test', 'test', 'admin');
    const widget: Widget = {
      id: 'w1',
      type: 'kpi',
      title: 'Revenue',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: { metric: 'revenue' },
    };
    expect(engine.addWidget(d.id, widget)).toBe(true);
    expect(engine.getDashboard(d.id)?.widgets).toHaveLength(1);
  });

  it('should remove widgets', () => {
    const d = engine.createDashboard('Test', 'test', 'admin');
    engine.addWidget(d.id, {
      id: 'w1',
      type: 'kpi',
      title: 'R',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {},
    });
    expect(engine.removeWidget(d.id, 'w1')).toBe(true);
    expect(engine.getDashboard(d.id)?.widgets).toHaveLength(0);
  });

  it('should move widgets', () => {
    const d = engine.createDashboard('Test', 'test', 'admin');
    engine.addWidget(d.id, {
      id: 'w1',
      type: 'kpi',
      title: 'R',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {},
    });
    expect(engine.moveWidget(d.id, 'w1', { x: 3, y: 0, w: 3, h: 2 })).toBe(true);
    expect(engine!.getDashboard(d.id)?.widgets[0]!.position.x).toBe(3);
  });

  it('should save as template', () => {
    const d = engine.createDashboard('Test', 'test', 'admin');
    engine.addWidget(d.id, {
      id: 'w1',
      type: 'kpi',
      title: 'R',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {},
    });
    const template = engine.saveAsTemplate(d.id, 'My Template');
    expect(template?.isTemplate).toBe(true);
    expect(engine.listTemplates()).toHaveLength(1);
  });

  it('should create from template', () => {
    const d = engine.createDashboard('Test', 'test', 'admin');
    engine.addWidget(d.id, {
      id: 'w1',
      type: 'kpi',
      title: 'R',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {},
    });
    const template = engine.saveAsTemplate(d.id, 'My Template');
    const newDash = engine.createFromTemplate(template!.id, 'New Dashboard', 'user1');
    expect(newDash?.widgets).toHaveLength(1);
    expect(newDash?.widgets[0]!.id).not.toBe('w1');
  });

  it('should manage filters', () => {
    const d = engine.createDashboard('Test', 'test', 'admin');
    engine.addFilter(d.id, {
      id: 'f1',
      name: 'Period',
      type: 'select',
      widgetIds: ['w1'],
      config: {},
    });
    expect(engine.getFilters(d.id)).toHaveLength(1);
    engine.removeFilter(d.id, 'f1');
    expect(engine.getFilters(d.id)).toHaveLength(0);
  });

  it('should export and import dashboards', () => {
    const d = engine.createDashboard('Test', 'test', 'admin');
    const json = engine.exportDashboard(d.id);
    expect(json).toBeDefined();
    const imported = engine.importDashboard(json!);
    expect(imported?.name).toBe('Test');
    expect(imported?.id).not.toBe(d.id);
  });

  it('should get stats', () => {
    const d = engine.createDashboard('Test', 'test', 'admin');
    engine.addWidget(d.id, {
      id: 'w1',
      type: 'kpi',
      title: 'R',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {},
    });
    engine.addWidget(d.id, {
      id: 'w2',
      type: 'chart',
      title: 'C',
      position: { x: 3, y: 0, w: 6, h: 4 },
      config: {},
    });
    const stats = engine.getStats();
    expect(stats.totalDashboards).toBe(1);
    expect(stats.totalWidgets).toBe(2);
    expect(stats.byWidgetType.kpi).toBe(1);
    expect(stats.byWidgetType.chart).toBe(1);
  });
});
