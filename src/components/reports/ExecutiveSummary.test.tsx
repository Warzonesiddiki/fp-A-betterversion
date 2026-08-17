/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useGLStore } from '@/store/glStore';
import { ExecutiveSummary } from './ExecutiveSummary';

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

describe('ExecutiveSummary — no fabricated pack figures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
  });

  it('renders without crashing', () => {
    render(<ExecutiveSummary />);
  });

  it('shows empty KPIs and no invented $4.2M / SaaS commentary when the GL is empty', () => {
    render(<ExecutiveSummary />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Operating income')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/\$4\.2M/);
    expect(body).not.toMatch(/\$1\.1M/);
    expect(body).not.toMatch(/\$850k/);
    expect(body).not.toMatch(/\+12%/);
    expect(body).not.toMatch(/SaaS bookings/);
    expect(body).toMatch(/not derivable/i);
  });

  it('renders posted revenue and operating income from the GL', () => {
    useGLStore.setState({
      entries: [
        {
          id: '1',
          accountId: '4000',
          accountCode: '4000',
          accountName: 'Revenue',
          period: '2026-01',
          periodName: 'Jan',
          debit: 0,
          credit: 1000,
          netChange: 1000,
          date: '2026-01-15',
          amount: 1000,
          description: 'Sale',
          reference: '',
        },
        {
          id: '2',
          accountId: '5000',
          accountCode: '5000',
          accountName: 'COGS',
          period: '2026-01',
          periodName: 'Jan',
          debit: 400,
          credit: 0,
          netChange: 400,
          date: '2026-01-15',
          amount: 400,
          description: 'COGS',
          reference: '',
        },
        {
          id: '3',
          accountId: '1000',
          accountCode: '1000',
          accountName: 'Cash',
          period: '2026-01',
          periodName: 'Jan',
          debit: 600,
          credit: 0,
          netChange: 600,
          date: '2026-01-15',
          amount: 600,
          description: 'Cash',
          reference: '',
        },
      ] as never,
    });
    render(<ExecutiveSummary />);
    const body = document.body.textContent ?? '';
    expect(body).toMatch(/\$1,000/);
    expect(body).toMatch(/\$600/);
    expect(body).not.toMatch(/\$4\.2M/);
    expect(body).not.toMatch(/SaaS bookings/);
  });
});
