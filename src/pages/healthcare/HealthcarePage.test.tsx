// =============================================================================
// HealthcarePage tests — engine-wired overview
// -----------------------------------------------------------------------------
// Real store idiom: `useGLStore` / `useHealthcareStore` are seeded via setState
// (no store-module mocks). Every asserted figure must come out of the
// HealthcareEngine pipeline:
//   grossCharges = Σ 40xx amounts          contractuals = |Σ 41xx|
//   netRevenue   = charges − contractuals  cash         = Σ 11xx
//   daysInAR     = A/R ÷ (netRevenue ÷ 30)  collectionRate = cash ÷ net × 100
//
// Regression guards: the denial rate stays unavailable (engine returns null),
// and the A/R-days divisor basis is disclosed rather than hidden.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import HealthcarePage from './HealthcarePage';
import { useGLStore } from '@/store/glStore';
import { useHealthcareStore } from '@/store/healthcareStore';
import { ExportEngine } from '@/engines/ExportEngine';
import type { GLEntry } from '@/types';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(undefined),
    exportToExcel: vi.fn().mockResolvedValue(undefined),
    exportToCSV: vi.fn(),
  },
}));

function makeEntry(overrides: Partial<GLEntry> & Pick<GLEntry, 'id' | 'accountCode'>): GLEntry {
  return {
    accountId: overrides.id,
    accountName: overrides.accountCode,
    period: 'P01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-01-15',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

const mockEntries: GLEntry[] = [
  // Gross charges — payor suffix 01 (Medicare)
  makeEntry({
    id: '1',
    accountCode: '4001',
    accountName: 'Patient Charges - Medicare',
    credit: 50000,
    amount: 50000,
    netChange: 50000,
  }),
  // Gross charges — payor suffix 03 (Medicaid)
  makeEntry({
    id: '2',
    accountCode: '4003',
    accountName: 'Patient Charges - Medicaid',
    credit: 30000,
    amount: 30000,
    netChange: 30000,
  }),
  // Contractual adjustments (contra-revenue, posted as negative amount)
  makeEntry({
    id: '3',
    accountCode: '4100',
    accountName: 'Contractual Adjustments',
    debit: 10000,
    amount: -10000,
    netChange: -10000,
  }),
  // Bad debt
  makeEntry({
    id: '4',
    accountCode: '4200',
    accountName: 'Bad Debt',
    debit: 5000,
    amount: 5000,
    netChange: 5000,
  }),
  // Cash collections
  makeEntry({
    id: '5',
    accountCode: '1100',
    accountName: 'Cash - Operating',
    debit: 30000,
    amount: 30000,
    netChange: 30000,
  }),
  // Patient accounts receivable
  makeEntry({
    id: '6',
    accountCode: '1201',
    accountName: 'Accounts Receivable - Patient',
    debit: 12000,
    amount: 12000,
    netChange: 12000,
  }),
];

const mockPrograms = [
  {
    id: 'p1',
    program: 'ACO Reach',
    population: '8,200',
    qualityScore: '0.91',
    sharedSavings: '$410K',
    status: 'High' as const,
  },
  {
    id: 'p2',
    program: 'MSSP Enhanced',
    population: '3,400',
    qualityScore: '0.88',
    sharedSavings: '$190K',
    status: 'Watch' as const,
  },
];

describe('HealthcarePage (engine-wired)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
    useHealthcareStore.setState({ programs: mockPrograms });
  });

  it('renders KPI values computed by HealthcareEngine.calculatePatientRevenue', () => {
    render(<HealthcarePage />);

    // charges=80k; contractuals=|−10k|=10k; net=70k; cash=30k.
    expect(screen.getByRole('region', { name: 'Net Patient Revenue' })).toHaveTextContent(
      '$70,000'
    );
    expect(screen.getByRole('region', { name: 'Gross Charges' })).toHaveTextContent('$80,000');
    expect(screen.getByRole('region', { name: 'Cash Collected' })).toHaveTextContent('$30,000');
    // collectionRate = 30k ÷ 70k × 100 = 42.857…% → 42.9%
    expect(screen.getByRole('region', { name: 'Cash Collected' })).toHaveTextContent(
      /Collection rate 42\.9% of net revenue/
    );
  });

  it('discloses the Days in A/R divisor basis instead of presenting it as a calendar', () => {
    render(<HealthcarePage />);

    const region = screen.getByRole('region', { name: 'Days in A/R' });
    // A/R = 12,000; daily revenue = 70,000 ÷ 30 → 5.14 days on the stated basis
    expect(region).toHaveTextContent('5.14');
    expect(region).toHaveTextContent(/30-day divisor basis/);
    expect(region).toHaveTextContent(/modelling assumption/);
  });

  it('renders the patient revenue cycle stages from engine stats', () => {
    const { container } = render(<HealthcarePage />);
    const cycleCard = container.querySelector('[aria-label="Revenue Cycle"]');
    expect(cycleCard).not.toBeNull();

    const cycle = cycleCard as HTMLElement;
    // Contractuals are |−10,000| = 10,000 after the engine's abs() contra handling.
    expect(cycle.textContent).toContain('$80,000.00'); // gross charges
    expect(cycle.textContent).toContain('$10,000.00'); // contractual adjustments
    expect(cycle.textContent).toContain('$70,000.00'); // net revenue
    expect(cycle.textContent).toContain('$5,000.00'); // bad debt
  });

  it('keeps the claim-denial rate disclosed as unavailable, never defaulted', () => {
    render(<HealthcarePage />);

    expect(screen.getByText(/claim\/remittance \(835\/837\)/i)).toBeInTheDocument();
    // The historical hardcoded fabrication must stay gone.
    expect(screen.queryByText('4.2%')).not.toBeInTheDocument();
  });

  it('renders the payor mix with exact shares of posted gross charges', () => {
    render(<HealthcarePage />);

    expect(screen.getByText('Medicare')).toBeInTheDocument();
    expect(screen.getByText('Medicaid')).toBeInTheDocument();
    expect(screen.queryByText('Commercial')).not.toBeInTheDocument(); // no 40xx suffix-02 postings

    const medicareRow = screen.getByText('Medicare').closest('li');
    expect(medicareRow).toHaveTextContent('$50,000.00');
    expect(medicareRow).toHaveTextContent('62.5%'); // 50k ÷ 80k
    const medicaidRow = screen.getByText('Medicaid').closest('li');
    expect(medicaidRow).toHaveTextContent('37.5%'); // 30k ÷ 80k
  });

  it('shows the recorded care-program count next to entry count', () => {
    render(<HealthcarePage />);
    expect(screen.getByText(/2 care programs/)).toBeInTheDocument();
  });

  it('exports a PDF report built from the engine stats with basis disclosures', async () => {
    const user = userEvent.setup();
    render(<HealthcarePage />);

    await user.click(screen.getByRole('button', { name: /Export PDF/i }));

    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    const args = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]![0];
    expect(args.rows).toEqual(
      expect.arrayContaining([
        ['Gross Charges', '$80,000'],
        ['Net Patient Revenue', '$70,000'],
        ['Collection Rate', '42.9%'],
        ['Days in A/R (30-day basis)', '5.14'],
      ])
    );
  });

  it('exports the payor mix to Excel', async () => {
    const user = userEvent.setup();
    render(<HealthcarePage />);

    await user.click(screen.getByRole('button', { name: /Export Excel/i }));

    expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    const args = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]![0];
    expect(args.headers).toEqual(['Payor', 'Charges']);
    expect(args.rows).toHaveLength(2);
  });

  it('renders a payor-mix honest empty state when no suffix-coded 40xx accounts exist', () => {
    useGLStore.setState({
      entries: [
        makeEntry({ id: '9', accountCode: '1100', accountName: 'Cash', debit: 500, amount: 500 }),
      ],
    });
    render(<HealthcarePage />);
    expect(screen.getByText(/no payor-coded revenue accounts found/i)).toBeInTheDocument();
  });

  it('keeps the empty state with the real import CTA when no GL data exists', () => {
    useGLStore.setState({ entries: [] });
    render(<HealthcarePage />);

    expect(screen.getByRole('heading', { name: 'No Healthcare Data' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Import GL data to view healthcare/i })
    ).toBeEnabled();
  });
});
