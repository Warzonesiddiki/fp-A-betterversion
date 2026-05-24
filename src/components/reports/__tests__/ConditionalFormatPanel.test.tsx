import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ConditionalFormatPanel } from '../ConditionalFormatPanel';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {
    X: makeIcon('X'),
    Plus: makeIcon('Plus'),
    Trash2: makeIcon('Trash2'),
    Palette: makeIcon('Palette'),
  };
});
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));
vi.mock('@/utils/cn', () => ({ cn: (...a: any[]) => a.filter(Boolean).join(' ') }));

describe('ConditionalFormatPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  const cell = {
    id: 'c1',
    rowId: 'r1',
    type: 'metric',
    style: {},
    content: { type: 'metric', content: { conditionalFormats: [] } },
  } as any;

  it('renders header', () => {
    render(<ConditionalFormatPanel cell={cell} onUpdateFormats={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Conditional Formatting')).toBeTruthy();
  });

  it('shows empty state', () => {
    render(<ConditionalFormatPanel cell={cell} onUpdateFormats={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/No conditional formats/)).toBeTruthy();
  });
});
