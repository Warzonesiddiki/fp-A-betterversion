/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportScheduler } from './ReportScheduler';
import type { ScheduledReport } from './ReportScheduler';

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({
    children,
    isOpen,
    title,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({ label, options }: { label: string; options: { value: string; label: string }[] }) => (
    <div>
      <label>{label}</label>
      <select data-testid={`select-${label}`}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    className,
    size: _size,
    variant: _variant,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
    size?: string;
    variant?: string;
  }) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}));

const mockSchedules: ScheduledReport[] = [
  {
    id: 'sched-1',
    reportId: 'rpt-1',
    reportName: 'Monthly P&L',
    frequency: 'monthly',
    format: 'pdf',
    recipients: ['cfo@acme.com'],
    isActive: true,
    nextRun: '2026-06-01',
  },
  {
    id: 'sched-2',
    reportId: 'rpt-2',
    reportName: 'Weekly Cash Flow',
    frequency: 'weekly',
    format: 'excel',
    recipients: ['treasurer@acme.com'],
    isActive: false,
    nextRun: '2026-05-24',
  },
];

const mockReports = [
  { id: 'rpt-1', name: 'Monthly P&L' },
  { id: 'rpt-2', name: 'Weekly Cash Flow' },
];

describe('ReportScheduler', () => {
  it('renders empty state when no schedules', () => {
    render(
      <ReportScheduler
        schedules={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={mockReports}
      />
    );
    expect(screen.getByText('No schedules yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add schedule/i })).toBeInTheDocument();
  });

  it('renders schedules when provided', () => {
    render(
      <ReportScheduler
        schedules={mockSchedules}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={mockReports}
      />
    );
    expect(screen.getByText('Monthly P&L')).toBeInTheDocument();
    expect(screen.getByText('Weekly Cash Flow')).toBeInTheDocument();
  });

  it('renders the Scheduled Reports heading', () => {
    render(
      <ReportScheduler
        schedules={mockSchedules}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={mockReports}
      />
    );
    expect(screen.getByText('Scheduled Reports')).toBeInTheDocument();
  });

  it('renders frequency and format for each schedule', () => {
    render(
      <ReportScheduler
        schedules={mockSchedules}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={mockReports}
      />
    );
    expect(screen.getByText(/monthly.*pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/weekly.*excel/i)).toBeInTheDocument();
  });

  it('renders next run dates', () => {
    render(
      <ReportScheduler
        schedules={mockSchedules}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={mockReports}
      />
    );
    expect(screen.getByText('Next run: 2026-06-01')).toBeInTheDocument();
    expect(screen.getByText('Next run: 2026-05-24')).toBeInTheDocument();
  });

  it('renders toggle buttons for each schedule', () => {
    render(
      <ReportScheduler
        schedules={mockSchedules}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={mockReports}
      />
    );
    const toggleButtons = screen
      .getAllByRole('button', { name: '' })
      .filter((btn) => btn.className.includes('rounded-full'));
    expect(toggleButtons).toHaveLength(2);
  });

  it('calls onToggle when toggle button is clicked', () => {
    const onToggle = vi.fn();
    render(
      <ReportScheduler
        schedules={mockSchedules}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={onToggle}
        availableReports={mockReports}
      />
    );
    const toggleButtons = screen
      .getAllByRole('button', { name: '' })
      .filter((btn) => btn.className.includes('rounded-full'));
    fireEvent.click(toggleButtons[0]);
    expect(onToggle).toHaveBeenCalledWith('sched-1');
  });

  it('renders remove buttons', () => {
    render(
      <ReportScheduler
        schedules={mockSchedules}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={mockReports}
      />
    );
    const removeButtons = screen.getAllByText('Remove');
    expect(removeButtons).toHaveLength(2);
  });

  it('opens modal when Add Schedule is clicked from empty state', () => {
    render(
      <ReportScheduler
        schedules={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={mockReports}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add schedule/i }));
    expect(screen.getByText('New Schedule')).toBeInTheDocument();
  });

  it('opens modal when Add Schedule is clicked from list view', () => {
    render(
      <ReportScheduler
        schedules={mockSchedules}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onToggle={vi.fn()}
        availableReports={mockReports}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add schedule/i }));
    expect(screen.getByText('New Schedule')).toBeInTheDocument();
  });
});
