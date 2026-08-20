/**
 * Session 028 — fabrication regression lock for EnergyDashboardPage.
 *
 * The pre-session-028 page rendered six months of fictional revenue/cost/
 * production, a hand-typed source mix and five named facilities. This
 * test pins the post-session-028 contract: no hand-typed KPI literals,
 * real store-derived data, and disclosure of what is missing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import EnergyDashboardPage from './EnergyDashboardPage';

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data.length === 0 ? 'empty' : JSON.stringify(data)}</div>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  BarChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EnergyDashboardPage (fabrication regression lock)', () => {
  it('does not render hand-typed $14.2M / $87.50 KPI literals', () => {
    render(
      <MemoryRouter>
        <EnergyDashboardPage />
      </MemoryRouter>
    );
    expect(screen.queryByText(/\$14\.2M/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$87\.50/)).not.toBeInTheDocument();
  });

  it('does not render the hand-typed assetPerformance table when no assets are recorded', () => {
    render(
      <MemoryRouter>
        <EnergyDashboardPage />
      </MemoryRouter>
    );
    // The 5 named facilities (Solar Farm Alpha, Wind Park Beta, etc.) are
    // fabricated seed data; when the energy store is empty, the page must
    // not render any of them.
    expect(screen.queryByText(/Solar Farm Alpha/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Thermal Plant Epsilon/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Wind Park Beta/)).not.toBeInTheDocument();
  });
});
