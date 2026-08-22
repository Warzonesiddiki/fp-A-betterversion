/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
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
    const skipLinks = screen.getAllByText('Skip to main content');
    expect(skipLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders exactly one skip link, first in tab order before content', () => {
    const { container } = renderWithRouter(<AppLayout />);
    const skipLinks = screen.getAllByText('Skip to main content');
    // Deduped (wave-3 R9): a second skip to #main-nav doubled the pre-content
    // tab stops while the nav already follows immediately in DOM order.
    expect(skipLinks).toHaveLength(1);
    expect(skipLinks[0].getAttribute('href')).toBe('#main-content');
    expect(container.querySelector('a[href="#main-nav"]')).toBeNull();
    // It must be the very first focusable element of the layout, so keyboard
    // users hit exactly one bypass block before the content landmark.
    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBeGreaterThan(0);
    expect(focusable[0]).toBe(skipLinks[0]);
    // ...and the nav landmark itself remains addressable without its own skip.
    expect(container.querySelector('#main-nav')).toBeInTheDocument();
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

  it('renders the financial context bar', () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByRole('region', { name: 'Financial context' })).toBeInTheDocument();
  });

  it('shows the local-workspace truth state in the context bar', () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getAllByText('Local workspace data').length).toBeGreaterThan(0);
  });

  it('shows the W0.8.5 local-only durability banner', () => {
    renderWithRouter(<AppLayout />);
    const banner = screen.getByTestId('durability-banner');
    expect(banner.textContent).toMatch(/local only/i);
    expect(banner.textContent).toMatch(/not a backup/i);
  });

  it('serializes context changes into the URL', () => {
    function UrlProbe() {
      const location = useLocation();
      return <span data-testid="url-probe">{location.search}</span>;
    }
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppLayout />
        <UrlProbe />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('Entity scope'), { target: { value: 'ent-2' } });
    expect(screen.getByTestId('url-probe').textContent).toContain('entity=ent-2');
  });
});
