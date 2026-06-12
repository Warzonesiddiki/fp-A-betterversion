/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock recharts
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  };
});

// Mock stores
const useGLStoreMock = vi.fn();
vi.mock('@/store/glStore', () => ({
  useGLStore: () => useGLStoreMock(),
}));

// Mock ExportEngine
vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToExcel: vi.fn(),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = makeIcon();
  }
  return mocked;
});

import InventoryDashboard from '@/pages/retail/InventoryDashboard';

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

const mockEntries = [
  {
    id: '1',
    accountCode: '1210',
    accountName: 'Inventory',
    debit: 50000,
    credit: 0,
    netChange: 50000,
    period: '2023-01',
    description: 'desc',
    currency: 'USD',
    date: '2023-01-01',
    department: 'store1',
  },
  {
    id: '2',
    accountCode: '5000',
    accountName: 'COGS',
    debit: 10000,
    credit: 0,
    netChange: 10000,
    period: '2023-01',
    description: 'desc2',
    currency: 'USD',
    date: '2023-01-02',
    department: 'store1',
  },
  {
    id: '3',
    accountCode: '4000',
    accountName: 'Revenue',
    debit: 0,
    credit: 20000,
    netChange: -20000,
    period: '2023-01',
    description: 'desc3',
    currency: 'USD',
    date: '2023-01-03',
    department: 'store1',
  },
];

describe('Page: InventoryDashboard', () => {
  const navigateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);

    useGLStoreMock.mockReturnValue({
      entries: mockEntries,
    });
  });

  describe('Smoke Test', () => {
    it('renders without crashing using lazy-loaded route test pattern', async () => {
      renderPage(InventoryDashboard, '/retail/inventory-dashboard', '/retail/inventory-dashboard');
      expect(await screen.findByText('Inventory Dashboard')).toBeInTheDocument();
    });

    it('renders empty state when no entries', async () => {
      useGLStoreMock.mockReturnValue({ entries: [] });
      renderPage(InventoryDashboard, '/retail/inventory-dashboard', '/retail/inventory-dashboard');
      expect(await screen.findByText('No Inventory Data')).toBeInTheDocument();
    });
  });

  describe('Integration Test', () => {
    it('navigates to GL upload when import button is clicked in empty state', async () => {
      useGLStoreMock.mockReturnValue({ entries: [] });
      renderPage(InventoryDashboard, '/retail/inventory-dashboard', '/retail/inventory-dashboard');

      const importBtn = await screen.findByRole('button', { name: /Import GL Data/i });
      fireEvent.click(importBtn);

      expect(navigateMock).toHaveBeenCalledWith('/data/gl-upload');
    });

    it('exports data when export button is clicked', async () => {
      renderPage(InventoryDashboard, '/retail/inventory-dashboard', '/retail/inventory-dashboard');

      const { ExportEngine } = await import('@/engines/ExportEngine');

      const exportBtn = await screen.findByRole('button', { name: /Export/i });
      fireEvent.click(exportBtn);

      expect(ExportEngine.exportToExcel).toHaveBeenCalled();
    });

    it('navigates to planning when planning button is clicked', async () => {
      renderPage(InventoryDashboard, '/retail/inventory-dashboard', '/retail/inventory-dashboard');

      const planBtn = await screen.findByRole('button', { name: /Planning/i });
      fireEvent.click(planBtn);

      expect(navigateMock).toHaveBeenCalledWith('/retail/inventory-planning');
    });
  });

  describe('Accessibility Test', () => {
    it('has no accessibility violations in loaded state', async () => {
      const { container } = renderPage(
        InventoryDashboard,
        '/retail/inventory-dashboard',
        '/retail/inventory-dashboard'
      );
      await screen.findByText('Inventory Dashboard');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in empty state', async () => {
      useGLStoreMock.mockReturnValue({ entries: [] });
      const { container } = renderPage(
        InventoryDashboard,
        '/retail/inventory-dashboard',
        '/retail/inventory-dashboard'
      );
      await screen.findByText('No Inventory Data');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
