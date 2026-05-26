/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const mockCloseMobileSidebar = vi.fn();
let mockMobileSidebarOpen = false;

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    mobileSidebarOpen: mockMobileSidebarOpen,
    closeMobileSidebar: mockCloseMobileSidebar,
  })),
}));

vi.mock('@/hooks/useFocusManagement', () => ({
  useFocusManagement: vi.fn(() => ({
    mainContentRef: { current: null },
  })),
}));

vi.mock('@/utils/localeFormatting', () => ({
  getLocaleDirection: vi.fn(() => 'ltr'),
}));

vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('./Navbar', () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock('@/components/ui/ToastContainer', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMobileSidebarOpen = false;
  });

  it('renders without crashing', () => {
    renderWithRouter(<AppLayout />);
  });

  it('renders the sidebar', () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders the navbar', () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('renders the toast container', () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('renders skip to main content link', () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders skip to navigation link', () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
  });

  it('has a main content area with proper role', () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('has main content with aria-label', () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByLabelText('Main content')).toBeInTheDocument();
  });

  it('has main-nav landmark with aria-label', () => {
    const { container } = renderWithRouter(<AppLayout />);
    const nav = container.querySelector('#main-nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
  });

  it('renders mobile overlay when mobileSidebarOpen is true', () => {
    mockMobileSidebarOpen = true;
    const { container } = renderWithRouter(<AppLayout />);
    const overlay = container.querySelector('.fixed.inset-0.z-40');
    expect(overlay).toBeInTheDocument();
  });

  it('does not render mobile overlay when mobileSidebarOpen is false', () => {
    const { container } = renderWithRouter(<AppLayout />);
    const overlay = container.querySelector('.fixed.inset-0.z-40');
    expect(overlay).not.toBeInTheDocument();
  });

  it('calls closeMobileSidebar when overlay is clicked', () => {
    mockMobileSidebarOpen = true;
    const { container } = renderWithRouter(<AppLayout />);
    const overlay = container.querySelector('.fixed.inset-0.z-40');
    if (overlay) fireEvent.click(overlay);
    expect(mockCloseMobileSidebar).toHaveBeenCalledTimes(1);
  });

  it('sets dir attribute based on locale', () => {
    const { container } = renderWithRouter(<AppLayout />);
    const root = container.querySelector('.responsive-root');
    expect(root?.getAttribute('dir')).toBe('ltr');
  });
});
