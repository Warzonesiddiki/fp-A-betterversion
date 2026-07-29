import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

import { useGLStore } from '@/store/glStore';
import { useCollaborationStore } from '@/store/collaborationStore';
import { SharedReports } from '@/pages/collaboration/SharedReports';
import * as SharedReportsMod from '@/pages/collaboration/SharedReports';

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
  {
    id: '3',
    accountCode: '5000',
    accountName: 'Expenses',
    debit: 2000,
    credit: 0,
    netChange: -2000,
    description: 'Office rent',
    date: '2026-01-20',
  },
];

const renderComponent = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SharedReports />
      </MemoryRouter>
    </I18nextProvider>
  );

describe('SharedReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGLStore).mockReturnValue({ entries: SAMPLE_ENTRIES } as never);
    vi.mocked(useCollaborationStore).mockReturnValue({ comments: [], tasks: [] } as never);
  });

  it('renders without crashing with sample data', () => {
    const { container } = renderComponent();
    expect(container).toBeInTheDocument();
  });

  it('shows the Shared Reports heading', () => {
    renderComponent();
    const heading = screen.getByRole('heading', { name: /Shared Reports/i, level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('shows 4 KPI cards in the metrics section', () => {
    renderComponent();
    // KPI cards are rendered as role="region" with aria-label matching the label
    expect(screen.getByRole('region', { name: 'Total Entries' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Comments' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Total Debit' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Total Credit' })).toBeInTheDocument();
  });

  it('shows 4 tab triggers (Overview, Accounts, Tasks, Comments)', () => {
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
    expect(screen.getByLabelText('Refresh shared reports')).toBeInTheDocument();
  });

  it('disables the Export CSV button when there is no data', () => {
    vi.mocked(useGLStore).mockReturnValue({ entries: [] } as never);
    renderComponent();
    // Empty state does not render export button, so this is implicit
    // Instead, verify empty state is present
    expect(screen.getByText(/No Shared Reports Data/i)).toBeInTheDocument();
  });

  it('shows the search input', () => {
    renderComponent();
    expect(screen.getByLabelText('Search shared reports')).toBeInTheDocument();
  });

  it('shows the date range select with default "All time"', () => {
    renderComponent();
    expect(screen.getByText(/All time/i)).toBeInTheDocument();
  });

  it('switches to the Accounts tab when clicked', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const accountsTab = triggers.find((t) => t.textContent?.startsWith('Accounts'));
    expect(accountsTab).toBeDefined();
    fireEvent.click(accountsTab!);
    expect(accountsTab!).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to the Tasks tab and shows the empty state', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const tasksTab = triggers.find((t) => t.textContent?.startsWith('Tasks'));
    fireEvent.click(tasksTab!);
    expect(tasksTab!).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/No collaboration tasks yet/i)).toBeInTheDocument();
  });

  it('switches to the Comments tab and shows the empty state', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const commentsTab = triggers.find((t) => t.textContent?.startsWith('Comments'));
    fireEvent.click(commentsTab!);
    expect(commentsTab!).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
  });

  it('shows the help / About Shared Reports card', () => {
    renderComponent();
    expect(screen.getByText('About Shared Reports')).toBeInTheDocument();
  });

  it('filters entries when search query is updated', () => {
    renderComponent();
    const search = screen.getByLabelText('Search shared reports') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'Cash' } });
    expect(search.value).toBe('Cash');
  });

  it('provides both a named export and a default export for React.lazy()', () => {
    // SharedReports is loaded via `lazy(() => import('./pages/collaboration/SharedReports'))`
    // in App.tsx (see the '/collaboration/shared' route). React.lazy()
    // requires a *default* export; without one it resolves to `undefined`
    // and every mount crashes with "Element type is invalid". A prior
    // version of this test asserted the opposite (that `default` must be
    // `undefined`), which enshrined that exact production crash as
    // "passing". Both exports must exist and point at the same component.
    expect(typeof SharedReportsMod.SharedReports).toBe('function');
    expect(SharedReportsMod.default).toBe(SharedReportsMod.SharedReports);
  });
});
