import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GanttChart } from '@/components/ui/GanttChart';

const sampleTasks = [
  { id: '1', name: 'Planning', startDate: '2026-01-01', endDate: '2026-01-15' },
  { id: '2', name: 'Development', startDate: '2026-01-10', endDate: '2026-02-28', progress: 60 },
  { id: '3', name: 'Testing', startDate: '2026-02-15', endDate: '2026-03-15' },
];

describe('GanttChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with data', () => {
    const { container } = render(<GanttChart tasks={sampleTasks} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays task names', () => {
    render(<GanttChart tasks={sampleTasks} />);
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    const { container } = render(<GanttChart tasks={[]} loading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    render(<GanttChart tasks={[]} error="Load failed" />);
    expect(screen.getAllByText(/Load failed/i)[0]).toBeInTheDocument();
  });

  it('shows "No data" when tasks are empty', () => {
    render(<GanttChart tasks={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('displays Task header', () => {
    render(<GanttChart tasks={sampleTasks} />);
    expect(screen.getByText('Task')).toBeInTheDocument();
  });
});
