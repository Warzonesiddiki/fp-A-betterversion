import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { GLEntry } from '@/types';
import { useGLStore } from '@/store/glStore';

// Generic entries — enough for the non-insurance pages to bypass empty-state
// early returns. Typed as GLEntry so the compiler rejects any fixture that
// omits the required `amount` field (the $NaN class of defect — FIX-8).
const genericEntries: GLEntry[] = [
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

// W-FAB-001: the insurance dashboard gates on insurance account prefixes
// (41/42/43/44/51/52/53), so the shared fixture carries insurance-coded rows
// and this page exercises its populated branch. Hand-checked book:
//   written 900,000 · earned 700,000 · loss 315,000 · commission 72,000
//   → loss 45.00% · expense 8.00% · combined 53.00%.
const insuranceEntries: GLEntry[] = [
  {
    id: '5',
    accountId: 'a5',
    accountCode: '4101',
    accountName: 'Written premium',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 900000,
    netChange: -900000,
    amount: -900000,
    date: '2026-01-15',
    description: 'Written premium',
    reference: 'REF-005',
  },
  {
    id: '6',
    accountId: 'a6',
    accountCode: '4201',
    accountName: 'Earned premium',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 700000,
    netChange: -700000,
    amount: -700000,
    date: '2026-01-15',
    description: 'Earned premium',
    reference: 'REF-006',
  },
  {
    id: '7',
    accountId: 'a7',
    accountCode: '5100',
    accountName: 'Loss and LAE',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 315000,
    credit: 0,
    netChange: 315000,
    amount: 315000,
    date: '2026-01-15',
    description: 'Loss and LAE',
    reference: 'REF-007',
  },
  {
    id: '8',
    accountId: 'a8',
    accountCode: '5200',
    accountName: 'Commission expense',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 72000,
    credit: 0,
    netChange: 72000,
    amount: 72000,
    date: '2026-01-15',
    description: 'Commission expense',
    reference: 'REF-008',
  },
];

const mockEntries: GLEntry[] = [...genericEntries, ...insuranceEntries];

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
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('BankingDashboardPage displays KPI section', () => {
    renderPage(BankingDashboardPage);
    // With entries loaded, should show dashboard content
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('EnergyDashboardPage renders without crashing', () => {
    const { container } = renderPage(EnergyDashboardPage);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('EnergyDashboardPage displays KPI section', () => {
    renderPage(EnergyDashboardPage);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('HealthcareDashboardPage renders without crashing', () => {
    const { container } = renderPage(HealthcareDashboardPage);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('HealthcareDashboardPage displays KPI section', () => {
    renderPage(HealthcareDashboardPage);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('InsuranceDashboardPage renders without crashing', () => {
    const { container } = renderPage(InsuranceDashboardPage);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('InsuranceDashboardPage displays KPI section', () => {
    renderPage(InsuranceDashboardPage);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('InsuranceDashboardPage renders engine-derived ratios from coded fixtures', () => {
    renderPage(InsuranceDashboardPage);
    // loss 315,000 / earned 700,000 · expense 72,000 / written 900,000.
    expect(
      within(screen.getByRole('region', { name: 'Loss Ratio' })).getByText('45.00%')
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Combined Ratio' })).getByText('53.00%')
    ).toBeInTheDocument();
  });

  it('InsuranceDashboardPage renders no tile the ledger cannot derive', () => {
    renderPage(InsuranceDashboardPage);
    for (const tile of ['Retention Rate', 'Solvency II Ratio', 'Avg Claim Size', 'Policy Count']) {
      expect(screen.queryByRole('region', { name: tile })).not.toBeInTheDocument();
    }
    expect(screen.getByText(/Not derivable from this ledger/i)).toBeInTheDocument();
  });

  it('InsuranceDashboardPage shows the honest empty state for a non-insurance ledger', () => {
    (useGLStore as unknown as Mock).mockReturnValueOnce({ entries: genericEntries });
    renderPage(InsuranceDashboardPage);
    expect(screen.getByText(/No underwriting activity is posted/i)).toBeInTheDocument();
    expect(screen.getByText(/Expected account prefixes/i)).toBeInTheDocument();
  });

  it('InsuranceDashboardPage renders — not 0% when no premium is posted', () => {
    (useGLStore as unknown as Mock).mockReturnValueOnce({
      entries: [
        {
          id: '9',
          accountId: 'a9',
          accountCode: '5100',
          accountName: 'Loss and LAE',
          period: '2026-01',
          periodName: 'Jan 2026',
          debit: 25000,
          credit: 0,
          netChange: 25000,
          amount: 25000,
          date: '2026-01-15',
          description: 'Loss and LAE',
          reference: 'REF-009',
        },
      ],
    });
    renderPage(InsuranceDashboardPage);
    expect(
      within(screen.getByRole('region', { name: 'Loss Ratio' })).getByText('—')
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Combined Ratio' })).getByText('—')
    ).toBeInTheDocument();
  });

  it('RealEstateDashboardPage renders without crashing', () => {
    const { container } = renderPage(RealEstateDashboardPage);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('RealEstateDashboardPage displays KPI section', () => {
    renderPage(RealEstateDashboardPage);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('ConstructionDashboardPage renders without crashing', () => {
    const { container } = renderPage(ConstructionDashboardPage);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('ConstructionDashboardPage displays KPI section', () => {
    renderPage(ConstructionDashboardPage);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
