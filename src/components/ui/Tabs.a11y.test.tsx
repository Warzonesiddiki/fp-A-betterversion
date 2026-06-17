/**
 * @vitest-environment jsdom
 *
 * WAI-ARIA Tabs Pattern conformance tests for the Tabs compound component.
 *
 * These tests cover the additions made on top of the base Tabs component:
 * - aria-controls / aria-labelledby wiring between trigger and panel
 * - Roving tabindex (only the active tab is in the tab order)
 * - Keyboard navigation: ArrowLeft, ArrowRight, Home, End (with wrap-around)
 *
 * Lives in a separate file from Tabs.test.tsx so the two suites can evolve
 * independently (the base Tabs.test.tsx is exercised by the standard React Testing
 * Library test path; this file focuses on a11y/wcag patterns).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

interface RenderTabsOptions {
  defaultValue?: string;
}

function renderTabs(opts: RenderTabsOptions = {}) {
  const { defaultValue = 'tab1' } = opts;
  return render(
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        <TabsTrigger value="tab1">Overview</TabsTrigger>
        <TabsTrigger value="tab2">Details</TabsTrigger>
        <TabsTrigger value="tab3">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Overview content</TabsContent>
      <TabsContent value="tab2">Details content</TabsContent>
      <TabsContent value="tab3">Settings content</TabsContent>
    </Tabs>
  );
}

describe('Tabs (WAI-ARIA Tabs Pattern a11y)', () => {
  beforeEach(() => {
    // Ensure each test starts with a clean DOM/focus state
    document.body.innerHTML = '';
  });

  // ── aria-controls + aria-labelledby wiring ─────────────────────────────
  it('trigger has id, aria-controls, and matching panel has aria-labelledby', () => {
    renderTabs();
    const overviewTab = screen.getByRole('tab', { name: 'Overview' });
    const controlsId = overviewTab.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    const panel = screen.getByRole('tabpanel', { name: 'Overview' });
    expect(panel).toHaveAttribute('id', controlsId as string);
    expect(panel).toHaveAttribute('aria-labelledby', overviewTab.id);
  });

  it('every tab has a unique id and references a unique panel', () => {
    renderTabs();
    const tabs = screen.getAllByRole('tab');
    const ids = tabs.map((t) => t.id);
    expect(new Set(ids).size).toBe(tabs.length);
    const controlsIds = tabs.map((t) => t.getAttribute('aria-controls'));
    expect(new Set(controlsIds).size).toBe(tabs.length);
  });

  it('panel id equals trigger aria-controls (round-trip)', () => {
    renderTabs();
    const detailsTab = screen.getByRole('tab', { name: 'Details' });
    const controlsId = detailsTab.getAttribute('aria-controls') as string;
    const detailsPanel = document.getElementById(controlsId);
    expect(detailsPanel).not.toBeNull();
    expect(detailsPanel).toHaveAttribute('aria-labelledby', detailsTab.id);
  });

  // ── Roving tabindex (WAI-ARIA Tabs Pattern) ────────────────────────────
  it('active tab has tabindex=0', () => {
    renderTabs();
    const activeTab = screen.getByRole('tab', { selected: true });
    expect(activeTab).toHaveAttribute('tabindex', '0');
  });

  it('inactive tabs have tabindex=-1', () => {
    renderTabs();
    const inactiveTabs = screen.getAllByRole('tab', { selected: false });
    expect(inactiveTabs).toHaveLength(2);
    inactiveTabs.forEach((tab) => {
      expect(tab).toHaveAttribute('tabindex', '-1');
    });
  });

  it('roving tabindex updates when active tab changes', () => {
    renderTabs();
    fireEvent.click(screen.getByRole('tab', { name: 'Details' }));
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('tabindex', '-1');
  });

  // ── Keyboard navigation: ArrowRight / ArrowLeft / Home / End ───────────
  it('ArrowRight on first tab moves focus + activates next tab', () => {
    renderTabs();
    const firstTab = screen.getByRole('tab', { name: 'Overview' });
    firstTab.focus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    const detailsTab = screen.getByRole('tab', { name: 'Details' });
    expect(detailsTab).toHaveFocus();
    expect(detailsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft on first tab wraps to last tab and activates it', () => {
    renderTabs();
    const firstTab = screen.getByRole('tab', { name: 'Overview' });
    firstTab.focus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });
    const lastTab = screen.getByRole('tab', { name: 'Settings' });
    expect(lastTab).toHaveFocus();
    expect(lastTab).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight on last tab wraps to first tab and activates it', () => {
    renderTabs({ defaultValue: 'tab3' });
    const lastTab = screen.getByRole('tab', { name: 'Settings' });
    lastTab.focus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    const firstTab = screen.getByRole('tab', { name: 'Overview' });
    expect(firstTab).toHaveFocus();
    expect(firstTab).toHaveAttribute('aria-selected', 'true');
  });

  it('Home key moves focus + activates first tab', () => {
    renderTabs({ defaultValue: 'tab3' });
    const lastTab = screen.getByRole('tab', { name: 'Settings' });
    lastTab.focus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Home' });
    const firstTab = screen.getByRole('tab', { name: 'Overview' });
    expect(firstTab).toHaveFocus();
    expect(firstTab).toHaveAttribute('aria-selected', 'true');
  });

  it('End key moves focus + activates last tab', () => {
    renderTabs();
    const firstTab = screen.getByRole('tab', { name: 'Overview' });
    firstTab.focus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'End' });
    const lastTab = screen.getByRole('tab', { name: 'Settings' });
    expect(lastTab).toHaveFocus();
    expect(lastTab).toHaveAttribute('aria-selected', 'true');
  });

  it('unrelated keys (e.g. Enter) do not change focus or active tab', () => {
    renderTabs();
    const firstTab = screen.getByRole('tab', { name: 'Overview' });
    firstTab.focus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Enter' });
    expect(firstTab).toHaveFocus();
    expect(firstTab).toHaveAttribute('aria-selected', 'true');
  });

  it('typing key in middle tab moves focus by one (ArrowRight from middle)', () => {
    renderTabs({ defaultValue: 'tab2' });
    const detailsTab = screen.getByRole('tab', { name: 'Details' });
    detailsTab.focus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    const settingsTab = screen.getByRole('tab', { name: 'Settings' });
    expect(settingsTab).toHaveFocus();
    expect(settingsTab).toHaveAttribute('aria-selected', 'true');
  });
});
