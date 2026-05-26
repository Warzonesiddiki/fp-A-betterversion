import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import AppLayout from '../AppLayout';

vi.mock('../Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../Navbar', () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock('@/components/ui/ToastContainer', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
}));
vi.mock('@/components/ui/CommandPalette', () => ({
  CommandPalette: () => <div data-testid="command-palette" />,
}));
vi.mock('@/hooks/useFocusManagement', () => ({
  useFocusManagement: () => ({ mainContentRef: { current: null } }),
}));
vi.mock('@/hooks/useKeyboardShortcuts', () => ({ useKeyboardShortcuts: () => {} }));
vi.mock('@/store/uiStore', () => ({
  useUIStore: () => ({
    mobileSidebarOpen: false,
    closeMobileSidebar: vi.fn(),
    commandPaletteOpen: false,
    toggleCommandPalette: vi.fn(),
  }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en', dir: () => 'ltr' } }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }: { children: React.ReactNode }) => children,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/utils/localeFormatting', () => ({ getLocaleDirection: () => 'ltr' }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, Outlet: () => <div data-testid="outlet" /> };
});

describe('AppLayout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders layout shell', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('sidebar')).toBeTruthy();
    expect(screen.getByTestId('navbar')).toBeTruthy();
    expect(screen.getByTestId('outlet')).toBeTruthy();
  });
});
