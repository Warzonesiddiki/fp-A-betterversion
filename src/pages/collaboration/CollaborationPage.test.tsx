import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/collaborationStore', () => ({
  useCollaborationStore: vi.fn(() => ({
    comments: [],
    tasks: [],
    activityLog: [],
    addComment: vi.fn(),
    addTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    addActivity: vi.fn(),
  })),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (
    selector?: (s: { user: { id: string; name: string; email: string } | null }) => unknown
  ) => {
    const state = { user: { id: '1', name: 'Test User', email: 'test@test.com' } };
    return selector ? selector(state) : state;
  },
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
    MessageSquare: makeIcon(),
    Plus: makeIcon(),
    Send: makeIcon(),
    Users: makeIcon(),
    FileText: makeIcon(),
    Clock: makeIcon(),
    Activity: makeIcon(),
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    Search: makeIcon(),
    Filter: makeIcon(),
    MoreHorizontal: makeIcon(),
    ChevronLeft: makeIcon(),
    ChevronRight: makeIcon(),
  };
});

import CollaborationPage from '@/pages/collaboration/CollaborationPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/collaboration']}>
      <CollaborationPage />
    </MemoryRouter>
  );
}

describe('CollaborationPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays Collaboration heading', () => {
    renderPage();
    expect(screen.getByText('Collaboration Hub')).toBeTruthy();
  });
});
