import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('@/hooks/usePresence', () => ({
  useResourcePresence: vi.fn(() => []),
}));

import { PresenceIndicator } from '@/components/collaboration/PresenceIndicator';
import { useResourcePresence } from '@/hooks/usePresence';

const mockUseResourcePresence = vi.mocked(useResourcePresence);

const mockViewers = [
  {
    userId: 'u1',
    userName: 'Alice',
    userInitials: 'A',
    status: 'online' as const,
    avatarUrl: null,
    cursorColor: '#3b82f6',
    activeCellId: null,
    activeResourceType: null,
    activeResourceId: null,
    lastSeenAt: '2026-05-20T00:00:00Z',
  },
  {
    userId: 'u2',
    userName: 'Bob',
    userInitials: 'B',
    status: 'idle' as const,
    avatarUrl: null,
    cursorColor: '#ef4444',
    activeCellId: null,
    activeResourceType: null,
    activeResourceId: null,
    lastSeenAt: '2026-05-20T00:00:00Z',
  },
];

describe('PresenceIndicator (collaboration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseResourcePresence.mockReturnValue([]);
  });

  it('renders without crashing with no viewers', () => {
    const { container } = render(<PresenceIndicator resourceType="budget" resourceId="b1" />);
    expect(container).toBeTruthy();
  });

  it('renders nothing when no viewers', () => {
    const { container } = render(<PresenceIndicator resourceType="budget" resourceId="b1" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders avatars when viewers are present', () => {
    mockUseResourcePresence.mockReturnValue(mockViewers);
    render(<PresenceIndicator resourceType="budget" resourceId="b1" />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders role=status with correct aria-label', () => {
    mockUseResourcePresence.mockReturnValue(mockViewers);
    render(<PresenceIndicator resourceType="budget" resourceId="b1" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', '2 users viewing this resource');
  });

  it('shows overflow count when viewers exceed maxVisible', () => {
    const manyViewers = Array.from({ length: 7 }, (_, i) => ({
      userId: `u${i}`,
      userName: `User${i}`,
      userInitials: `U${i}`,
      status: 'online' as const,
      avatarUrl: null,
      cursorColor: '#3b82f6',
      activeCellId: null,
      activeResourceType: null,
      activeResourceId: null,
      lastSeenAt: '2026-05-20T00:00:00Z',
    }));
    mockUseResourcePresence.mockReturnValue(manyViewers);
    render(<PresenceIndicator resourceType="budget" resourceId="b1" maxVisible={5} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
