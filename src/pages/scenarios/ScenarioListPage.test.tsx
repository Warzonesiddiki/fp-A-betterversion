/**
 * @vitest-environment jsdom
 *
 * Real-store suite (fleet wave 3, lane R39): the last scenarioStore MODULE-mock
 * in this area is gone. The store is seeded through merge-style setState in
 * beforeEach, RBAC is satisfied by actAs('Admin') (real ROLE_PERMISSIONS grant,
 * no enforce() stubbing), and the card click-through exercises the real
 * setSelectedScenario action + router navigation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// Shared lucide double (N-0001).
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// jsdom has no layout engine; render the probability treemap as a plain node.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Treemap: () => null,
  Tooltip: () => null,
}));

import ScenarioListPage from '@/pages/scenarios/ScenarioListPage';
import { useScenarioStore } from '@/store/scenarioStore';
import { actAs } from '@/test/rbacFixtures';
import type { Scenario } from '@/types';

function makeScenario(overrides: Partial<Scenario> & Pick<Scenario, 'id' | 'name'>): Scenario {
  return {
    description: '',
    baseBudgetId: 'budget-1',
    baseBudgetName: 'FY26 Base Budget',
    type: 'Base',
    probability: 0.5,
    isActive: false,
    isLocked: false,
    assumptions: [],
    calculatedMetrics: {
      revenue: 0,
      ebitda: 0,
      netIncome: 0,
      cashFlow: 0,
      headcount: 0,
      burnRate: 0,
      runway: 0,
      grossMargin: 0,
      ebitdaMargin: 0,
    },
    createdBy: 'test-user-admin',
    createdByName: 'Test Admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Merge-style reset: keeps the real immer/persist actions intact. */
function resetStores() {
  useScenarioStore.setState({
    scenarios: [],
    selectedScenarioId: null,
    comparedScenarioIds: [],
    isLoading: false,
    error: null,
  });
}

describe('ScenarioListPage', () => {
  beforeEach(() => {
    resetStores();
    // Real role grant from ROLE_PERMISSIONS — card click fires setSelectedScenario
    // which is gated behind Permissions.UI_UPDATE ('ui:update').
    actAs('Admin');
  });

  it('renders without crashing when scenarios exist (non-empty mount)', () => {
    useScenarioStore.setState({
      scenarios: [
        makeScenario({ id: 'scn-1', name: 'Base Case', createdAt: '2026-02-01T00:00:00.000Z' }),
        makeScenario({
          id: 'scn-2',
          name: 'Upside Case',
          type: 'Optimistic',
          createdAt: '2026-03-01T00:00:00.000Z',
        }),
      ],
    });
    const { container } = renderPage(ScenarioListPage, '/scenarios', '/scenarios');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('heading', { name: /scenarios/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/2 scenarios/i)).toBeInTheDocument();
    // Names also appear in the toolbar merge-picker <option>s — assert the card
    // headings specifically.
    expect(screen.getByRole('heading', { name: 'Base Case' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upside Case' })).toBeInTheDocument();
  });

  it('displays the empty state when no scenarios exist', () => {
    renderPage(ScenarioListPage, '/scenarios', '/scenarios');
    expect(screen.getByText(/No Scenarios Yet/i)).toBeInTheDocument();
  });

  it('clicking a scenario card selects it in the store and navigates to its detail route', async () => {
    const user = userEvent.setup();
    useScenarioStore.setState({
      scenarios: [makeScenario({ id: 'scn-42', name: 'Downside Case' })],
    });
    renderPage(ScenarioListPage, '/scenarios', '/scenarios');

    // Click the card heading — the event bubbles to the clickable Card wrapper.
    await user.click(screen.getByRole('heading', { name: 'Downside Case' }));

    // Real store action fired through RBAC (ui:update granted to Admin above).
    expect(useScenarioStore.getState().selectedScenarioId).toBe('scn-42');
    // Detail route is not registered in this harness → catch-all renders.
    expect(screen.getByText('Redirected')).toBeInTheDocument();
  });
});

function renderPage(PageComponent: React.ComponentType, initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={<PageComponent />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}
