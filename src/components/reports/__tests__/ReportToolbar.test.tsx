import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ReportToolbar } from '../ReportToolbar';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {
    Eye: makeIcon('Eye'),
    Save: makeIcon('Save'),
    Undo2: makeIcon('Undo2'),
    Redo2: makeIcon('Redo2'),
  };
});
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

describe('ReportToolbar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders name input and buttons', () => {
    render(
      <ReportToolbar
        name="Test Report"
        errorCount={0}
        historyIndex={0}
        historyLength={1}
        previewMode={false}
        onNameChange={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onTogglePreview={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue('Test Report')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('shows error count', () => {
    render(
      <ReportToolbar
        name="Test"
        errorCount={3}
        historyIndex={0}
        historyLength={1}
        previewMode={false}
        onNameChange={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onTogglePreview={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText('3 issues')).toBeTruthy();
  });
});
