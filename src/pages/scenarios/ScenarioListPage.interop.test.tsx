/**
 * @vitest-environment jsdom
 *
 * Interop tests for /scenarios — 4-state CONNECTED evidence (PR #94, 12th route)
 * Proves journey, empty, error, loading per spine-evidence.json policy.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
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

function resetStores() {
  useScenarioStore.setState({
    scenarios: [],
    selectedScenarioId: null,
    comparedScenarioIds: [],
    isLoading: false,
    error: null,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/scenarios']}>
      <Routes>
        <Route path="/scenarios" element={<ScenarioListPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ScenarioListPage interop — 4-state CONNECTED', () => {
  beforeEach(() => {
    resetStores();
    actAs('Admin');
  });

  it('renders the scenario journey with driver-based cards and probability treemap', async () => {
    useScenarioStore.setState({
      scenarios: [
        makeScenario({ id: 'scn-1', name: 'Base Case', createdAt: '2026-02-01T00:00:00.000Z' }),
        makeScenario({
          id: 'scn-2',
          name: 'Upside Case',
          type: 'Optimistic',
          probability: 0.3,
          createdAt: '2026-03-01T00:00:00.000Z',
        }),
      ],
    });
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /scenarios/i })).toBeInTheDocument();
    expect(screen.getByText(/2 scenarios/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Base Case' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upside Case' })).toBeInTheDocument();
    expect(await screen.findByText(/Scenario Probability Distribution/i)).toBeInTheDocument();
  });

  it('shows the empty state when no scenarios exist', () => {
    renderPage();
    expect(screen.getByText(/No Scenarios Yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Scenario/i })).toBeInTheDocument();
  });

  it('shows an error alert when scenarios fail to load and retry succeeds', async () => {
    useScenarioStore.setState({ error: 'Failed to load scenarios' });
    renderPage();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load scenarios/i)).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /Retry/i });
    retry.click();
    expect(await screen.findByText(/No Scenarios Yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('hydrate skeleton announces exactly once via srLabel, bars decorative', () => {
    useScenarioStore.setState({ isLoading: true });
    const { container } = renderPage();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveTextContent('Loading scenarios…');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
