import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  FileText: () => <span data-testid="mock-icon" />,
  Search: () => <span data-testid="mock-icon" />,
  Star: () => <span data-testid="mock-icon" />,
  Copy: () => <span data-testid="mock-icon" />,
  Trash2: () => <span data-testid="mock-icon" />,
  Plus: () => <span data-testid="mock-icon" />,
  BarChart3: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
  PieChart: () => <span data-testid="mock-icon" />,
  ArrowUpRight: () => <span data-testid="mock-icon" />,
  ArrowDownRight: () => <span data-testid="mock-icon" />,
  Minus: () => <span data-testid="mock-icon" />,
  ChevronUp: () => <span data-testid="mock-icon" />,
  ChevronDown: () => <span data-testid="mock-icon" />,
}));
vi.mock('@/store/reportStore', () => ({
  useReportStore: vi.fn(() => ({
    templates: [],
    addTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  })),
}));

import { render, screen, fireEvent } from '@/test/testUtils';
import ReportTemplateLibraryPage from '@/pages/reports/ReportTemplateLibraryPage';

describe('ReportTemplateLibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the template library', () => {
    render(<ReportTemplateLibraryPage />);
    expect(screen.getByText(/Report Library/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<ReportTemplateLibraryPage />);
    fireEvent.click(screen.getByText(/My Reports/i));
    expect(screen.getByText(/No saved reports yet/i)).toBeInTheDocument();
  });
});
