import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  FileText: () => <span data-testid="mock-icon" />,
  Calendar: () => <span data-testid="mock-icon" />,
  HelpCircle: () => <span data-testid="mock-icon" />,
  ArrowUpRight: () => <span data-testid="mock-icon" />,
  ArrowDownRight: () => <span data-testid="mock-icon" />,
  Minus: () => <span data-testid="mock-icon" />,
  ChevronUp: () => <span data-testid="mock-icon" />,
  ChevronDown: () => <span data-testid="mock-icon" />,
}));
vi.mock('@/store/reportStore', () => ({
  useReportStore: vi.fn(() => ({
    reports: [],
    templates: [],
    scheduledReports: [],
    addScheduledReport: vi.fn(),
    deleteScheduledReport: vi.fn(),
    toggleScheduledReport: vi.fn(),
  })),
}));
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [
      {
        id: '1',
        accountCode: '4100',
        accountName: 'Revenue',
        debit: 0,
        credit: 10000,
        netChange: -10000,
          amount: -10000,
        date: '2024-01-01',
      },
    ],
  })),
}));
vi.mock('@/engines/ReportSchedulingEngine', () => ({
  ReportSchedulingEngine: { getScheduledReports: () => [] },
}));
vi.mock('@/engines/ReportDistributionEngine', () => ({
  ReportDistributionEngine: { getDistributionList: () => [] },
}));

import { render, screen } from '@/test/testUtils';
import ReportSchedulerPage from '@/pages/reports/ReportScheduler';

describe('ReportScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the scheduler page', () => {
    render(<ReportSchedulerPage />);
    expect(screen.getByText(/Report Scheduler/i)).toBeInTheDocument();
  });

  it('renders add schedule button', () => {
    render(<ReportSchedulerPage />);
    expect(screen.getByText(/Add Schedule/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<ReportSchedulerPage />);
    expect(screen.getByText(/No schedules yet/i)).toBeInTheDocument();
  });
});
