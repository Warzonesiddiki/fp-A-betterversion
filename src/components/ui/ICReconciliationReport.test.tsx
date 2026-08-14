import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('./Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('./Button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('./Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { ICReconciliationReport } from '@/components/ui/ICReconciliationReport';

const mockReport = {
  period: 'Q1 2026',
  generatedAt: '2026-03-31T00:00:00Z',
  totalDifferences: 50500,
  withinToleranceCount: 1,
  outsideToleranceCount: 1,
  entityPairs: [
    {
      entityA: 'Entity A',
      entityB: 'Entity B',
      accountCode: '1000',
      accountName: 'Cash',
      balanceA: 100000,
      balanceB: 99500,
      difference: 500,
      percentageDifference: 0.5,
      withinTolerance: true,
      matchStatus: 'matched' as const,
    },
    {
      entityA: 'Entity A',
      entityB: 'Entity C',
      accountCode: '2000',
      accountName: 'Revenue',
      balanceA: 500000,
      balanceB: 450000,
      difference: 50000,
      percentageDifference: 10,
      withinTolerance: false,
      matchStatus: 'unmatched' as const,
    },
  ],
};

describe('ICReconciliationReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ICReconciliationReport report={mockReport} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays report title', () => {
    render(<ICReconciliationReport report={mockReport} />);
    expect(screen.getByText('IC Reconciliation Report')).toBeInTheDocument();
  });

  it('displays period info', () => {
    render(<ICReconciliationReport report={mockReport} />);
    expect(screen.getByText(/Q1 2026/)).toBeInTheDocument();
  });

  it('displays metric cards', () => {
    render(<ICReconciliationReport report={mockReport} />);
    expect(screen.getByText('Total Pairs')).toBeInTheDocument();
    expect(screen.getByText('Within Tolerance')).toBeInTheDocument();
    expect(screen.getByText('Outside Tolerance')).toBeInTheDocument();
  });

  it('displays filter buttons', () => {
    render(<ICReconciliationReport report={mockReport} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Matched')).toBeInTheDocument();
    expect(screen.getByText('Unmatched')).toBeInTheDocument();
  });
});
