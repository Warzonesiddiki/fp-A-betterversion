/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [
      {
        id: '1',
        accountId: 'a1',
        accountCode: '4000',
        accountName: 'freight revenue',
        period: 'P1',
        periodName: 'P1',
        debit: 0,
        credit: 1_200_000,
        netChange: -1_200_000,
        date: '2026-01-01',
        amount: 1_200_000,
        description: 'freight revenue',
        reference: 'r',
      },
    ],
    accounts: [],
  })),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/utils/formatters', () => ({
  formatCurrency: (n: number) => `$${n}`,
  formatNumber: (n: number) => `${n}`,
  formatCompactNumber: (n: number) => `$${n}`,
  formatCompact: (n: number) => `${n}`,
  formatPercent: (n: number) => `${n}%`,
}));

vi.mock('@/utils/financialFormatting', () => ({
  formatPercent: (n: number) => `${n}%`,
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
    Truck: makeIcon(),
    Package: makeIcon(),
    Gauge: makeIcon(),
    Fuel: makeIcon(),
    MapPin: makeIcon(),
    Landmark: makeIcon(),
    Coins: makeIcon(),
    Users: makeIcon(),
    Banknote: makeIcon(),
    FileCheck2: makeIcon(),
    ShieldCheck: makeIcon(),
    CalendarClock: makeIcon(),
    TrendingDown: makeIcon(),
    GraduationCap: makeIcon(),
    UserCheck: makeIcon(),
    FlaskConical: makeIcon(),
    TrendingUp: makeIcon(),
    Award: makeIcon(),
    PieChart: makeIcon(),
    Percent: makeIcon(),
    Warehouse: makeIcon(),
  };
});

import FleetCostDashboardPage from '@/pages/logistics/FleetCostDashboardPage';
import WarehouseCostDashboardPage from '@/pages/logistics/WarehouseCostDashboardPage';
import GrantDisbursementPage from '@/pages/government/GrantDisbursementPage';
import ProcurementCyclePage from '@/pages/government/ProcurementCyclePage';
import EnrollmentRetentionPage from '@/pages/education/EnrollmentRetentionPage';
import ResearchGrantsPage from '@/pages/education/ResearchGrantsPage';

function renderPage(PageComponent: React.ComponentType, routePath: string) {
  return render(
    <MemoryRouter initialEntries={[routePath]}>
      <Routes>
        <Route path={routePath} element={<PageComponent />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Sector Depth specialized page smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FleetCostDashboardPage renders dashboard', () => {
    const { container } = renderPage(FleetCostDashboardPage, '/logistics/fleet-cost');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('WarehouseCostDashboardPage renders dashboard', () => {
    const { container } = renderPage(WarehouseCostDashboardPage, '/logistics/warehouse-cost');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('GrantDisbursementPage renders dashboard', () => {
    const { container } = renderPage(GrantDisbursementPage, '/government/grants');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('ProcurementCyclePage renders dashboard', () => {
    const { container } = renderPage(ProcurementCyclePage, '/government/procurement');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('EnrollmentRetentionPage renders dashboard', () => {
    const { container } = renderPage(EnrollmentRetentionPage, '/education/enrollment');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('ResearchGrantsPage renders dashboard', () => {
    const { container } = renderPage(ResearchGrantsPage, '/education/research-grants');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
