import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ReportGrid } from '../ReportGrid';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {
    ChevronRight: makeIcon('ChevronRight'),
    ChevronDown: makeIcon('ChevronDown'),
    Download: makeIcon('Download'),
    FileText: makeIcon('FileText'),
    Table: makeIcon('Table'),
  };
});
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));
vi.mock('@/utils/cn', () => ({ cn: (...a: any[]) => a.filter(Boolean).join(' ') }));
vi.mock('@/engines/ReportBuilderEngine', () => ({
  ReportBuilderEngine: {
    getVisibleColumns: (l: any) => l.columns || [],
    buildMetricKey: () => 'key',
    formatNumber: (v: number) => String(v),
    evaluateConditionalFormats: () => null,
  },
}));

describe('ReportGrid', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows empty state', () => {
    render(<ReportGrid layout={{ rows: [], columns: [] } as any} />);
    expect(screen.getByText(/No data to display/)).toBeTruthy();
  });
});
