/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApprovalQueue } from './ApprovalQueue';
import type { ApprovalRequest } from '@/engines/WorkflowEngine';

const makeRequest = (overrides: Partial<ApprovalRequest> = {}): ApprovalRequest => ({
  id: 'req-1',
  workflowId: 'wf-1',
  title: 'Budget Approval',
  description: 'Q1 budget request',
  requester: 'john@example.com',
  state: 'submitted',
  currentStepIndex: 0,
  amount: 50000,
  entity: 'Finance',
  period: 'Q1 2026',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
  history: [
    {
      id: 'evt-1',
      action: 'submit',
      actor: 'john@example.com',
      timestamp: '2026-01-15T10:00:00Z',
    },
  ],
  changeRequests: [],
  ...overrides,
});

const defaultProps = {
  requests: [makeRequest()],
  onApprove: vi.fn(),
  onReject: vi.fn(),
  onBulkApprove: vi.fn(),
  currentUser: 'admin@example.com',
};

describe('ApprovalQueue', () => {
  // Rendering
  it('renders without crashing', () => {
    render(<ApprovalQueue {...defaultProps} />);
    expect(screen.getByText('Approval Queue')).toBeInTheDocument();
  });

  it('renders request title', () => {
    render(<ApprovalQueue {...defaultProps} />);
    expect(screen.getByText('Budget Approval')).toBeInTheDocument();
  });

  it('renders request status badge', () => {
    render(<ApprovalQueue {...defaultProps} />);
    expect(screen.getByText('submitted')).toBeInTheDocument();
  });

  it('renders requester name', () => {
    render(<ApprovalQueue {...defaultProps} />);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('renders amount when present', () => {
    render(<ApprovalQueue {...defaultProps} />);
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(<ApprovalQueue {...defaultProps} />);
    expect(screen.getByText('Q1 budget request')).toBeInTheDocument();
  });

  it('renders empty state when no requests match filters', () => {
    render(<ApprovalQueue {...defaultProps} requests={[]} />);
    expect(screen.getByText('No requests match your filters.')).toBeInTheDocument();
  });

  // Filters
  it('renders status filter dropdown', () => {
    render(<ApprovalQueue {...defaultProps} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders date filter input', () => {
    render(<ApprovalQueue {...defaultProps} />);
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('renders requester filter input', () => {
    render(<ApprovalQueue {...defaultProps} />);
    expect(screen.getByText('Requester')).toBeInTheDocument();
  });

  // Actions
  it('renders approve and reject buttons for pending requests', () => {
    render(<ApprovalQueue {...defaultProps} />);
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', () => {
    const onApprove = vi.fn();
    render(<ApprovalQueue {...defaultProps} onApprove={onApprove} />);
    fireEvent.click(screen.getByText('Approve'));
    expect(onApprove).toHaveBeenCalledWith('req-1', undefined);
  });

  it('calls onReject when reject button is clicked', () => {
    const onReject = vi.fn();
    render(<ApprovalQueue {...defaultProps} onReject={onReject} />);
    fireEvent.click(screen.getByText('Reject'));
    expect(onReject).toHaveBeenCalledWith('req-1', undefined);
  });

  // History
  it('toggles history visibility', () => {
    render(<ApprovalQueue {...defaultProps} />);
    const toggleBtn = screen.getByText(/Show History/);
    fireEvent.click(toggleBtn);
    // History event shows actor and action
    expect(screen.getByText('submit')).toBeInTheDocument();
    expect(screen.getByText(/Hide.*History/)).toBeInTheDocument();
  });

  // Multiple requests
  it('renders multiple requests', () => {
    const requests = [
      makeRequest({ id: 'r1', title: 'Request A' }),
      makeRequest({ id: 'r2', title: 'Request B', state: 'approved' }),
    ];
    render(<ApprovalQueue {...defaultProps} requests={requests} />);
    expect(screen.getByText('Request A')).toBeInTheDocument();
    expect(screen.getByText('Request B')).toBeInTheDocument();
  });

  it('does not render approve/reject for approved requests', () => {
    const requests = [makeRequest({ state: 'approved' })];
    render(<ApprovalQueue {...defaultProps} requests={requests} />);
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });
});
