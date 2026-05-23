/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApprovalDashboard } from './ApprovalDashboard';
import type { WorkflowStats } from '@/engines/WorkflowEngine';

const makeStats = (overrides: Partial<WorkflowStats> = {}): WorkflowStats => ({
  pending: 5,
  approved: 12,
  rejected: 2,
  locked: 1,
  avgApprovalTimeHours: 3.5,
  bottlenecks: {},
  slaBreaches: [],
  ...overrides,
});

describe('ApprovalDashboard', () => {
  it('renders without crashing', () => {
    render(<ApprovalDashboard stats={makeStats()} />);
    expect(screen.getByText('Approval Dashboard')).toBeInTheDocument();
  });

  it('renders pending count', () => {
    render(<ApprovalDashboard stats={makeStats({ pending: 7 })} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders approved count', () => {
    render(<ApprovalDashboard stats={makeStats({ approved: 15 })} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders rejected count', () => {
    render(<ApprovalDashboard stats={makeStats({ rejected: 3 })} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('renders locked count', () => {
    render(<ApprovalDashboard stats={makeStats({ locked: 9, rejected: 0 })} />);
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('renders average approval time in hours', () => {
    render(<ApprovalDashboard stats={makeStats({ avgApprovalTimeHours: 3.5, approved: 10 })} />);
    expect(screen.getByText('3.5h')).toBeInTheDocument();
  });

  it('renders average approval time in minutes when under 1 hour', () => {
    render(<ApprovalDashboard stats={makeStats({ avgApprovalTimeHours: 0.5, approved: 5 })} />);
    expect(screen.getByText('30m')).toBeInTheDocument();
  });

  it('renders N/A when no approval time', () => {
    render(<ApprovalDashboard stats={makeStats({ avgApprovalTimeHours: 0, approved: 0 })} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders Average Approval Time section', () => {
    render(<ApprovalDashboard stats={makeStats()} />);
    expect(screen.getByText('Average Approval Time')).toBeInTheDocument();
  });

  it('renders bottlenecks section', () => {
    render(<ApprovalDashboard stats={makeStats()} />);
    expect(screen.getByText('Bottlenecks')).toBeInTheDocument();
  });

  it('renders no bottlenecks message when empty', () => {
    render(<ApprovalDashboard stats={makeStats({ bottlenecks: {} })} />);
    expect(screen.getByText('No pending requests')).toBeInTheDocument();
  });

  it('renders bottleneck entries', () => {
    render(
      <ApprovalDashboard stats={makeStats({ bottlenecks: { 'John Doe': 3, 'Jane Smith': 1 } })} />
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders SLA Breaches section', () => {
    render(<ApprovalDashboard stats={makeStats()} />);
    expect(screen.getByText('SLA Breaches')).toBeInTheDocument();
  });

  it('renders no SLA breaches message when empty', () => {
    render(<ApprovalDashboard stats={makeStats({ slaBreaches: [] })} />);
    expect(screen.getByText('No SLA breaches')).toBeInTheDocument();
  });

  it('renders SLA breach entries', () => {
    const breaches = [
      {
        id: 'req-1',
        workflowId: 'wf-1',
        title: 'Budget Approval Q1',
        description: 'desc',
        requester: 'Alice',
        status: 'pending' as const,
        currentStepIndex: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        history: [],
        data: {},
      },
    ];
    render(<ApprovalDashboard stats={makeStats({ slaBreaches: breaches })} />);
    expect(screen.getByText('Budget Approval Q1')).toBeInTheDocument();
    expect(screen.getByText('by Alice')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders SLA breach badge count', () => {
    const breaches = [
      {
        id: 'req-1',
        workflowId: 'wf-1',
        title: 'Overdue Task',
        description: 'desc',
        requester: 'Bob',
        status: 'pending' as const,
        currentStepIndex: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        history: [],
        data: {},
      },
    ];
    render(<ApprovalDashboard stats={makeStats({ slaBreaches: breaches })} />);
    // The badge is a red circle span inside the SLA Breaches heading
    const badge = screen.getByText('SLA Breaches').querySelector('span');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('1');
  });

  it('applies custom className', () => {
    const { container } = render(<ApprovalDashboard stats={makeStats()} className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });
});
