import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    users: [],
    addUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  })),
}));

vi.mock('@/engines/SessionEngine', () => ({
  SessionEngine: {},
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
    Users: makeIcon(),
    UserPlus: makeIcon(),
    Shield: makeIcon(),
    Mail: makeIcon(),
    Clock: makeIcon(),
    Trash2: makeIcon(),
    Edit2: makeIcon(),
    X: makeIcon(),
  };
});

import UserManagementPage from '@/pages/settings/UserManagementPage';

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<UserManagementPage />);
    expect(screen.getByText(/User/i)).toBeTruthy();
  });
});
