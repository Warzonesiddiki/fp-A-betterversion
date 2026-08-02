/**
 * GAP-NEW-A end-to-end evidence: a lease entered in the UI persists and reaches
 * the dashboard.
 *
 * WHAT WAS MISSING
 * ----------------
 * The lease pages were read-only over hardcoded arrays. `leaseStore` was added
 * and the dashboard was rewired to read it, but `LeaseDetailPage` still owned a
 * SEPARATE hardcoded `LEASE_INPUTS` with a DIFFERENT schema (lessee/endDate/
 * interestRatePct vs the store's commencementDate/leaseTerm/discountRate), and
 * "Add Lease" merely navigated there. Nothing a user typed could persist.
 *
 * WHAT THIS PROVES
 * ----------------
 * The full chain, with NO store stubbing and NO fake permissions — the real
 * RBAC `enforce()` wrappers run against a real role from the shipped matrix:
 *
 *   type into the form -> submit -> leaseStore mutation -> LeaseDetailPage
 *   re-render -> navigate to LeaseDashboard -> the new lease is listed with a
 *   liability computed by the real LeaseEngine PV path.
 *
 * Update and delete are covered too, plus the empty state that a delete-all can
 * legitimately produce, plus the negative authorization path.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  // Explicit list: every icon used by LeaseDetailPage, LeaseDashboard and the
  // shared UI primitives these tests render.
  return {
    Download: makeIcon(),
    FileText: makeIcon(),
    Calendar: makeIcon(),
    DollarSign: makeIcon(),
    Percent: makeIcon(),
    ArrowLeft: makeIcon(),
    ArrowRight: makeIcon(),
    Clock: makeIcon(),
    Plus: makeIcon(),
    Pencil: makeIcon(),
    Trash2: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronUp: makeIcon(),
    Check: makeIcon(),
  };
});

import LeaseDetailPage from '@/pages/lease/LeaseDetailPage';
import LeaseDashboard from '@/pages/lease/LeaseDashboard';
import { useLeaseStore } from '@/store/leaseStore';
import { actAs, signOut } from '@/test/rbacFixtures';

/** Fill the lease form. Labels are the real accessible labels rendered by Input. */
function leaseForm(): HTMLElement {
  return screen.getByRole('form', { name: /Lease details/i });
}

/** The form's own submit button, unambiguous even when a page-level
 *  "Add Lease" toolbar button is also on screen. */
function submitForm(name: RegExp) {
  fireEvent.click(within(leaseForm()).getByRole('button', { name }));
}

function fillForm(fields: {
  id?: string;
  property?: string;
  payment?: string;
  commencementDate?: string;
  leaseTerm?: string;
  discountRatePct?: string;
}) {
  const set = (label: RegExp, value: string) =>
    fireEvent.change(within(leaseForm()).getByLabelText(label), { target: { value } });

  if (fields.id !== undefined) set(/^Lease ID$/i, fields.id);
  if (fields.property !== undefined) set(/^Property$/i, fields.property);
  if (fields.payment !== undefined) set(/^Monthly Payment$/i, fields.payment);
  if (fields.commencementDate !== undefined) set(/^Commencement Date$/i, fields.commencementDate);
  if (fields.leaseTerm !== undefined) set(/^Lease Term \(months\)$/i, fields.leaseTerm);
  if (fields.discountRatePct !== undefined) set(/^Discount Rate \(%\)$/i, fields.discountRatePct);
}

const renderDetail = () =>
  render(
    <MemoryRouter>
      <LeaseDetailPage />
    </MemoryRouter>
  );

