/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AllocationHistory } from './AllocationHistory';
import type { AllocationHistoryEntry } from './AllocationHistory';

const makeEntry = (overrides: Partial<AllocationHistoryEntry> = {}): AllocationHistoryEntry => ({
  id: 'entry-1',
  ruleName: 'Allocate IT Costs',
  method: 'direct',
  sourceAccount: 'IT Department',
  result: {
    ruleId: 'rule-1',
    allocations: [
      { target: 'Sales', amount: 5000, percentage: 50 },
      { target: 'Marketing', amount: 5000, percentage: 50 },
    ],
    totalAllocated: 10000,
    timestamp: '2026-01-15T10:00:00Z',
    auditComment: 'Monthly IT cost allocation',
  },
  executedAt: '2026-01-15T10:00:00Z',
  executedBy: 'admin@example.com',
  status: 'applied',
  ...overrides,
});

const entries: AllocationHistoryEntry[] = [
  makeEntry({ id: 'e1', ruleName: 'IT Costs', sourceAccount: 'IT Dept', status: 'applied' }),
  makeEntry({
    id: 'e2',
    ruleName: 'HR Costs',
    sourceAccount: 'HR Dept',
    status: 'pending',
    method: 'driver',
  }),
  makeEntry({
    id: 'e3',
    ruleName: 'Facility Costs',
    sourceAccount: 'Facilities',
    status: 'rejected',
    method: 'step-down',
  }),
];

describe('AllocationHistory', () => {
  it('renders empty state when no entries', () => {
    render(<AllocationHistory entries={[]} />);
    expect(screen.getByText('No allocations executed yet.')).toBeInTheDocument();
  });

  it('renders header with title', () => {
    render(<AllocationHistory entries={entries} />);
    expect(screen.getByText('Allocation History')).toBeInTheDocument();
  });

  it('renders entry rule names', () => {
    render(<AllocationHistory entries={entries} />);
    expect(screen.getByText('IT Costs')).toBeInTheDocument();
    expect(screen.getByText('HR Costs')).toBeInTheDocument();
    expect(screen.getByText('Facility Costs')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<AllocationHistory entries={entries} />);
    expect(screen.getByText('applied')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('rejected')).toBeInTheDocument();
  });

  it('renders summary stats', () => {
    render(<AllocationHistory entries={entries} />);
    expect(screen.getByText('3 total')).toBeInTheDocument();
    expect(screen.getByText('1 applied')).toBeInTheDocument();
  });

  it('renders method filter dropdown', () => {
    render(<AllocationHistory entries={entries} />);
    expect(screen.getByText('All Methods')).toBeInTheDocument();
  });

  it('renders status filter dropdown', () => {
    render(<AllocationHistory entries={entries} />);
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<AllocationHistory entries={entries} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('filters entries by search term', () => {
    render(<AllocationHistory entries={entries} />);
    const search = screen.getByPlaceholderText('Search...');
    fireEvent.change(search, { target: { value: 'IT' } });
    expect(screen.getByText('IT Costs')).toBeInTheDocument();
    expect(screen.queryByText('HR Costs')).not.toBeInTheDocument();
  });

  it('expands entry on click and shows detail', () => {
    render(<AllocationHistory entries={[makeEntry()]} />);
    fireEvent.click(screen.getByText('Allocate IT Costs'));
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('IT Department')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('calls onRerun when re-run button clicked', () => {
    const onRerun = vi.fn();
    render(<AllocationHistory entries={[makeEntry()]} onRerun={onRerun} />);
    fireEvent.click(screen.getByText('Allocate IT Costs'));
    fireEvent.click(screen.getByText('Re-run'));
    expect(onRerun).toHaveBeenCalled();
  });

  it('shows filtered empty state when search has no matches', () => {
    render(<AllocationHistory entries={entries} />);
    const search = screen.getByPlaceholderText('Search...');
    fireEvent.change(search, { target: { value: 'nonexistent' } });
    expect(screen.getByText('No allocations match the current filters.')).toBeInTheDocument();
  });
});
