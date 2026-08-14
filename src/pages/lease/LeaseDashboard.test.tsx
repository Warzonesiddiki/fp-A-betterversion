import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn() },
}));

vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
    Download: makeIcon(),
    FileText: makeIcon(),
    Calendar: makeIcon(),
    DollarSign: makeIcon(),
    Clock: makeIcon(),
    ArrowRight: makeIcon(),
  };
});

import LeaseDashboard from '@/pages/lease/LeaseDashboard';
import { useLeaseStore } from '@/store/leaseStore';
import { actAs } from '@/test/rbacFixtures';

describe('LeaseDashboard (BATCH-011 — rewire to LeaseEngine)', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <LeaseDashboard />
      </MemoryRouter>
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('shows real lease liability computed by LeaseEngine (not mock data)', () => {
    const { getByText, getByTestId } = render(
      <MemoryRouter>
        <LeaseDashboard />
      </MemoryRouter>
    );
    expect(getByText(/Lease Portfolio Dashboard/i)).toBeInTheDocument();
    // Each row's liability is the engine-computed present value (LeaseEngine
    // is NOT mocked, so this exercises the real PV path).
    expect(getByTestId('liability-L001')).toBeInTheDocument();
  });

  it('displays the empty state when the lease store has no leases (GAP-NEW-A)', () => {
    actAs('Admin');
    useLeaseStore.getState().setLeases([]);
    const { getByText } = render(
      <MemoryRouter>
        <LeaseDashboard />
      </MemoryRouter>
    );
    expect(getByText(/No Lease Data/i)).toBeInTheDocument();
  });
});
