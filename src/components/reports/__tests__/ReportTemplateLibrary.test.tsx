import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { ReportTemplateLibrary } from '../ReportTemplateLibrary';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {
    FileText: makeIcon('FileText'),
    Search: makeIcon('Search'),
    Star: makeIcon('Star'),
    Copy: makeIcon('Copy'),
    Trash2: makeIcon('Trash2'),
    Plus: makeIcon('Plus'),
    BarChart3: makeIcon('BarChart3'),
    DollarSign: makeIcon('DollarSign'),
    TrendingUp: makeIcon('TrendingUp'),
    PieChart: makeIcon('PieChart'),
  };
});
vi.mock('@/components/ui/Card', () => {
  const Card = ({ children, ...p }: any) => <div {...p}>{children}</div>;
  Card.displayName = 'Card';
  return { Card, CardContent: ({ children }: any) => <div>{children}</div> };
});
vi.mock('@/utils/cn', () => ({ cn: (...a: any[]) => a.filter(Boolean).join(' ') }));
vi.mock('@/engines/ReportBuilderEngine', () => ({
  ReportBuilderEngine: {
    getTemplateLayout: () => ({
      rows: [],
      columns: [],
      columnWidths: {},
      defaultRowHeight: 30,
      frozenColumns: 0,
      frozenRows: 0,
    }),
    getAvailableTemplates: () => [
      { type: 'income_statement', name: 'Income Statement', description: 'P&L' },
      { type: 'balance_sheet', name: 'Balance Sheet', description: 'BS' },
    ],
  },
}));

describe('ReportTemplateLibrary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders templates tab', () => {
    render(<ReportTemplateLibrary />);
    expect(screen.getByText('Templates')).toBeTruthy();
    expect(screen.getByText('Income Statement')).toBeTruthy();
  });

  it('shows saved reports tab', () => {
    render(
      <ReportTemplateLibrary
        savedReports={[
          {
            id: 'r1',
            name: 'My Report',
            template: 'custom',
            layout: {
              rows: [],
              columns: [],
              columnWidths: {},
              defaultRowHeight: 30,
              frozenColumns: 0,
              frozenRows: 0,
            },
            version: 1,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            createdBy: 'user',
            description: '',
            filters: [],
            shares: [],
            tags: [],
            isArchived: false,
          },
        ]}
      />
    );
    fireEvent.click(screen.getByText(/My Reports/));
    expect(screen.getByText('My Report')).toBeTruthy();
  });
});
