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

vi.mock(import('lucide-react'), async (importOriginal) => {
  const actual = await importOriginal();
  const Icon = (props: { className?: string; [key: string]: unknown }) => (
    <span data-testid="mock-icon" {...props} />
  );
  Icon.displayName = 'MockIcon';
  return {
    ...actual,
    default: Icon,
    Users: Icon,
    UserPlus: Icon,
    Shield: Icon,
    Mail: Icon,
    Clock: Icon,
    Trash2: Icon,
    Edit2: Icon,
    X: Icon,
    ChevronUp: Icon,
    ChevronDown: Icon,
  };
});

import UserManagementPage from '@/pages/settings/UserManagementPage';

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<UserManagementPage />);
    expect(screen.getAllByText(/user/i).length).toBeGreaterThan(0);
  });
});
