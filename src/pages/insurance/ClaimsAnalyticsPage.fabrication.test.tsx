/**
 * Session 028 — fabrication regression lock for ClaimsAnalyticsPage.
 *
 * The pre-session-028 page rendered six months of fictional frequency and
 * severity, five hand-typed claim types and five named claimants with
 * hand-typed incurred / paid amounts. This test pins the post-session-028
 * contract: no hand-typed KPI literals, no fake claimants, disclosure of
 * what is missing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ClaimsAnalyticsPage from './ClaimsAnalyticsPage';
import { useGLStore } from '@/store/glStore';

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data.length === 0 ? 'empty' : JSON.stringify(data)}</div>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  PieChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [] });
});

describe('ClaimsAnalyticsPage (fabrication regression lock)', () => {
  it('does not render hand-typed $15,200 / $114.8M / 1,380 KPI literals', () => {
    render(
      <MemoryRouter>
        <ClaimsAnalyticsPage />
      </MemoryRouter>
    );
    expect(screen.queryByText(/\$15,200/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$114\.8M/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1,380/)).not.toBeInTheDocument();
  });

  it('does not render fake claimants (Acme Corp, Jane Doe, City Transit Auth)', () => {
    render(
      <MemoryRouter>
        <ClaimsAnalyticsPage />
      </MemoryRouter>
    );
    expect(screen.queryByText(/Acme Corp/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Jane Doe/)).not.toBeInTheDocument();
    expect(screen.queryByText(/City Transit Auth/)).not.toBeInTheDocument();
  });

  it('discloses that per-claim records require a claim-management system', () => {
    render(
      <MemoryRouter>
        <ClaimsAnalyticsPage />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/claim-management/i).length).toBeGreaterThan(0);
  });
});
