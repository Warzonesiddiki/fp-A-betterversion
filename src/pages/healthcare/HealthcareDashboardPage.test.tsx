// =============================================================================
// HealthcareDashboardPage tests — K18/K30 truthfulness
// -----------------------------------------------------------------------------
// Real store idiom: `useGLStore` is seeded via setState (no store-module
// mock); figures must come out of the HealthcareEngine pipeline. The page's
// removed fabrications — the hand-typed patientVolumeData fixture, the
// revenue÷$5,000 "Estimated Admissions" KPI, the mislabelled "Avg. Length
// of Stay", invented deltas with narrative causes and appended-live-value
// sparkline histories — must stay gone; regression guards below pin those
// labels and fixture literals out of the DOM.
//
// Loading skeleton honesty: every engine read here is synchronous, so there
// is deliberately no hydrate skeleton (same honesty test as
// ScenarioBuilderPage).
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import HealthcareDashboardPage from './HealthcareDashboardPage';
import { useGLStore } from '@/store/glStore';
import { type GLEntry } from '@/types';

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: any) => (
    <div data-testid="data-table">
      {data?.map((row: any, i: number) => (
        <div key={i} data-testid={`table-row-${i}`}>
          {JSON.stringify(row)}
        </div>
      ))}
    </div>
  ),
}));

const mockEntries: GLEntry[] = [
  // Gross Charges for Cardiology (ends in '01')
  {
    id: '1',
    date: '2023-01-15',
    accountCode: '4001',
    amount: 50000,
    description: 'Rev',
    currency: 'USD',
  },
  // Gross Charges for Neurology (ends in '02')
  {
    id: '4',
    date: '2023-01-15',
    accountCode: '4002',
    amount: 30000,
    description: 'Rev',
    currency: 'USD',
  },
  // Contractuals
  {
    id: '2',
    date: '2023-01-15',
    accountCode: '4100',
    amount: -10000,
    description: 'Cont',
    currency: 'USD',
  },
  // Bad Debt
  {
    id: '3',
    date: '2023-01-15',
    accountCode: '4200',
    amount: 5000,
    description: 'Debt',
    currency: 'USD',
  },
];

describe('HealthcareDashboardPage (Data-Driven)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
  });

  it('renders KPI values computed from GL entries', () => {
    render(<HealthcareDashboardPage />);

    // Gross Charges = $80,000; Net Patient Revenue = 80k − 10k(contractuals)
    // = $70,000. Rendered through the real pipeline: HealthcareEngine ->
    // useCurrencyFormatter.custom({ maxDecimals: 1, compact: true }) ->
    // Intl.NumberFormat(notation: 'compact'), whose en-US output drops the
    // trailing ".0" ($70K, not the legacy '$70.0K'). Pinned on the named KPI
    // region so only that card can satisfy it.
    expect(screen.getByRole('region', { name: 'Net Patient Revenue' })).toHaveTextContent(
      /\$70(?:\.0)?K/
    );
    expect(screen.getByRole('region', { name: 'Gross Charges' })).toHaveTextContent('$80,000');
  });

  it('renders data table rows with department performance', () => {
    render(<HealthcareDashboardPage />);

    // Cardiology revenue = $50,000 (derived from the real GL).
    expect(screen.getByText(/Cardiology/)).toBeInTheDocument();
    expect(screen.getByText(/50000/)).toBeInTheDocument();

    // Check if Neurology is rendered
    expect(screen.getByTestId('data-table')).toHaveTextContent(/Neurology/);
  });

  it('does not fabricate margin or efficiency from department name', () => {
    // Session 028: pre-existing test gap. The page used to compute
    // margin = 15 + ((d.name.charCodeAt(0) * 3) % 15) and
    // efficiency = 85 + ((d.name.charCodeAt(0) * 2) % 12) — a function of
    // the first character of the department name. That is a Severity-0
    // fabrication: it renders a different number for every department and
    // is not backed by a general ledger. The page must now render those
    // columns as '—' (not derivable from a GL).
    render(<HealthcareDashboardPage />);
    const table = screen.getByTestId('data-table');
    // Cardiology's first char 'C' (charCode 67). Pre-fix margin would be
    // 15 + (67*3 % 15) = 15 + 6 = 21; pre-fix efficiency would be
    // 85 + (67*2 % 12) = 85 + 2 = 87. Neither literal may appear.
    expect(table.textContent).not.toMatch(/\b21\.0\s*%/);
    expect(table.textContent).not.toMatch(/\b87\s*%/);
    // Same check for Neurology ('N' = 78).
    expect(table.textContent).not.toMatch(/\b15\.4\s*%/);
    expect(table.textContent).not.toMatch(/\b89\s*%/);
    // The suffix→department convention is disclosed on the card itself.
    expect(
      screen.getByText(/posted 40xx accounts whose code ends in the department/i)
    ).toBeInTheDocument();
  });

  it('does not fabricate patient volumes, LOS, admissions estimates or deltas', () => {
    render(<HealthcareDashboardPage />);

    // Removed chart + its hand-typed six-month fixture.
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    expect(screen.queryByText(/patient volume trend/i)).not.toBeInTheDocument();
    expect(screen.queryByText('850')).not.toBeInTheDocument();
    expect(screen.queryByText('2,100')).not.toBeInTheDocument();

    // Removed KPIs: the ÷$5,000 admissions estimate and the days-in-A/R
    // masquerading as length of stay.
    expect(screen.queryByRole('region', { name: /estimated admissions/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /avg\.? length of stay/i })
    ).not.toBeInTheDocument();

    // Removed invented deltas with narrative causes.
    expect(screen.queryByText(/inpatient up 5%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/efficiency improved/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reimbursements up/i)).not.toBeInTheDocument();

    // The honest replacement keeps its divisor basis disclosed.
    expect(screen.getByRole('region', { name: 'Days in A/R' })).toHaveTextContent(/day basis/i);
  });

  it('discloses clinical-fact gaps instead of estimating them', () => {
    render(<HealthcareDashboardPage />);
    expect(screen.getByText(/admission-discharge-transfer \(ADT\) systems/i)).toBeInTheDocument();
    expect(screen.getByText(/bed-management feed/i)).toBeInTheDocument();
    expect(screen.getByText(/workforce roster/i)).toBeInTheDocument();
  });

  it('K30: GL-empty branch keeps the page h1 mounted and offers the real import CTA', () => {
    useGLStore.setState({ entries: [] });
    render(<HealthcareDashboardPage />);

    // h1 discipline: PageHeader stays mounted in the empty branch.
    expect(
      screen.getByRole('heading', { name: /healthcare dashboard/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/no healthcare data/i)).toBeInTheDocument();

    // The CTA drives the real import flow instead of being decorative.
    const importBtn = screen.getByTestId('healthcare-empty-import');
    expect(importBtn).toBeEnabled();
    expect(() => fireEvent.click(importBtn)).not.toThrow();
    expect(screen.getByText(/no healthcare data/i)).toBeInTheDocument();
  });
});
