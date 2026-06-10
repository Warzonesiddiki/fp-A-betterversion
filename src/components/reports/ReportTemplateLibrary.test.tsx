/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportTemplateLibrary } from './ReportTemplateLibrary';
import type { ReportDefinition } from '@/engines/ReportBuilderEngine';

vi.mock('@/components/ui/Card', () => ({
  Card: ({
    children,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <div
      data-testid="card"
      className={className}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter') onClick();
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/engines/ReportBuilderEngine', () => ({
  ReportBuilderEngine: {
    getAvailableTemplates: vi.fn().mockReturnValue([
      { type: 'income_statement', name: 'Income Statement', description: 'Standard P&L template' },
      {
        type: 'balance_sheet',
        name: 'Balance Sheet',
        description: 'Standard balance sheet template',
      },
      { type: 'cash_flow', name: 'Cash Flow', description: 'Cash flow statement template' },
      { type: 'budget_vs_actual', name: 'Budget vs Actual', description: 'BvA analysis template' },
      { type: 'custom', name: 'Blank Report', description: 'Start from scratch' },
    ]),
    getTemplateLayout: vi.fn().mockReturnValue({
      rows: [
        { id: 'r1', type: 'header', cells: [], isVisible: true },
        { id: 'r2', type: 'data', cells: [], isVisible: true },
      ],
      columns: [
        { id: 'c1', type: 'label', header: 'Label', width: 200 },
        { id: 'c2', type: 'period', header: 'Actual', width: 120, period: 'actual' },
      ],
    }),
  },
}));

const mockSavedReports: ReportDefinition[] = [
  {
    id: 'rpt-1',
    name: 'Q1 P&L Report',
    description: 'First quarter P&L',
    template: 'income_statement',
    layout: {
      rows: [],
      columns: [],
      columnWidths: {},
      defaultRowHeight: 30,
      frozenColumns: 0,
      frozenRows: 0,
    },
    filters: [],
    shares: [],
    tags: [],
    isArchived: false,
    version: 2,
    createdAt: '2026-01-15',
    updatedAt: '2026-04-01',
    createdBy: 'user',
  },
  {
    id: 'rpt-2',
    name: 'Annual Balance Sheet',
    description: 'Year-end balance sheet',
    template: 'balance_sheet',
    layout: {
      rows: [],
      columns: [],
      columnWidths: {},
      defaultRowHeight: 30,
      frozenColumns: 0,
      frozenRows: 0,
    },
    filters: [],
    shares: [],
    tags: [],
    isArchived: false,
    version: 1,
    createdAt: '2026-03-01',
    updatedAt: '2026-03-15',
    createdBy: 'user',
  },
];

describe('ReportTemplateLibrary', () => {
  it('renders without crashing', () => {
    render(<ReportTemplateLibrary />);
  });

  it('renders the Report Library heading', () => {
    render(<ReportTemplateLibrary />);
    expect(screen.getByText('Report Library')).toBeInTheDocument();
  });

  it('renders the Templates tab as active by default', () => {
    render(<ReportTemplateLibrary />);
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText(/My Reports/)).toBeInTheDocument();
  });

  it('renders template cards', () => {
    render(<ReportTemplateLibrary />);
    expect(screen.getByText('Income Statement')).toBeInTheDocument();
    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Budget vs Actual')).toBeInTheDocument();
    expect(screen.getByText('Blank Report')).toBeInTheDocument();
  });

  it('renders template descriptions', () => {
    render(<ReportTemplateLibrary />);
    expect(screen.getByText('Standard P&L template')).toBeInTheDocument();
    expect(screen.getByText('Standard balance sheet template')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<ReportTemplateLibrary />);
    expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
  });

  it('filters templates based on search query', () => {
    render(<ReportTemplateLibrary />);
    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'income' } });
    expect(screen.getByText('Income Statement')).toBeInTheDocument();
    expect(screen.queryByText('Balance Sheet')).not.toBeInTheDocument();
  });

  it('switches to saved reports tab', () => {
    render(<ReportTemplateLibrary savedReports={mockSavedReports} />);
    fireEvent.click(screen.getByText(/My Reports/));
    expect(screen.getByText('Q1 P&L Report')).toBeInTheDocument();
    expect(screen.getByText('Annual Balance Sheet')).toBeInTheDocument();
  });

  it('renders saved report count in tab', () => {
    render(<ReportTemplateLibrary savedReports={mockSavedReports} />);
    expect(screen.getByText('My Reports (2)')).toBeInTheDocument();
  });

  it('renders empty state for saved reports when none exist', () => {
    render(<ReportTemplateLibrary savedReports={[]} />);
    fireEvent.click(screen.getByText(/My Reports/));
    expect(screen.getByText('No saved reports yet')).toBeInTheDocument();
  });

  it('calls onSelectTemplate when a template is clicked', () => {
    const onSelectTemplate = vi.fn();
    render(<ReportTemplateLibrary onSelectTemplate={onSelectTemplate} />);
    fireEvent.click(screen.getByText('Income Statement'));
    expect(onSelectTemplate).toHaveBeenCalledWith('income_statement');
  });

  it('calls onSelectReport when a saved report is clicked', () => {
    const onSelectReport = vi.fn();
    render(
      <ReportTemplateLibrary savedReports={mockSavedReports} onSelectReport={onSelectReport} />
    );
    fireEvent.click(screen.getByText(/My Reports/));
    fireEvent.click(screen.getByText('Q1 P&L Report'));
    expect(onSelectReport).toHaveBeenCalledWith(mockSavedReports[0]!);
  });

  it('renders version badge for saved reports', () => {
    render(<ReportTemplateLibrary savedReports={mockSavedReports} />);
    fireEvent.click(screen.getByText(/My Reports/));
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('renders clone button when onCloneReport is provided', () => {
    render(<ReportTemplateLibrary savedReports={mockSavedReports} onCloneReport={vi.fn()} />);
    fireEvent.click(screen.getByText(/My Reports/));
    const cloneButtons = screen.getAllByRole('button', { name: /clone report/i });
    expect(cloneButtons).toHaveLength(2);
  });

  it('renders delete button when onDeleteReport is provided', () => {
    render(<ReportTemplateLibrary savedReports={mockSavedReports} onDeleteReport={vi.fn()} />);
    fireEvent.click(screen.getByText(/My Reports/));
    const deleteButtons = screen.getAllByRole('button', { name: /delete report/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it('filters saved reports by search query', () => {
    render(<ReportTemplateLibrary savedReports={mockSavedReports} />);
    fireEvent.click(screen.getByText(/My Reports/));
    const searchInput = screen.getByPlaceholderText('Search reports...');
    fireEvent.change(searchInput, { target: { value: 'Q1' } });
    expect(screen.getByText('Q1 P&L Report')).toBeInTheDocument();
    expect(screen.queryByText('Annual Balance Sheet')).not.toBeInTheDocument();
  });
});
