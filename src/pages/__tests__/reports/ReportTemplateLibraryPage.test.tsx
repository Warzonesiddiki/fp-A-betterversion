import { describe, it, beforeEach, expect, vi } from 'vitest';

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

// Zustand selector-aware mock (per RULE #108 v0.3 MERGE EDITION Read offset canonical)
const mockState = {
  reports: [],
  createReport: vi.fn(() => 'mock-report-id'),
  deleteReport: vi.fn(),
};

vi.mock('@/store/reportStore', () => ({
  useReportStore: vi.fn((selector?: (s: typeof mockState) => unknown) =>
    selector ? selector(mockState) : mockState
  ),
}));

import { render, screen, fireEvent } from '@/test/testUtils';
import ReportTemplateLibraryPage from '@/pages/reports/ReportTemplateLibraryPage';

describe('ReportTemplateLibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page header and stats', () => {
    render(<ReportTemplateLibraryPage />);
    expect(screen.getByText('Report Templates')).toBeInTheDocument();
    expect(screen.getByText(/Browse, filter, and create/i)).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('renders search input and sort dropdown', () => {
    render(<ReportTemplateLibraryPage />);
    expect(screen.getByLabelText('Search reports')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
  });

  it('renders view mode toggle with Grid and List buttons', () => {
    render(<ReportTemplateLibraryPage />);
    expect(screen.getByRole('button', { name: 'Grid' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument();
  });

  it('renders All filter chip with count', () => {
    render(<ReportTemplateLibraryPage />);
    expect(screen.getByRole('button', { name: /^All \(/ })).toBeInTheDocument();
  });

  it('renders + New Custom Report CTA', () => {
    render(<ReportTemplateLibraryPage />);
    expect(screen.getByRole('button', { name: /\+ New Custom Report/ })).toBeInTheDocument();
  });
});
