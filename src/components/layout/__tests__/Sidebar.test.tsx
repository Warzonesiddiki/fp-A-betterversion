import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { Sidebar } from '../Sidebar';

vi.mock('lucide-react', () => {
  const makeIcon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
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
  }),
}));
vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
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
    expect(screen.getByText('Main')).toBeTruthy();
    expect(screen.getByText('Analysis')).toBeTruthy();
    expect(screen.getByText('Management')).toBeTruthy();
  });
});
