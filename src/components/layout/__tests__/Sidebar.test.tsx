import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { Sidebar } from '../Sidebar';

vi.mock(import('lucide-react'), async (importOriginal) => {
  const actual = await importOriginal();
  const makeIcon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    ...actual,
    LayoutDashboard: makeIcon('LayoutDashboard'),
    FileBarChart: makeIcon('FileBarChart'),
    TrendingUp: makeIcon('TrendingUp'),
    BarChart3: makeIcon('BarChart3'),
    PieChart: makeIcon('PieChart'),
    GitCompareArrows: makeIcon('GitCompareArrows'),
    FlaskConical: makeIcon('FlaskConical'),
    Brain: makeIcon('Brain'),
    Database: makeIcon('Database'),
    MessageSquare: makeIcon('MessageSquare'),
    CheckSquare: makeIcon('CheckSquare'),
    Settings: makeIcon('Settings'),
    HelpCircle: makeIcon('HelpCircle'),
    ChevronLeft: makeIcon('ChevronLeft'),
    ChevronRight: makeIcon('ChevronRight'),
    ChevronDown: makeIcon('ChevronDown'),
    Search: makeIcon('Search'),
    X: makeIcon('X'),
  };
});
vi.mock('@/store/uiStore', () => ({
  useUIStore: () => ({
    sidebarCollapsed: false,
    toggleSidebar: vi.fn(),
    mobileSidebarOpen: false,
    closeMobileSidebar: vi.fn(),
    toggleCommandPalette: vi.fn(),
  }),
}));
vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));
vi.mock('@/hooks/useAppNavigation', () => ({
  useAppNavigation: () => ({
    sections: [
      {
        id: 'home',
        label: 'Home',
        icon: () => null,
        groups: [{ label: null, items: [{ path: '/dashboard', label: 'Dashboard' }] }],
      },
      {
        id: 'admin',
        label: 'Admin',
        icon: () => null,
        groups: [{ label: null, items: [{ path: '/settings', label: 'Settings' }] }],
      },
    ],
    activeSectionId: 'home',
    role: 'Admin',
  }),
}));

describe('Sidebar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('FinPlan Pro')).toBeTruthy();
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  it('renders section headers', () => {
    render(<Sidebar />);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Admin')).toBeTruthy();
  });
});
