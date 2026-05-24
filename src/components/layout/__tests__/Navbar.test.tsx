import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import Navbar from '../Navbar';

vi.mock('lucide-react', () => {
  const makeIcon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    Search: makeIcon('Search'),
    Bell: makeIcon('Bell'),
    Plus: makeIcon('Plus'),
    ChevronDown: makeIcon('ChevronDown'),
    User: makeIcon('User'),
    Settings: makeIcon('Settings'),
    HelpCircle: makeIcon('HelpCircle'),
    LogOut: makeIcon('LogOut'),
    TrendingUp: makeIcon('TrendingUp'),
    FileBarChart: makeIcon('FileBarChart'),
    Upload: makeIcon('Upload'),
    Menu: makeIcon('Menu'),
  };
});
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { firstName: 'John', lastName: 'Doe', email: 'john@acme.com' },
    activeEntityId: 'ent-1',
    switchEntity: vi.fn(),
  }),
}));
vi.mock('@/store/notificationStore', () => ({
  useNotificationStore: () => ({ notifications: [], unreadCount: 0 }),
}));
vi.mock('@/store/uiStore', () => ({
  useUIStore: () => ({ openMobileSidebar: vi.fn() }),
}));

describe('Navbar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders entity selector', () => {
    render(<Navbar />);
    expect(screen.getByLabelText('Select entity')).toBeTruthy();
  });

  it('renders user avatar', () => {
    render(<Navbar />);
    expect(screen.getByLabelText('User menu')).toBeTruthy();
  });
});
