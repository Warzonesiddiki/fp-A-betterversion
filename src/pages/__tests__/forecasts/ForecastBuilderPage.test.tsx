/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useForecastStore } from '@/store/forecastStore';
import { useGLStore } from '@/store/glStore';
import { ExportEngine } from '@/engines/ExportEngine';

expect.extend(toHaveNoViolations);

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock stores
vi.mock('@/store/forecastStore', () => ({
  useForecastStore: vi.fn(() => ({ forecasts: [] })),
}));
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

// Mock ExportEngine
vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn(),
    exportToExcel: vi.fn(async () => {}),
  },
}));

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// Import component
import ForecastBuilderPage from '@/pages/forecasts/ForecastBuilderPage';

function renderPage(PageComponent: React.ComponentType, initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path={routePath} element={<PageComponent />} />
          <Route path="*" element={<div>Redirected</div>} />
        </Routes>
      </Suspense>
    </MemoryRouter>
  );
}

describe('Page: ForecastBuilderPage', () => {
  const navigateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(useForecastStore).mockReturnValue({ forecasts: [] } as any);
    vi.mocked(useGLStore).mockReturnValue({ entries: [] } as any);
  });

  describe('Smoke Test', () => {
    it('renders without crashing using lazy-loaded route test pattern', async () => {
      renderPage(ForecastBuilderPage, '/forecasts/builder', '/forecasts/builder');
      expect(await screen.findByText('Forecast Builder')).toBeInTheDocument();
      expect(await screen.findByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('Integration Test', () => {
    it('allows changing forecast method', async () => {
      renderPage(ForecastBuilderPage, '/forecasts/builder', '/forecasts/builder');

      const cagrBtn = await screen.findByRole('button', { name: /CAGR forecast method/i });
      fireEvent.click(cagrBtn);

      // Since KPIValue delays rendering the value to animate, we wait for it.
      expect(await screen.findByText('CAGR', { selector: 'div.text-2xl' })).toBeInTheDocument();
    });

    it('exports to PDF', async () => {
      renderPage(ForecastBuilderPage, '/forecasts/builder', '/forecasts/builder');
      const pdfBtn = await screen.findByRole('button', { name: /PDF/i });
      fireEvent.click(pdfBtn);

      expect(ExportEngine.exportToPDF).toHaveBeenCalled();
    });

    it('exports to Excel', async () => {
      renderPage(ForecastBuilderPage, '/forecasts/builder', '/forecasts/builder');
      const excelBtn = await screen.findByRole('button', { name: /Excel/i });
      fireEvent.click(excelBtn);

      expect(ExportEngine.exportToExcel).toHaveBeenCalled();
    });

    it('displays accuracy metrics', async () => {
      renderPage(ForecastBuilderPage, '/forecasts/builder', '/forecasts/builder');
      // The description now names the method that produced the figure: the
      // statistics come from a walk-forward backtest, not from four literals.
      expect(await screen.findByText(/Mean Absolute Percentage Error/)).toBeInTheDocument();
      expect(screen.getByText(/walk-forward backtest/)).toBeInTheDocument();
    });
  });

  describe('Accessibility Test', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderPage(
        ForecastBuilderPage,
        '/forecasts/builder',
        '/forecasts/builder'
      );
      await screen.findByText('Forecast Builder');
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
