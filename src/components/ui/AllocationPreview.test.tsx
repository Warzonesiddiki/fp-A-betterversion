/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AllocationPreview } from './AllocationPreview';
import type { AllocationResult } from '@/engines/AllocationEngine';

const result: AllocationResult = {
  ruleId: 'rule-1',
  allocations: [
    { target: 'Sales', amount: 4000, percentage: 40 },
    { target: 'Marketing', amount: 3000, percentage: 30 },
    { target: 'Engineering', amount: 3000, percentage: 30 },
  ],
  totalAllocated: 10000,
  timestamp: '2026-01-15T10:00:00Z',
  auditComment: 'Q1 budget allocation across departments',
};

describe('AllocationPreview', () => {
  it('renders without crashing', () => {
    render(<AllocationPreview result={result} sourceAmount={10000} />);
    expect(screen.getByText('Allocation Preview')).toBeInTheDocument();
  });

  it('renders source amount', () => {
    render(<AllocationPreview result={result} sourceAmount={10000} sourceLabel="Budget" />);
    const amounts = screen.getAllByText('$10,000.00');
    expect(amounts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Budget')).toBeInTheDocument();
  });

  it('renders allocation targets', () => {
    render(<AllocationPreview result={result} sourceAmount={10000} />);
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('renders total allocated amount', () => {
    render(<AllocationPreview result={result} sourceAmount={10000} />);
    const totals = screen.getAllByText('$10,000.00');
    expect(totals.length).toBeGreaterThanOrEqual(1);
  });

  it('renders journal entries section', () => {
    render(<AllocationPreview result={result} sourceAmount={10000} />);
    expect(screen.getByText('Journal Entries')).toBeInTheDocument();
  });

  it('renders audit comment', () => {
    render(<AllocationPreview result={result} sourceAmount={10000} />);
    expect(screen.getByText('Q1 budget allocation across departments')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<AllocationPreview result={result} sourceAmount={10000} />);
    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Modify')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('calls onAccept when accept clicked', () => {
    const onAccept = vi.fn();
    render(<AllocationPreview result={result} sourceAmount={10000} onAccept={onAccept} />);
    fireEvent.click(screen.getByText('Accept'));
    expect(onAccept).toHaveBeenCalledWith(result);
  });

  it('calls onReject when reject clicked', () => {
    const onReject = vi.fn();
    render(<AllocationPreview result={result} sourceAmount={10000} onReject={onReject} />);
    fireEvent.click(screen.getByText('Reject'));
    expect(onReject).toHaveBeenCalled();
  });

  it('calls onModify when modify clicked', () => {
    const onModify = vi.fn();
    render(<AllocationPreview result={result} sourceAmount={10000} onModify={onModify} />);
    fireEvent.click(screen.getByText('Modify'));
    expect(onModify).toHaveBeenCalled();
  });

  it('shows accepted state after accept clicked', () => {
    render(<AllocationPreview result={result} sourceAmount={10000} />);
    fireEvent.click(screen.getByText('Accept'));
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('shows remaining indicator when amounts differ', () => {
    render(<AllocationPreview result={result} sourceAmount={12000} />);
    expect(screen.getByText(/Remaining/)).toBeInTheDocument();
  });

  it('shows over-allocated indicator when over budget', () => {
    render(<AllocationPreview result={result} sourceAmount={8000} />);
    expect(screen.getByText(/Over-allocated/)).toBeInTheDocument();
  });

  it('renders target count label', () => {
    render(<AllocationPreview result={result} sourceAmount={10000} />);
    expect(screen.getByText('3 targets')).toBeInTheDocument();
  });
});
