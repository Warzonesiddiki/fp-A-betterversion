import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ReportLeftPanel } from '../ReportLeftPanel';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {
    GripVertical: makeIcon('GripVertical'),
    Settings: makeIcon('Settings'),
    Columns: makeIcon('Columns'),
    Rows: makeIcon('Rows'),
  };
});
vi.mock('@/utils/cn', () => ({ cn: (...a: any[]) => a.filter(Boolean).join(' ') }));

describe('ReportLeftPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders rows panel by default', () => {
    render(
      <ReportLeftPanel
        activePanel="rows"
        reportName=""
        reportDescription=""
        errors={[]}
        onPanelChange={vi.fn()}
        onDragStart={vi.fn()}
        onNameChange={vi.fn()}
        onDescriptionChange={vi.fn()}
      />
    );
    expect(screen.getByText(/Drag to add rows/)).toBeTruthy();
  });

  it('renders properties panel', () => {
    render(
      <ReportLeftPanel
        activePanel="properties"
        reportName="Test"
        reportDescription=""
        errors={[]}
        onPanelChange={vi.fn()}
        onDragStart={vi.fn()}
        onNameChange={vi.fn()}
        onDescriptionChange={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue('Test')).toBeTruthy();
  });
});
