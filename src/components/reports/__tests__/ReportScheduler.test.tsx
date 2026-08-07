import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ReportScheduler } from '../ReportScheduler';

vi.mock('@/components/ui/Card', () => ({ Card: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children, isOpen }: any) => (isOpen ? <div data-testid="modal">{children}</div> : null),
}));
vi.mock('@/components/ui/Select', () => ({ Select: ({ label }: any) => <div>{label}</div> }));
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

describe('ReportScheduler', () => {
  beforeEach(() => vi.clearAllMocks());

  const schedule = {
    id: 's1',
    reportId: 'r1',
    reportName: 'P&L',
    frequency: 'monthly' as const,
    format: 'pdf' as const,
    recipients: [],
    isActive: true,
    nextRun: '2025-02-01',
  };

  it('shows empty state', () => {
    render(
      <ReportScheduler
        schedules={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={[]}
      />
    );
    expect(screen.getByText(/No schedules yet/)).toBeTruthy();
  });

  it('renders existing schedules', () => {
    render(
      <ReportScheduler
        schedules={[schedule]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={[]}
      />
    );
    expect(screen.getByText('P&L')).toBeTruthy();
    expect(screen.getByText(/monthly/)).toBeTruthy();
  });
});