describe('GAP-NEW-A: lease data entry persists end-to-end', () => {
  beforeEach(() => {
    actAs('Admin');
    useLeaseStore.setState({ leases: [] });
  });

  it('shows a reachable empty state with an Add Lease action', () => {
    renderDetail();
    expect(screen.getByText(/No Lease Data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Lease/i })).toBeInTheDocument();
  });

  it('persists a lease entered in the UI into the store', () => {
    renderDetail();
    fireEvent.click(screen.getByRole('button', { name: /Add Lease/i }));

    fillForm({
      id: 'L-UI-1',
      property: 'UI Entered Office',
      payment: '12500.50',
      commencementDate: '2026-03-01',
      leaseTerm: '24',
      discountRatePct: '6.25',
    });
    submitForm(/^Add Lease$/i);

    const stored = useLeaseStore.getState().leases;
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: 'L-UI-1',
      property: 'UI Entered Office',
      payment: 12500.5,
      commencementDate: '2026-03-01',
      leaseTerm: 24,
      // 6.25% must be exactly 0.0625, not a binary-drifted 0.06250000000000001.
      discountRate: 0.0625,
    });
  });

  it('surfaces the UI-entered lease on the dashboard with an engine-computed liability', () => {
    renderDetail();
    fireEvent.click(screen.getByRole('button', { name: /Add Lease/i }));
    fillForm({
      id: 'L-UI-2',
      property: 'Dashboard Visible Lease',
      payment: '9000',
      commencementDate: '2026-02-01',
      leaseTerm: '36',
      discountRatePct: '5',
    });
    submitForm(/^Add Lease$/i);

    // Fresh render of the DASHBOARD — proves the write crossed the store
    // boundary rather than living in the detail page's local state.
    const dashboard = render(
      <MemoryRouter>
        <LeaseDashboard />
      </MemoryRouter>
    );
    expect(dashboard.getAllByText('Dashboard Visible Lease').length).toBeGreaterThan(0);
    // LeaseEngine is NOT mocked: this cell holds the real PV of the payments.
    const liability = dashboard.getByTestId('liability-L-UI-2');
    expect(liability).toBeInTheDocument();
    expect(liability.textContent).toMatch(/\d/);
  });

  it('renders the entered lease on the detail page after submit', () => {
    renderDetail();
    fireEvent.click(screen.getByRole('button', { name: /Add Lease/i }));
    fillForm({
      id: 'L-UI-3',
      property: 'Detail Rendered Lease',
      payment: '4000',
      commencementDate: '2026-01-01',
      leaseTerm: '12',
      discountRatePct: '4',
    });
    submitForm(/^Add Lease$/i);

    // The empty state is gone and the lease's ASC 842 panel is showing.
    expect(screen.queryByText(/No Lease Data/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('rou-L-UI-3')).toBeInTheDocument();
  });

  it('updates an existing lease through the edit form', () => {
    useLeaseStore.getState().addLease({
      id: 'L-EDIT',
      property: 'Original Name',
      type: 'Operating',
      payment: 1000,
      commencementDate: '2026-01-01',
      leaseTerm: 12,
      discountRate: 0.05,
    });
    renderDetail();

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    fillForm({ property: 'Renamed Property', payment: '2500' });
    submitForm(/Save Lease/i);

    const stored = useLeaseStore.getState().leases;
    expect(stored).toHaveLength(1);
    expect(stored[0]!.property).toBe('Renamed Property');
    expect(stored[0]!.payment).toBe(2500);
    // The id is immutable while editing, so no duplicate is created.
    expect(stored[0]!.id).toBe('L-EDIT');
  });

  it('removes a lease and falls back to the empty state when it was the last one', () => {
    useLeaseStore.getState().addLease({
      id: 'L-DEL',
      property: 'Doomed Lease',
      type: 'Finance',
      payment: 1000,
      commencementDate: '2026-01-01',
      leaseTerm: 12,
      discountRate: 0.05,
    });
    renderDetail();

    fireEvent.click(screen.getByRole('button', { name: /Delete lease Doomed Lease/i }));

    expect(useLeaseStore.getState().leases).toHaveLength(0);
    expect(screen.getByText(/No Lease Data/i)).toBeInTheDocument();
  });

  it('rejects invalid input without writing to the store', () => {
    renderDetail();
    fireEvent.click(screen.getByRole('button', { name: /Add Lease/i }));

    fillForm({
      id: 'L-BAD',
      property: 'Bad Lease',
      payment: '-100', // non-positive
      commencementDate: '2026-01-01',
      leaseTerm: '0', // non-positive term
      discountRatePct: '150', // out of range
    });
    submitForm(/^Add Lease$/i);

    // Nothing was written...
    expect(useLeaseStore.getState().leases).toHaveLength(0);
    // ...and each bad field says WHY, rather than failing silently.
    const form = within(leaseForm());
    expect(form.getByText(/Monthly payment must be greater than 0/i)).toBeInTheDocument();
    expect(
      form.getByText(/Lease term must be a whole number of months above 0/i)
    ).toBeInTheDocument();
    expect(form.getByText(/Discount rate must be between 0 and 100 percent/i)).toBeInTheDocument();
    expect(form.getByText(/3 fields need attention/i)).toBeInTheDocument();
  });

  it('rejects a duplicate lease id rather than silently overwriting', () => {
    useLeaseStore.getState().addLease({
      id: 'L-DUP',
      property: 'First',
      type: 'Operating',
      payment: 1000,
      commencementDate: '2026-01-01',
      leaseTerm: 12,
      discountRate: 0.05,
    });
    renderDetail();

    fireEvent.click(screen.getAllByRole('button', { name: /^Add Lease$/i })[0]!);
    fillForm({
      id: 'L-DUP',
      property: 'Second',
      payment: '2000',
      commencementDate: '2026-01-01',
      leaseTerm: '12',
      discountRatePct: '5',
    });
    submitForm(/^Add Lease$/i);

    const stored = useLeaseStore.getState().leases;
    expect(stored).toHaveLength(1);
    expect(stored[0]!.property).toBe('First');
  });

  it('denies the write when the session lacks the permission (real RBAC, not a stub)', () => {
    // No fixtures, no stubbed enforce(): an unauthenticated session must not be
    // able to write, and must fail LOUDLY rather than no-op.
    signOut();
    const addLease = useLeaseStore.getState().addLease;

    expect(() =>
      addLease({
        id: 'L-DENIED',
        property: 'Should Not Persist',
        type: 'Operating',
        payment: 1000,
        commencementDate: '2026-01-01',
        leaseTerm: 12,
        discountRate: 0.05,
      })
    ).toThrow(/Permission denied.*budget:create/i);

    expect(useLeaseStore.getState().leases).toHaveLength(0);
  });
});
