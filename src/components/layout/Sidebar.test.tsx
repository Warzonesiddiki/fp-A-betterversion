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

  it('displays FP logo', () => {
    renderSidebar();
    const logos = screen.getAllByText('FP');
    expect(logos.length).toBeGreaterThan(0);
  });

  it('renders quick search button', () => {
    renderSidebar();
    expect(screen.getByLabelText('sidebar.quickSearch')).toBeInTheDocument();
  });

  it('renders quick search text when not collapsed', () => {
    renderSidebar();
    expect(screen.getByText('sidebar.quickSearch')).toBeInTheDocument();
  });

  it('renders all navigation sections', () => {
    renderSidebar();
    expect(screen.getByText('sidebar.sections.main')).toBeInTheDocument();
    expect(screen.getByText('sidebar.sections.analysis')).toBeInTheDocument();
    expect(screen.getByText('sidebar.sections.management')).toBeInTheDocument();
  });

  it('renders all main nav items', () => {
    renderSidebar();
    expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    expect(screen.getByText('nav.budgets')).toBeInTheDocument();
    expect(screen.getByText('nav.forecasts')).toBeInTheDocument();
    expect(screen.getByText('nav.reports')).toBeInTheDocument();
    expect(screen.getByText('nav.analytics')).toBeInTheDocument();
  });

  it('renders analysis nav items', () => {
    renderSidebar();
    expect(screen.getByText('nav.variance')).toBeInTheDocument();
    expect(screen.getByText('nav.scenarios')).toBeInTheDocument();
    expect(screen.getByText('nav.aiAnalyst')).toBeInTheDocument();
  });

  it('renders management nav items', () => {
    renderSidebar();
    expect(screen.getByText('nav.dataManagement')).toBeInTheDocument();
    expect(screen.getByText('nav.collaboration')).toBeInTheDocument();
    expect(screen.getByText('nav.approvals')).toBeInTheDocument();
  });

  it('renders Settings and Help links', () => {
    renderSidebar();
    expect(screen.getByText('nav.settings')).toBeInTheDocument();
    expect(screen.getByText('nav.help')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    renderSidebar();
    expect(screen.getByLabelText('sidebar.lightMode')).toBeInTheDocument();
  });

  it('calls toggleTheme when theme button is clicked', () => {
    renderSidebar();
    fireEvent.click(screen.getByLabelText('sidebar.lightMode'));
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('renders collapse button on desktop', () => {
    renderSidebar();
    expect(screen.getByLabelText('sidebar.collapse')).toBeInTheDocument();
  });

  it('calls toggleSidebar when collapse button is clicked', () => {
    renderSidebar();
    fireEvent.click(screen.getByLabelText('sidebar.collapse'));
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('hides labels when sidebar is collapsed', () => {
    mockSidebarCollapsed = true;
    renderSidebar();
    expect(screen.queryByText('nav.dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('app.name')).not.toBeInTheDocument();
    expect(screen.queryByText('sidebar.quickSearch')).not.toBeInTheDocument();
  });

  it('shows expand button when collapsed', () => {
    mockSidebarCollapsed = true;
    renderSidebar();
    expect(screen.getByLabelText('accessibility.expand')).toBeInTheDocument();
  });

  it('renders close button for mobile', () => {
    renderSidebar();
    expect(screen.getByLabelText('accessibility.menuClose')).toBeInTheDocument();
  });

  it('calls closeMobileSidebar when close button is clicked', () => {
    renderSidebar();
    fireEvent.click(screen.getByLabelText('accessibility.menuClose'));
    expect(mockCloseMobileSidebar).toHaveBeenCalledTimes(1);
  });

  it('shows dark mode toggle when theme is light', () => {
    mockTheme = 'light';
    renderSidebar();
    expect(screen.getByText('sidebar.darkMode')).toBeInTheDocument();
    expect(screen.getByLabelText('sidebar.darkMode')).toBeInTheDocument();
  });

  it('shows light mode toggle when theme is dark', () => {
    mockTheme = 'dark';
    renderSidebar();
    expect(screen.getByText('sidebar.lightMode')).toBeInTheDocument();
    expect(screen.getByLabelText('sidebar.lightMode')).toBeInTheDocument();
  });
});

/**
 * Regression for F-0023: production bundle crashed with
 * `ReferenceError: BookOpen is not defined` on every authenticated route
 * because the icon was used but never imported.
 * These tests fail if ANY icon referenced by the Sidebar is undefined.
 */
describe('Sidebar icon integrity (F-0023 regression)', () => {
  it('renders the API Reference nav link with a defined icon (was BookOpen ReferenceError)', () => {
    renderSidebar();
    const apiLink = screen.getByText('API Reference');
    expect(apiLink).toBeInTheDocument();
    // The icon renders as an <svg> sibling inside the same NavLink.
    const navLink = apiLink.closest('a');
    expect(navLink).not.toBeNull();
    expect(navLink!.querySelector('svg')).not.toBeNull();
  });

  it('every rendered nav link icon resolves to a real SVG element', () => {
    const { container } = renderSidebar();
    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
    for (const link of Array.from(links)) {
      // Every nav link must contain exactly one lucide <svg> icon.
      expect(link.querySelectorAll('svg').length).toBeGreaterThanOrEqual(1);
    }
  });
});
