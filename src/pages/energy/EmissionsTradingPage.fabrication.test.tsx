/**
 * Session 028 — fabrication regression lock for EmissionsTradingPage.
 *
 * The pre-session-028 page rendered a fictional allowance inventory with
 * hand-typed quantities, prices and gain percentages. This test pins the
 * post-session-028 contract: no hand-typed KPI literals appear, the
 * inventory table is empty when no allowance ledger is recorded, and the
 * page discloses what is missing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import EmissionsTradingPage from './EmissionsTradingPage';
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
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [] });
});

describe('EmissionsTradingPage (fabrication regression lock)', () => {
  it('does not render hand-typed $12.8M / +15.2% KPI literals', () => {
    render(
      <MemoryRouter>
        <EmissionsTradingPage />
      </MemoryRouter>
    );
    expect(screen.queryByText(/\$12\.8M/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+15\.2%/)).not.toBeInTheDocument();
  });

  it('discloses the missing allowance ledger instead of inventing one', () => {
    render(
      <MemoryRouter>
        <EmissionsTradingPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/No carbon allowance positions/i)).toBeInTheDocument();
  });

  it('hides the DataTable and shows the empty-state disclosure when no allowance positions are recorded', () => {
    render(
      <MemoryRouter>
        <EmissionsTradingPage />
      </MemoryRouter>
    );
    // The page intentionally does not render a DataTable when no allowance
    // positions are recorded (no fabricated inventory to display).
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
    // The disclosure is the proof that we did not invent data.
    expect(screen.getByText(/No carbon allowance positions/i)).toBeInTheDocument();
  });
});
