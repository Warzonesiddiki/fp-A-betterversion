import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ExportDialog } from '../ExportDialog';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {
    X: makeIcon('X'),
    FileText: makeIcon('FileText'),
    Table: makeIcon('Table'),
    Download: makeIcon('Download'),
    Loader2: makeIcon('Loader2'),
  };
});
vi.mock('@/utils/cn', () => ({ cn: (...a: any[]) => a.filter(Boolean).join(' ') }));
vi.mock('@/engines/ReportBuilderEngine', () => ({
  ReportBuilderEngine: {
    generatePDFMetadata: () => ({}),
    resolveLayout: () => [],
    getVisibleColumns: () => [],
    generateExcelExport: () => ({ sheets: [{ data: [] }] }),
    generateCSVExport: () => ({ content: '', filename: '' }),
    formatNumber: (v: number) => String(v),
  },
}));
vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn() },
}));

describe('ExportDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  const report = {
    id: 'r1',
    name: 'Test Report',
    template: 'custom',
    layout: { rows: [], columns: [] },
    version: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: 'user',
  } as any;

  it('renders format options', () => {
    render(<ExportDialog report={report} cubeData={{}} onClose={vi.fn()} />);
    expect(screen.getByText('Export Report')).toBeTruthy();
    expect(screen.getByText('PDF')).toBeTruthy();
    expect(screen.getByText('Excel')).toBeTruthy();
    expect(screen.getByText('CSV')).toBeTruthy();
  });
});
