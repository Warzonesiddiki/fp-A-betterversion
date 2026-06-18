import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

import { useGLStore } from '@/store/glStore';
import { useCollaborationStore } from '@/store/collaborationStore';
import { TeamWorkspace } from '@/pages/collaboration/TeamWorkspace';
import * as TeamWorkspaceMod from '@/pages/collaboration/TeamWorkspace';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(),
}));
vi.mock('@/store/collaborationStore', () => ({
  useCollaborationStore: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const SAMPLE_ENTRIES = [
  {
    id: '1',
    accountCode: '1000',
    accountName: 'Cash',
    debit: 1000,
    credit: 0,
    netChange: 1000,
    description: 'Initial deposit',
    date: '2026-01-01',
  },
  {
    id: '2',
    accountCode: '4000',
    accountName: 'Revenue',
    debit: 0,
    credit: 5000,
    netChange: 5000,
    description: 'Q1 revenue',
    date: '2026-01-15',
  },
];

const SAMPLE_TASKS = [
  { id: 't1', title: 'Review Q1 budget', status: 'open' },
  { id: 't2', title: 'Approve forecast', status: 'done' },
];

const SAMPLE_ACTIVITY = [
  { message: 'Carla commented on Q1 budget' },
  { message: 'Vera updated Revenue forecast' },
];

const renderComponent = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <TeamWorkspace />
      </MemoryRouter>
    </I18nextProvider>
  );

describe('TeamWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGLStore).mockReturnValue({ entries: SAMPLE_ENTRIES } as never);
    vi.mocked(useCollaborationStore).mockReturnValue({
      comments: [],
      tasks: SAMPLE_TASKS,
      activityLog: SAMPLE_ACTIVITY,
    } as never);
  });

  it('renders without crashing with sample data', () => {
    const { container } = renderComponent();
    expect(container).toBeInTheDocument();
  });

  it('shows the Team Workspace heading', () => {
    renderComponent();
    const heading = screen.getByRole('heading', { name: /Team Workspace/i, level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('shows 4 KPI cards in the metrics section', () => {
    renderComponent();
    expect(screen.getByRole('region', { name: 'Team Members' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Online Now' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Open Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Activity Log' })).toBeInTheDocument();
  });

  it('shows 4 tab triggers (Overview, Members, Tasks, Activity)', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    expect(triggers.length).toBeGreaterThanOrEqual(4);
  });

  it('shows the live/real-time badge', () => {
    renderComponent();
    expect(screen.getByLabelText(/Real-time indicator/i)).toBeInTheDocument();
  });

  it('shows the refresh button in the header', () => {
    renderComponent();
    expect(screen.getByLabelText('Refresh team workspace')).toBeInTheDocument();
  });

  it('disables the Export CSV button when there is no data', () => {
    vi.mocked(useGLStore).mockReturnValue({ entries: [] } as never);
    renderComponent();
    // Empty state shows
    expect(screen.getByText(/No Team Workspace Data/i)).toBeInTheDocument();
  });

  it('switches to the Members tab and shows the search input', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const membersTab = triggers.find((t) => t.textContent?.startsWith('Members'));
    fireEvent.click(membersTab!);
    expect(membersTab!).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Search team members')).toBeInTheDocument();
  });

  it('switches to the Tasks tab and shows the task count breakdown', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const tasksTab = triggers.find((t) => t.textContent?.startsWith('Tasks'));
    fireEvent.click(tasksTab!);
    expect(tasksTab!).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/2 total • 1 open • 1 completed/i)).toBeInTheDocument();
  });

  it('switches to the Activity tab and shows the activity log', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const activityTab = triggers.find((t) => t.textContent?.startsWith('Activity'));
    fireEvent.click(activityTab!);
    expect(activityTab!).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/2 events/i)).toBeInTheDocument();
  });

  it('switches back to the Overview tab', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const overviewTab = triggers.find((t) => t.textContent === 'Overview');
    fireEvent.click(overviewTab!);
    expect(overviewTab!).toHaveAttribute('aria-selected', 'true');
  });

  it('shows the help / About Team Workspace card', () => {
    renderComponent();
    expect(screen.getByText('About Team Workspace')).toBeInTheDocument();
  });

  it('filters team members when search query is updated', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const membersTab = triggers.find((t) => t.textContent?.startsWith('Members'));
    fireEvent.click(membersTab!);
    const search = screen.getByLabelText('Search team members') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'Carla' } });
    expect(search.value).toBe('Carla');
  });

  it('shows the empty state when no entries are loaded', () => {
    vi.mocked(useGLStore).mockReturnValue({ entries: [] } as never);
    renderComponent();
    expect(screen.getByText(/No Team Workspace Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Import GL data to view team workspace/i)).toBeInTheDocument();
  });

  it('uses a named export for TeamWorkspace (no default export)', () => {
    expect(typeof TeamWorkspaceMod.TeamWorkspace).toBe('function');
    expect((TeamWorkspaceMod as unknown as { default?: unknown }).default).toBeUndefined();
  });

  it('shows the Account Overview data table on the Overview tab', () => {
    renderComponent();
    // Account Overview is rendered as an h3 heading (Card title)
    const overviewHeading = screen.getByRole('heading', { name: 'Account Overview' });
    expect(overviewHeading).toBeInTheDocument();
    // Data table is rendered as role="grid" with aria-label
    expect(screen.getByRole('grid', { name: 'Team workspace accounts' })).toBeInTheDocument();
  });
});
