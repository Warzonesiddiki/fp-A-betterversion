import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { useDashboardStore } from '@/store/dashboardStore';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [
      {
        id: '1',
        account: '4000',
        accountName: 'Revenue',
        amount: 100000,
        period: '2026-01',
        department: 'Sales',
        type: 'revenue',
      },
    ],
  })),
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    LayoutDashboard: makeIcon(),
    LayoutGrid: makeIcon(),
    Plus: makeIcon(),
    Save: makeIcon(),
    Download: makeIcon(),
    Trash2: makeIcon(),
    GripVertical: makeIcon(),
  };
});

import DashboardBuilderPage from '@/pages/analytics/DashboardBuilderPage';

function resetDashboardStore() {
  useDashboardStore.setState({
    dashboards: [],
    activeDashboardId: null,
    filters: {},
    isLoading: false,
    error: null,
  });
}

describe('DashboardBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    resetDashboardStore();
  });

  it('renders heading and seeds a default dashboard from dashboardStore on first visit', () => {
    render(<DashboardBuilderPage />);
    expect(screen.getByText(/Dashboard Builder/i)).toBeTruthy();
    // Regression: the page previously held widgets in raw useState with no
    // real store; now the very first render must have created a real,
    // persisted Dashboard record in useDashboardStore.
    expect(useDashboardStore.getState().dashboards).toHaveLength(1);
    expect(useDashboardStore.getState().dashboards[0]?.widgets.length).toBeGreaterThan(0);
  });

  it('persists added widgets in dashboardStore across remounts (regression: Save previously did not persist)', () => {
    // Prior bug: handleSave wrote to a localStorage key nothing ever read
    // back, so a refresh silently discarded the user's layout. The page now
    // writes straight through the already-tested, already-persisted
    // dashboardStore on every mutation -- prove a remount sees the change.
    const { unmount } = render(<DashboardBuilderPage />);

    fireEvent.click(screen.getByTestId('customize-toggle'));
    fireEvent.click(screen.getByTestId('add-widget-kpi'));
    fireEvent.click(screen.getByTestId('save-dashboard'));

    const dashboardId = useDashboardStore.getState().activeDashboardId;
    const widgetCountAfterAdd = useDashboardStore
      .getState()
      .dashboards.find((d) => d.id === dashboardId)?.widgets.length;
    expect(widgetCountAfterAdd).toBeGreaterThan(0);

    unmount();
    render(<DashboardBuilderPage />);

    // Same dashboard, same widget count -- nothing was silently reset.
    expect(useDashboardStore.getState().dashboards).toHaveLength(1);
    expect(
      useDashboardStore.getState().dashboards.find((d) => d.id === dashboardId)?.widgets.length
    ).toBe(widgetCountAfterAdd);
  });

  it('discards in-progress edits when Cancel is clicked (regression: Cancel previously kept edits)', () => {
    render(<DashboardBuilderPage />);

    const widgetCountBefore = useDashboardStore.getState().dashboards[0]?.widgets.length ?? 0;

    fireEvent.click(screen.getByTestId('customize-toggle'));
    fireEvent.click(screen.getByTestId('add-widget-kpi'));
    expect(useDashboardStore.getState().dashboards[0]?.widgets.length).toBe(widgetCountBefore + 1);

    fireEvent.click(screen.getByTestId('cancel-edit'));

    expect(useDashboardStore.getState().dashboards[0]?.widgets.length).toBe(widgetCountBefore);
  });

  it('removes a widget through the store when Remove is clicked', () => {
    render(<DashboardBuilderPage />);
    fireEvent.click(screen.getByTestId('customize-toggle'));

    const dashboardId = useDashboardStore.getState().activeDashboardId!;
    const firstWidgetId = useDashboardStore.getState().dashboards[0]!.widgets[0]!.id;
    const countBefore = useDashboardStore.getState().dashboards[0]!.widgets.length;

    fireEvent.click(screen.getByTestId(`remove-${firstWidgetId}`));

    const countAfter = useDashboardStore.getState().dashboards.find((d) => d.id === dashboardId)
      ?.widgets.length;
    expect(countAfter).toBe(countBefore - 1);
  });

  it('exports the active dashboard as a downloadable file when Export is clicked', () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();

    (URL as any).createObjectURL = createObjectURL;

    (URL as any).revokeObjectURL = revokeObjectURL;

    render(<DashboardBuilderPage />);
    fireEvent.click(screen.getByTestId('export-dashboard'));

    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
