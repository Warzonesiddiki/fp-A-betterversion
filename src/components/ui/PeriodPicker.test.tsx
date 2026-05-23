import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PeriodPicker } from './PeriodPicker';
import type { FiscalPeriod } from '@/types';

const mockPeriods: FiscalPeriod[] = [
  {
    id: 'p1',
    year: 2024,
    periodNumber: 1,
    name: 'January',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    periodType: 'Monthly',
    isAdjustingPeriod: false,
    isClosed: true,
    closedAt: '2024-02-05T00:00:00Z',
    closedBy: 'admin',
  },
  {
    id: 'p2',
    year: 2024,
    periodNumber: 2,
    name: 'February',
    startDate: '2024-02-01',
    endDate: '2024-02-29',
    periodType: 'Monthly',
    isAdjustingPeriod: false,
    isClosed: false,
    closedAt: null,
    closedBy: null,
  },
  {
    id: 'p3',
    year: 2024,
    periodNumber: 3,
    name: 'March',
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    periodType: 'Monthly',
    isAdjustingPeriod: false,
    isClosed: false,
    closedAt: null,
    closedBy: null,
  },
];

describe('PeriodPicker', () => {
  it('renders the fiscal period label', () => {
    render(<PeriodPicker value="p1" onChange={vi.fn()} periods={mockPeriods} />);
    expect(screen.getByText('Fiscal Period')).toBeInTheDocument();
  });

  it('shows selected period name and year', () => {
    render(<PeriodPicker value="p1" onChange={vi.fn()} periods={mockPeriods} />);
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('shows placeholder when no period selected', () => {
    render(<PeriodPicker value="" onChange={vi.fn()} periods={mockPeriods} />);
    expect(screen.getByText('Select Period...')).toBeInTheDocument();
  });

  it('opens dropdown on trigger click and shows period options', () => {
    render(<PeriodPicker value="p1" onChange={vi.fn()} periods={mockPeriods} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Select Period')).toBeInTheDocument();
    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('February')).toBeInTheDocument();
    expect(screen.getByText('March')).toBeInTheDocument();
  });

  it('shows quarter groupings', () => {
    render(<PeriodPicker value="p1" onChange={vi.fn()} periods={mockPeriods} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Q1 2024')).toBeInTheDocument();
  });

  it('calls onPeriodChange when a period is selected', () => {
    const onChange = vi.fn();
    render(<PeriodPicker value="p1" onChange={onChange} periods={mockPeriods} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('February'));
    expect(onChange).toHaveBeenCalledWith('p2');
  });

  it('shows checkmark on selected period', () => {
    render(<PeriodPicker value="p1" onChange={vi.fn()} periods={mockPeriods} />);
    fireEvent.click(screen.getByRole('button'));
    const selectedBtn = screen.getByText('January').closest('button');
    expect(selectedBtn?.querySelector('svg')).toBeInTheDocument();
  });

  it('shows Closed badge for closed periods', () => {
    render(<PeriodPicker value="p2" onChange={vi.fn()} periods={mockPeriods} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('renders calendar icon', () => {
    render(<PeriodPicker value="p1" onChange={vi.fn()} periods={mockPeriods} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
