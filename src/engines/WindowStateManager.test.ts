import { describe, it, expect, beforeEach } from 'vitest';
import { WindowStateManager } from './WindowStateManager';

describe('WindowStateManager', () => {
  let manager: WindowStateManager;

  beforeEach(() => {
    manager = new WindowStateManager();
  });

  it('should initialize with default state', () => {
    const state = manager.getState();
    expect(state.geometry.width).toBe(1400);
    expect(state.geometry.height).toBe(900);
    expect(state.layout.sidebarWidth).toBe(240);
    expect(state.layout.activePage).toBe('/dashboard');
  });

  it('should get geometry', () => {
    const geo = manager.getGeometry();
    expect(geo.x).toBe(100);
    expect(geo.y).toBe(100);
    expect(geo.maximized).toBe(false);
  });

  it('should set position', () => {
    manager.setPosition(200, 300);
    const geo = manager.getGeometry();
    expect(geo.x).toBe(200);
    expect(geo.y).toBe(300);
  });

  it('should set size', () => {
    manager.setSize(1600, 1000);
    const geo = manager.getGeometry();
    expect(geo.width).toBe(1600);
    expect(geo.height).toBe(1000);
  });

  it('should enforce minimum size', () => {
    manager.setSize(100, 100);
    const geo = manager.getGeometry();
    expect(geo.width).toBe(800);
    expect(geo.height).toBe(600);
  });

  it('should set maximized', () => {
    manager.setMaximized(true);
    expect(manager.getGeometry().maximized).toBe(true);
  });

  it('should set geometry partially', () => {
    manager.setGeometry({ x: 50 });
    const geo = manager.getGeometry();
    expect(geo.x).toBe(50);
    expect(geo.y).toBe(100); // unchanged
  });

  it('should get layout', () => {
    const layout = manager.getLayout();
    expect(layout.sidebarCollapsed).toBe(false);
    expect(layout.formulaBarVisible).toBe(true);
    expect(layout.statusBarVisible).toBe(true);
  });

  it('should set sidebar width', () => {
    manager.setSidebarWidth(300);
    expect(manager.getLayout().sidebarWidth).toBe(300);
  });

  it('should enforce sidebar width bounds', () => {
    manager.setSidebarWidth(50);
    expect(manager.getLayout().sidebarWidth).toBe(150); // min
    manager.setSidebarWidth(600);
    expect(manager.getLayout().sidebarWidth).toBe(500); // max
  });

  it('should set sidebar collapsed', () => {
    manager.setSidebarCollapsed(true);
    expect(manager.getLayout().sidebarCollapsed).toBe(true);
  });

  it('should toggle formula bar', () => {
    manager.setFormulaBarVisible(false);
    expect(manager.getLayout().formulaBarVisible).toBe(false);
  });

  it('should toggle status bar', () => {
    manager.setStatusBarVisible(false);
    expect(manager.getLayout().statusBarVisible).toBe(false);
  });

  it('should toggle property panel', () => {
    manager.setPropertyPanelVisible(true);
    expect(manager.getLayout().propertyPanelVisible).toBe(true);
  });

  it('should set property panel width', () => {
    manager.setPropertyPanelWidth(400);
    expect(manager.getLayout().propertyPanelWidth).toBe(400);
  });

  it('should enforce property panel width bounds', () => {
    manager.setPropertyPanelWidth(100);
    expect(manager.getLayout().propertyPanelWidth).toBe(200); // min
    manager.setPropertyPanelWidth(700);
    expect(manager.getLayout().propertyPanelWidth).toBe(600); // max
  });

  it('should set active tab', () => {
    manager.setActiveTab('data');
    expect(manager.getLayout().activeTab).toBe('data');
  });

  it('should set active page', () => {
    manager.setActivePage('/forecasts');
    expect(manager.getLayout().activePage).toBe('/forecasts');
  });

  it('should reset to defaults', () => {
    manager.setPosition(500, 500);
    manager.setSize(2000, 1500);
    manager.reset();
    const state = manager.getState();
    expect(state.geometry.x).toBe(100);
    expect(state.geometry.width).toBe(1400);
  });

  it('should serialize and deserialize', () => {
    manager.setPosition(200, 300);
    manager.setSidebarWidth(350);
    const json = manager.serialize();
    const newManager = new WindowStateManager();
    newManager.deserialize(json);
    expect(newManager.getGeometry().x).toBe(200);
    expect(newManager.getLayout().sidebarWidth).toBe(350);
  });

  it('should handle invalid JSON gracefully', () => {
    manager.deserialize('invalid json');
    const state = manager.getState();
    expect(state.geometry.width).toBe(1400); // default
  });

  it('should update lastSaved on changes', () => {
    const before = new Date().toISOString();
    manager.setPosition(1, 1);
    const after = manager.getState().lastSaved;
    expect(after >= before).toBe(true);
  });
});
