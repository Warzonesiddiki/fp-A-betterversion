/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportBuilder } from './ReportBuilder';

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    className,
    disabled,
    size: _size,
    variant: _variant,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
    size?: string;
    variant?: string;
  }) => (
    <button className={className} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('./ReportGrid', () => ({
  ReportGrid: ({ layout: _layout }: { layout: unknown }) => (
    <div data-testid="report-grid">Report Grid Mock</div>
  ),
}));

vi.mock('./FormulaBar', () => ({
  FormulaBar: () => <div data-testid="formula-bar">Formula Bar Mock</div>,
}));

vi.mock('./ConditionalFormatPanel', () => ({
  ConditionalFormatPanel: () => (
    <div data-testid="conditional-format-panel">Conditional Format Mock</div>
  ),
}));

vi.mock('./ExportDialog', () => ({
  ExportDialog: () => <div data-testid="export-dialog">Export Dialog Mock</div>,
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((arr: unknown[], from: number, to: number) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  verticalListSortingStrategy: vi.fn(),
  horizontalListSortingStrategy: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => undefined),
    },
  },
}));

vi.mock('@/engines/ReportBuilderEngine', () => {
  const mockReport = {
    id: 'report-1',
    name: 'New Report',
    description: '',
    template: 'custom',
    category: 'user',
    layout: {
      rows: [],
      columns: [],
      columnWidths: {},
      defaultRowHeight: 28,
      frozenColumns: 0,
      frozenRows: 0,
    },
    filters: [],
    shares: [],
    permissions: [],
    tags: [],
    isArchived: false,
    version: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    createdBy: 'user',
  };

  return {
    ReportBuilderEngine: {
      createReport: vi.fn().mockReturnValue(mockReport),
      validateReport: vi.fn().mockReturnValue({ valid: true, errors: [] }),
      updateReport: vi.fn().mockImplementation((report, updates) => ({ ...report, ...updates })),
      addRow: vi.fn().mockImplementation((layout, type) => ({
        ...layout,
        rows: [
          ...layout.rows,
          {
            id: `row-${Date.now()}`,
            type,
            cells: [],
            isVisible: true,
            pageBreakBefore: false,
            height: 28,
          },
        ],
      })),
      removeRow: vi.fn().mockImplementation((layout) => layout),
      addColumn: vi.fn().mockImplementation((layout) => layout),
      removeColumn: vi.fn().mockImplementation((layout) => layout),
      setColumnWidth: vi.fn().mockImplementation((layout) => layout),
      updateCell: vi.fn().mockImplementation((layout) => layout),
      moveRow: vi.fn().mockImplementation((layout) => layout),
      getVisibleColumns: vi.fn().mockReturnValue([]),
      columnIndexToLetter: vi.fn().mockReturnValue('A'),
      columnLetterToIndex: vi.fn().mockReturnValue(0),
    },
  };
});

describe('ReportBuilder', () => {
  it('renders without crashing', () => {
    render(<ReportBuilder />);
  });

  it('renders the report name input with default value', () => {
    render(<ReportBuilder />);
    expect(screen.getByDisplayValue('New Report')).toBeInTheDocument();
  });

  it('renders the save button', () => {
    render(<ReportBuilder />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('renders the preview toggle button', () => {
    render(<ReportBuilder />);
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });

  it('renders undo and redo buttons', () => {
    render(<ReportBuilder />);
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });

  it('renders the rows panel by default', () => {
    render(<ReportBuilder />);
    expect(screen.getByText('Rows')).toBeInTheDocument();
    expect(screen.getByText('Drag to add rows')).toBeInTheDocument();
  });

  it('renders row type options', () => {
    render(<ReportBuilder />);
    expect(screen.getByText('Header Row')).toBeInTheDocument();
    expect(screen.getByText('Data Row')).toBeInTheDocument();
    expect(screen.getByText('Subtotal Row')).toBeInTheDocument();
    expect(screen.getByText('Total Row')).toBeInTheDocument();
    expect(screen.getByText('Blank Row')).toBeInTheDocument();
  });

  it('renders the empty rows placeholder', () => {
    render(<ReportBuilder />);
    expect(screen.getByText(/drag row types here or click add row/i)).toBeInTheDocument();
  });

  it('renders the live preview panel', () => {
    render(<ReportBuilder />);
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
  });

  it('renders with initial report prop', () => {
    const initialReport = {
      id: 'custom-1',
      name: 'My Custom Report',
      description: 'A test report',
      template: 'custom' as const,
      category: 'user' as const,
      layout: {
        rows: [],
        columns: [],
        columnWidths: {},
        defaultRowHeight: 28,
        frozenColumns: 0,
        frozenRows: 0,
      },
      filters: [],
      shares: [],
      permissions: [],
      tags: [],
      isArchived: false,
      version: 1,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      createdBy: 'user',
    };
    render(<ReportBuilder initialReport={initialReport} />);
    expect(screen.getByDisplayValue('My Custom Report')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ReportBuilder className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has correct aria-label on region', () => {
    render(<ReportBuilder />);
    expect(screen.getByRole('region', { name: 'Report Builder' })).toBeInTheDocument();
  });

  it('renders formula tab', () => {
    render(<ReportBuilder />);
    expect(screen.getByText('Rows')).toBeInTheDocument();
  });

  it('renders format tab', () => {
    render(<ReportBuilder />);
    expect(screen.getByText('Cols')).toBeInTheDocument();
  });

  it('renders export tab', () => {
    render(<ReportBuilder />);
    expect(screen.getByText('Props')).toBeInTheDocument();
  });

  it('renders add row button', () => {
    render(<ReportBuilder />);
    expect(screen.getByRole('button', { name: /add row/i })).toBeInTheDocument();
  });

  it('renders add column button', () => {
    render(<ReportBuilder />);
    expect(screen.getByRole('button', { name: /add column/i })).toBeInTheDocument();
  });
});
