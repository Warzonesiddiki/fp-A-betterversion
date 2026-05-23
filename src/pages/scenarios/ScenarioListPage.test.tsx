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

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Plus: makeIcon(),
    Eye: makeIcon(),
    FlaskConical: makeIcon(),
  };
});

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
    expect(container).toBeTruthy();
  });

  it('displays the empty state when no scenarios exist', () => {
    renderPage(ScenarioListPage, '/scenarios', '/scenarios');
    expect(screen.getByText(/No Scenarios Yet/i)).toBeInTheDocument();
  });
});
