/**
 * @vitest-environment jsdom
 *
 * Interop tests for /forecasts — 4-state CONNECTED evidence (PR #94, 13th route)
 * Proves journey, empty, error, loading per spine-evidence.json policy.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('@/components/charts/HeatmapChart', () => ({
  HeatmapChart: () => <div data-testid="heatmap-chart" />,
}));
vi.mock('@/components/ai/AICopilotPanel', () => ({
  AICopilotPanel: () => <div data-testid="ai-panel" />,
}));

import ForecastListPage from '@/pages/forecasts/ForecastListPage';
import { useForecastStore } from '@/store/forecastStore';
import { actAs } from '@/test/rbacFixtures';
import type { Forecast } from '@/types';

function makeForecast(overrides: Partial<Forecast> & Pick<Forecast, 'id' | 'name'>): Forecast {
  return {
    description: 'Test forecast',
    type: 'Rolling',
    status: 'Completed',
    confidenceLevel: '85%',
    baseScenarioId: 'scn-1',
    drivers: [],
    periods: [],
    createdBy: 'test-user',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastUpdated: '2026-01-02T00:00:00.000Z',
    ...overrides,
  } as Forecast;
}

function resetStores() {
  useForecastStore.setState({
    forecasts: [],
    drivers: [],
    selectedForecastId: null,
    isLoading: false,
    error: null,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/forecasts']}>
      <Routes>
        <Route path="/forecasts" element={<ForecastListPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ForecastListPage interop — 4-state CONNECTED', () => {
  beforeEach(() => {
    resetStores();
    actAs('Admin');
  });

  it('renders the forecast journey with rolling horizon and confidence heatmap', async () => {
    useForecastStore.setState({
      forecasts: [
        makeForecast({
          id: 'fcst-1',
          name: 'FY26 Rolling Forecast',
          createdAt: '2026-02-01T00:00:00.000Z',
        }),
        makeForecast({ id: 'fcst-2', name: 'Q2 Forecast', createdAt: '2026-03-01T00:00:00.000Z' }),
      ],
    });
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /forecasts/i })).toBeInTheDocument();
    expect(screen.getByText(/2 forecasts/i)).toBeInTheDocument();
    expect(screen.getByText(/FY26 Rolling Forecast/)).toBeInTheDocument();
    expect(screen.getByText(/Q2 Forecast/)).toBeInTheDocument();
    expect(await screen.findByTestId('heatmap-chart')).toBeInTheDocument();
  });

  it('shows the empty state when no forecasts exist', () => {
    renderPage();
    expect(screen.getByText(/No Forecasts Yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Forecast/i })).toBeInTheDocument();
  });

  it('shows an error alert when forecasts fail to load and retry succeeds', async () => {
    useForecastStore.setState({ error: 'Failed to load forecasts' });
    renderPage();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load forecasts/i)).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /Retry/i });
    retry.click();
    expect(await screen.findByText(/No Forecasts Yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('hydrate skeleton announces exactly once via srLabel, bars decorative', () => {
    useForecastStore.setState({ isLoading: true });
    const { container } = renderPage();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveTextContent('Loading forecasts…');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
