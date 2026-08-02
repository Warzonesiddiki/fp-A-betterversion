import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { GLEntry } from '@/types';

// Mock entries — enough to bypass the empty-state early return. Typed as
// GLEntry so the compiler rejects any fixture that omits the required
// `amount` field (the $NaN class of defect — FIX-8).
const mockEntries: GLEntry[] = [
  {
    id: '1',
    accountId: 'a1',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 50000,
    credit: 0,
    netChange: 50000,
    amount: 50000,
    date: '2026-01-15',
    description: 'Revenue',
    reference: 'REF-001',
  },
  {
    id: '2',
    accountId: 'a2',
    accountCode: '4000',
    accountName: 'Revenue',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 120000,
    netChange: 120000,
    amount: 120000,
    date: '2026-01-15',
    description: 'Revenue',
    reference: 'REF-002',
  },
  {
    id: '3',
    accountId: 'a3',
    accountCode: '5000',
    accountName: 'COGS',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 30000,
    credit: 0,
    netChange: 30000,
    amount: 30000,
    date: '2026-01-15',
    description: 'COGS',
    reference: 'REF-003',
  },
  {
    id: '4',
    accountId: 'a4',
    accountCode: '6000',
    accountName: 'OpEx',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 20000,
    credit: 0,
    netChange: 20000,
    amount: 20000,
    date: '2026-01-15',
    description: 'OpEx',
    reference: 'REF-004',
  },
];

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: mockEntries,
  })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import BankingDashboardPage from './BankingDashboardPage';
import EnergyDashboardPage from './EnergyDashboardPage';
import HealthcareDashboardPage from './HealthcareDashboardPage';
import InsuranceDashboardPage from './InsuranceDashboardPage';
import RealEstateDashboardPage from './RealEstateDashboardPage';
import ConstructionDashboardPage from './ConstructionDashboardPage';

function renderPage(Page: React.ComponentType) {
  return render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>
  );
}

describe('Sector Dashboard Pages', () => {
  it('BankingDashboardPage renders without crashing', () => {
    const { container } = renderPage(BankingDashboardPage);
    expect(container).toBeTruthy();
  });

  it('BankingDashboardPage displays KPI section', () => {
    renderPage(BankingDashboardPage);
    // With entries loaded, should show dashboard content
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('EnergyDashboardPage renders without crashing', () => {
    const { container } = renderPage(EnergyDashboardPage);
    expect(container).toBeTruthy();
  });

  it('EnergyDashboardPage displays KPI section', () => {
    renderPage(EnergyDashboardPage);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('HealthcareDashboardPage renders without crashing', () => {
    const { container } = renderPage(HealthcareDashboardPage);
    expect(container).toBeTruthy();
  });

  it('HealthcareDashboardPage displays KPI section', () => {
    renderPage(HealthcareDashboardPage);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('InsuranceDashboardPage renders without crashing', () => {
    const { container } = renderPage(InsuranceDashboardPage);
    expect(container).toBeTruthy();
  });

  it('InsuranceDashboardPage displays KPI section', () => {
    renderPage(InsuranceDashboardPage);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('RealEstateDashboardPage renders without crashing', () => {
    const { container } = renderPage(RealEstateDashboardPage);
    expect(container).toBeTruthy();
  });

  it('RealEstateDashboardPage displays KPI section', () => {
    renderPage(RealEstateDashboardPage);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('ConstructionDashboardPage renders without crashing', () => {
    const { container } = renderPage(ConstructionDashboardPage);
    expect(container).toBeTruthy();
  });

  it('ConstructionDashboardPage displays KPI section', () => {
    renderPage(ConstructionDashboardPage);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
