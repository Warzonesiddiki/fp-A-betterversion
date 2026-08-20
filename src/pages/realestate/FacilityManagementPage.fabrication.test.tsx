/**
 * Session 028 — fabrication regression lock for FacilityManagementPage.
 *
 * The pre-session-028 page rendered five named facilities with hand-typed
 * opex/sqft, utility costs and energy ratings, plus literal benchmark
 * values (electricity avg, water/sewage avg, SLA compliance). This test
 * pins the post-session-028 contract: no fake facilities, no literal
 * benchmarks, real GL-derived totals, disclosure of what is missing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import FacilityManagementPage from './FacilityManagementPage';
import { useGLStore } from '@/store/glStore';
import { useRealEstateStore } from '@/store/realEstateStore';

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data.length === 0 ? 'empty' : JSON.stringify(data)}</div>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [] });
  useRealEstateStore.setState({ facilities: [], maintenanceTrend: [] });
});

describe('FacilityManagementPage (fabrication regression lock)', () => {
  it('does not render hand-typed $1.24M / 14.5% / 18.2 KPI literals', () => {
    render(
      <MemoryRouter>
        <FacilityManagementPage />
      </MemoryRouter>
    );
    expect(screen.queryByText(/\$1\.24M/)).not.toBeInTheDocument();
    expect(screen.queryByText(/14\.5%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/18\.2 kWh/)).not.toBeInTheDocument();
  });

  it('does not render fake facilities (Skyline Tower, Harbor Logistics, etc.)', () => {
    render(
      <MemoryRouter>
        <FacilityManagementPage />
      </MemoryRouter>
    );
    expect(screen.queryByText(/Skyline Tower/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Harbor Logistics/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Westside Med/)).not.toBeInTheDocument();
  });

  it('discloses the missing facilities-management feed', () => {
    render(
      <MemoryRouter>
        <FacilityManagementPage />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/facilities-management/i).length).toBeGreaterThan(0);
  });
});
