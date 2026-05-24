import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('@/store/collaborationStore', () => ({
  useCollaborationStore: vi.fn(() => ({ activityLog: [], comments: [], tasks: [] })),
}));
vi.mock('lucide-react', () => ({
  Activity: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
  Users: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
}));

import { render, screen } from '@/test/testUtils';
import { ActivityFeed } from '@/pages/collaboration/ActivityFeed';

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ActivityFeed />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<ActivityFeed />);
    expect(screen.getByText(/No Activity Feed Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Import GL data to view activity feed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import GL data/i })).toBeInTheDocument();
  });
});
