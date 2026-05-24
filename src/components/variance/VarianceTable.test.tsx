import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/components/ui/FinancialTable', () => ({
  FinancialTable: ({
    rows,
    columns,
  }: {
    rows: unknown[];
    columns: { key: string; header: string }[];
  }) => (
    <div data-testid="financial-table">
      <div>{rows.length} rows</div>
      {columns.map((col) => (
        <span key={col.key}>{col.header}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

import type { VarianceAnalysis } from '@/types';
import { VarianceTable } from '@/components/variance/VarianceTable';

const mockAnalyses = [
  {
    accountId: 'acc1',
    accountName: 'Revenue',
    budget: 100000,
    actual: 110000,
    variance: 10000,
    variancePercent: 10,
    status: 'Within' as const,
    commentary: 'On track',
  },
  {
    accountId: 'acc2',
    accountName: 'Expenses',
    budget: 50000,
    actual: 60000,
    variance: -10000,
    variancePercent: -20,
    status: 'Over' as const,
    commentary: 'Over budget',
  },
] as unknown as VarianceAnalysis[];

describe('VarianceTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with data', () => {
    const { container } = render(
      <VarianceTable analyses={mockAnalyses} onSelect={() => {}} onCommentaryEdit={() => {}} />
    );
    expect(container).toBeTruthy();
  });

  it('renders FinancialTable with correct columns', () => {
    render(
      <VarianceTable analyses={mockAnalyses} onSelect={() => {}} onCommentaryEdit={() => {}} />
    );
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(screen.getByText('Var $')).toBeInTheDocument();
    expect(screen.getByText('Var %')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Commentary')).toBeInTheDocument();
  });

  it('shows "No variance data" when analyses is empty', () => {
    render(<VarianceTable analyses={[]} onSelect={() => {}} onCommentaryEdit={() => {}} />);
    expect(screen.getByText('No variance data')).toBeInTheDocument();
  });
});
