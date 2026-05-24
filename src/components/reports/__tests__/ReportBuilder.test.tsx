import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ReportBuilder } from '../ReportBuilder';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {
    GripVertical: makeIcon('GripVertical'),
    Plus: makeIcon('Plus'),
    Trash2: makeIcon('Trash2'),
    Settings: makeIcon('Settings'),
    Eye: makeIcon('Eye'),
    Save: makeIcon('Save'),
    Undo2: makeIcon('Undo2'),
    Redo2: makeIcon('Redo2'),
    Layers: makeIcon('Layers'),
    Columns: makeIcon('Columns'),
    Rows: makeIcon('Rows'),
  };
});
vi.mock('../ReportGrid', () => ({ ReportGrid: () => <div data-testid="report-grid" /> }));
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));
vi.mock('@/utils/cn', () => ({ cn: (...a: any[]) => a.filter(Boolean).join(' ') }));
vi.mock('@/engines/ReportBuilderEngine', () => ({
  ReportBuilderEngine: {
    createReport: () => ({
      id: 'r1',
      name: 'New Report',
      template: 'custom',
      layout: { rows: [], columns: [] },
      version: 1,
      createdAt: '',
      updatedAt: '',
      createdBy: 'user',
    }),
    addRow: (l: any) => l,
    removeRow: (l: any) => l,
    addColumn: (l: any) => l,
    removeColumn: (l: any) => l,
    updateCell: (l: any) => l,
    updateReport: (r: any, u: any) => ({ ...r, ...u }),
    setColumnWidth: (l: any) => l,
    validateReport: () => ({ valid: true, errors: [] }),
  },
}));

describe('ReportBuilder', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders toolbar', () => {
    render(<ReportBuilder />);
    expect(screen.getByLabelText('Report name')).toBeTruthy();
  });
});
