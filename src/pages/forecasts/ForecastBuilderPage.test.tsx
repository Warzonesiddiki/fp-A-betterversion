import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/forecastStore', () => ({
  useForecastStore: vi.fn(() => ({ forecasts: [] })),
}));

type GLMockState = {
  entries: unknown[];
  isLoading?: boolean;
  importError?: string | null;
};
let glState: GLMockState = { entries: [], isLoading: false, importError: null };

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => glState),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: () => <div data-testid="sparkline" />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data?.length ?? 0} rows</div>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => <div />,
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

import ForecastBuilderPage from '@/pages/forecasts/ForecastBuilderPage';

/** Six posted revenue months — enough for the builder's populated branch. */
const POPULATED_LEDGER = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'].map(
  (period, i) => ({
    id: `r${i}`,
    accountCode: '4000',
    debit: 0,
    credit: 100000,
    period,
    date: `${period}-15`,
  })
);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/forecasts/builder']}>
      <ForecastBuilderPage />
    </MemoryRouter>
  );
}

/** Same, but with routes resolvable so CTA navigation can be asserted. */
function renderPageWithRoutes() {
  return render(
    <MemoryRouter initialEntries={['/forecasts/create']}>
      <Routes>
        <Route path="/forecasts/create" element={<ForecastBuilderPage />} />
        <Route path="/data" element={<div data-testid="data-import-page">Data Import</div>} />
        <Route path="/data/gl-upload" element={<div data-testid="gl-upload-page">GL Upload</div>} />
        <Route path="*" element={<div data-testid="other-page">Other</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ForecastBuilderPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    glState = { entries: [], isLoading: false, importError: null };
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays heading', () => {
    renderPage();
    expect(screen.getAllByText(/Forecast Builder/i).length).toBeGreaterThan(0);
  });
});

describe('ForecastBuilderPage — W-K30-001 state coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    glState = { entries: [], isLoading: false, importError: null };
  });

  it('renders a loading skeleton while the GL store hydrates (no KPIs yet)', () => {
    glState = { entries: [], isLoading: true, importError: null };
    const { container } = renderPage();
    expect(screen.getByTestId('forecast-builder-loading')).toBeInTheDocument();
    // W-A11Y-002 M5 announce-once: bars stay decorative (aria-hidden) and the
    // whole loading branch owns exactly ONE polite status announcement.
    expect(
      screen.getByTestId('forecast-builder-loading').querySelector('[aria-hidden="true"]')
    ).toBeTruthy();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveTextContent(/loading/i);
    expect(container.querySelector('[data-testid="forecast-kpis"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="forecast-config"]')).not.toBeInTheDocument();
    // The h1 survives every branch (heading-order discipline).
    expect(
      screen.getByRole('heading', { level: 1, name: /Forecast Builder/i })
    ).toBeInTheDocument();
  });

  it('renders ErrorState with retry when the GL store reports an import error', () => {
    glState = { entries: [], isLoading: false, importError: 'Row 12: debit does not balance' };
    renderPage();
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText(/Failed to load GL history/i)).toBeInTheDocument();
    expect(screen.getByText(/Row 12: debit does not balance/i)).toBeInTheDocument();
    expect(screen.getByTestId('error-code')).toHaveTextContent('GL-IMPORT-ERROR');
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Go to Data Import')).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-kpis')).not.toBeInTheDocument();
  });

  it('reloads the page when the error-state retry button is clicked', () => {
    glState = { entries: [], isLoading: false, importError: 'boom' };
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });
    renderPage();
    fireEvent.click(screen.getByText('Retry'));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('renders the empty state with an Import Data CTA when GL history is empty', () => {
    // No entries at all → derived revenue history empty AND required inputs absent.
    renderPage();
    expect(screen.getByTestId('forecast-builder-empty')).toBeInTheDocument();
    expect(screen.getByText(/No GL history to forecast from/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import Data/i })).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-kpis')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /Forecast Builder/i })
    ).toBeInTheDocument();
  });

  it('shows the empty state when entries exist but none derive revenue history', () => {
    // Expense-only ledger: GL has data, but the required input (posted
    // revenue months) is absent — still the empty branch.
    glState = {
      entries: [
        { id: 'e1', accountCode: '6000', debit: 500, credit: 0, period: '2026-01' },
        { id: 'e2', accountCode: '6010', debit: 250, credit: 0, period: '2026-02' },
      ],
      isLoading: false,
      importError: null,
    };
    renderPage();
    expect(screen.getByTestId('forecast-builder-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-kpis')).not.toBeInTheDocument();
  });

  it('navigates to /data/gl-upload from the empty-state Import Data CTA', () => {
    renderPageWithRoutes();
    fireEvent.click(screen.getByRole('button', { name: /Import Data/i }));
    expect(screen.getByTestId('gl-upload-page')).toBeInTheDocument();
  });

  it('navigates to /data from the error-state Go to Data Import secondary action', () => {
    glState = { entries: [], isLoading: false, importError: 'boom' };
    renderPageWithRoutes();
    fireEvent.click(screen.getByText('Go to Data Import'));
    expect(screen.getByTestId('data-import-page')).toBeInTheDocument();
  });

  it('keeps the populated branch unchanged when revenue history exists', () => {
    glState = {
      entries: POPULATED_LEDGER,
      isLoading: false,
      importError: null,
    };
    const { container } = renderPage();
    expect(screen.getByTestId('forecast-kpis')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-config')).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-builder-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('forecast-builder-empty')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
  });
});
