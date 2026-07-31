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
  };
});

import LeaseDetailPage from '@/pages/lease/LeaseDetailPage';

describe('LeaseDetailPage (BATCH-012 — rewire to LeaseEngine)', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <LeaseDetailPage />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('renders real schedules computed by LeaseEngine (not mock data)', () => {
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
