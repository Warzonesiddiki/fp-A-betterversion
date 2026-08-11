/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const mockToggleSidebar = vi.fn();
const mockCloseMobileSidebar = vi.fn();
const mockToggleTheme = vi.fn();

let mockSidebarCollapsed = false;
let mockMobileSidebarOpen = false;
let mockTheme = 'dark';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    sidebarCollapsed: mockSidebarCollapsed,
    toggleSidebar: mockToggleSidebar,
    mobileSidebarOpen: mockMobileSidebarOpen,
    closeMobileSidebar: mockCloseMobileSidebar,
  })),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme,
  })),
}));

vi.mock('@/hooks/usePillarNavigation', () => ({
  usePillarNavigation: vi.fn(() => ({
    pillars: [
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { path: '/dashboard', label: 'Dashboard', icon: () => null },
          { path: '/budgets', label: 'Budgets', icon: () => null },
        ],
      },
      {
        id: 'admin',
        label: 'Admin',
        items: [{ path: '/settings', label: 'Settings', icon: () => null }],
      },
    ],
    legacyItems: [{ path: '/saas/arr', label: 'SaaS', icon: () => null }],
    role: 'Admin',
  })),
}));

function renderSidebar(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSidebarCollapsed = false;
    mockMobileSidebarOpen = false;
    mockTheme = 'dark';
  });

  it('renders without crashing', () => {
    renderSidebar();
  });

  it('displays the app brand name', () => {
    renderSidebar();
    expect(screen.getByText('app.name')).toBeInTheDocument();
  });

  it('renders quick search button', () => {
    renderSidebar();
    expect(screen.getByLabelText('sidebar.quickSearch')).toBeInTheDocument();
  });

  it('renders the five-pillar navigation sections', () => {
    renderSidebar();
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders pillar nav items', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Budgets')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders the legacy modules group explicitly labeled', () => {
    renderSidebar();
    expect(screen.getByText('Legacy modules')).toBeInTheDocument();
    expect(screen.getByText('SaaS')).toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', () => {
    renderSidebar('/budgets');
    const budgets = screen.getByText('Budgets').closest('a');
    expect(budgets).not.toBeNull();
    expect(budgets!.getAttribute('aria-current')).toBe('page');
    const dashboard = screen.getByText('Dashboard').closest('a');
    expect(dashboard!.getAttribute('aria-current')).toBeNull();
  });

  it('renders theme toggle button', () => {
    renderSidebar();
    expect(screen.getByLabelText('sidebar.lightMode')).toBeInTheDocument();
  });

  it('renders Settings and Help links', () => {
    renderSidebar();
    expect(screen.getByText('nav.help')).toBeInTheDocument();
  });

  it('collapses to icon-only width when collapsed', () => {
    mockSidebarCollapsed = true;
    renderSidebar();
    expect(screen.queryByText('Workspace')).toBeNull();
    expect(screen.queryByText('Dashboard')).toBeNull();
  });

  it('closes the mobile sidebar on navigation', () => {
    mockMobileSidebarOpen = true;
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
    renderSidebar();
    fireEvent.click(screen.getByText('Budgets'));
    expect(mockCloseMobileSidebar).toHaveBeenCalled();
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
  });
});
