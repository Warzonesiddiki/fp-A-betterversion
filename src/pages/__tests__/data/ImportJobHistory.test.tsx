import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  Database: () => <span data-testid="mock-icon" />,
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode }) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
}));

import { render, screen } from '@/test/testUtils';
import { ImportJobHistory } from '@/pages/data/ImportJobHistory';

const emptyJobs: never[] = [];

const sampleJobs = [
  {
    id: '1',
    filename: 'gl_2024.xlsx',
    fileType: 'Excel',
    rowCount: 5000,
    status: 'Completed',
    startedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '2',
    filename: 'budget.csv',
    fileType: 'CSV',
    rowCount: 1200,
    status: 'Failed',
    startedAt: '2024-12-02T14:30:00Z',
  },
];

describe('ImportJobHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(<ImportJobHistory jobs={emptyJobs} />);
    expect(screen.getByText(/Import Job History/i)).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<ImportJobHistory jobs={emptyJobs} />);
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Rows')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Started')).toBeInTheDocument();
  });

  it('renders empty table body with no jobs', () => {
    const { container } = render(<ImportJobHistory jobs={emptyJobs} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(0);
  });

  it('renders job rows when data is provided', () => {
    render(<ImportJobHistory jobs={sampleJobs} />);
    expect(screen.getByText('gl_2024.xlsx')).toBeInTheDocument();
    expect(screen.getByText('budget.csv')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
