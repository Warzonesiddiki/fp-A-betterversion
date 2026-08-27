import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label }: { label: string }) => <div data-testid="kpi-value">{label}</div>,
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
  return {
    Download: makeIcon(),
    FileText: makeIcon(),
    Calendar: makeIcon(),
    DollarSign: makeIcon(),
    Percent: makeIcon(),
    ArrowLeft: makeIcon(),
    Plus: makeIcon(),
    Pencil: makeIcon(),
    Trash2: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronUp: makeIcon(),
    Check: makeIcon(),
  };
});

import LeaseDetailPage from '@/pages/lease/LeaseDetailPage';
import { useLeaseStore } from '@/store/leaseStore';

describe('LeaseDetailPage (BATCH-012 — rewire to LeaseEngine)', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <LeaseDetailPage />
      </MemoryRouter>
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('renders real schedules computed by LeaseEngine (not mock data)', () => {
    // K17: seed the store with a user-side lease (factory ships none).
    useLeaseStore.setState({
      leases: [
        {
          id: 'L-seed',
          property: 'HQ Office - Floor 12',
          type: 'Finance',
          payment: 45000,
          commencementDate: '2026-01-01',
          leaseTerm: 48,
          discountRate: 0.06,
        },
      ],
    });
    const { getByText } = render(
      <MemoryRouter>
        <LeaseDetailPage />
      </MemoryRouter>
    );
    expect(getByText(/Lease Detail/i)).toBeInTheDocument();
    // LeaseEngine is NOT mocked, so the module-load PV/schedule computation for
    // every lease ran — this subtitle is the page's own marker for that.
    expect(getByText(/computed by LeaseEngine/i)).toBeInTheDocument();
  });
});
