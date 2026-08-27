/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// Selector-aware mock: the page subscribes via useForecastStore((s) => s.forecasts),
// so the mock must apply a selector when one is passed.
vi.mock('@/store/forecastStore', () => ({
  useForecastStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      forecasts: [],
      drivers: [],
      selectedForecastId: null,
      isLoading: false,
      setForecasts: vi.fn(),
      createForecast: vi.fn(),
      updateForecast: vi.fn(),
      deleteForecast: vi.fn(),
      addDriver: vi.fn(),
      updateDriver: vi.fn(),
      removeDriver: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
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
    TrendingUp: makeIcon(),
  };
});

import ForecastListPage from '@/pages/forecasts/ForecastListPage';

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

describe('ForecastListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage(ForecastListPage, '/forecasts', '/forecasts');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays the empty state when no forecasts exist', () => {
    renderPage(ForecastListPage, '/forecasts', '/forecasts');
    expect(screen.getByText(/No Forecasts Yet/i)).toBeInTheDocument();
  });
});
