/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ReportLayoutEditor } from '../ReportLayoutEditor';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {
    GripVertical: makeIcon('GripVertical'),
    Plus: makeIcon('Plus'),
    Trash2: makeIcon('Trash2'),
    Layers: makeIcon('Layers'),
    Columns: makeIcon('Columns'),
    Rows: makeIcon('Rows'),
  };
});
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));
vi.mock('@/utils/cn', () => ({ cn: (...a: any[]) => a.filter(Boolean).join(' ') }));

describe('ReportLayoutEditor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows empty row state', () => {
    render(
      <ReportLayoutEditor
        layout={{ rows: [], columns: [] } as any}
        selectedRowIndex={null}
        selectedColIndex={null}
        onSelectRow={vi.fn()}
        onSelectCol={vi.fn()}
        onAddRow={vi.fn()}
        onRemoveRow={vi.fn()}
        onAddColumn={vi.fn()}
        onRemoveColumn={vi.fn()}
        onUpdateRowLabel={vi.fn()}
        onUpdateRowType={vi.fn()}
        onUpdateColumnHeader={vi.fn()}
        onUpdateColumnWidth={vi.fn()}
        onDrop={vi.fn()}
      />
    );
    expect(screen.getByText(/Drag row types/)).toBeTruthy();
  });
});
