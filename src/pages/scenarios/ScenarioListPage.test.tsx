/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/scenarioStore', () => ({
  useScenarioStore: vi.fn(() => ({
    scenarios: [],
    selectedScenarioId: null,
    comparedScenarioIds: [],
    isLoading: false,
    setScenarios: vi.fn(),
    setSelectedScenario: vi.fn(),
    createScenario: vi.fn(),
    updateScenario: vi.fn(),
    deleteScenario: vi.fn(),
  })),
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import ScenarioListPage from '@/pages/scenarios/ScenarioListPage';

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

describe('ScenarioListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage(ScenarioListPage, '/scenarios', '/scenarios');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays the empty state when no scenarios exist', () => {
    renderPage(ScenarioListPage, '/scenarios', '/scenarios');
    expect(screen.getByText(/No Scenarios Yet/i)).toBeInTheDocument();
  });
});
