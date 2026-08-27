/**
 * @vitest-environment jsdom
 *
 * Sidebar behaviour (UI-03). The rail is the only way through 190 screens, so
 * the accordion, the active-route pill and the Quick Search wiring are all
 * asserted here. Quick Search was a no-op `onClick={() => {}}` before UI-03.
 * W-A11Y-002 M1 additionally pins that every control surviving in the
 * collapsed icon rail keeps exactly one accessible name.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const mockToggleSidebar = vi.fn();
const mockCloseMobileSidebar = vi.fn();
const mockToggleTheme = vi.fn();
const mockToggleCommandPalette = vi.fn();

let mockSidebarCollapsed = false;
let mockMobileSidebarOpen = false;
let mockTheme = 'dark';
let mockActiveSectionId: string | undefined = 'planning';

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
    toggleCommandPalette: mockToggleCommandPalette,
  })),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme,
  })),
}));

const icon = () => null;

vi.mock('@/hooks/useAppNavigation', () => ({
  useAppNavigation: vi.fn(() => ({
    sections: [
      {
        id: 'planning',
        label: 'Planning',
        icon,
        groups: [
          {
            label: 'Budgets',
            items: [
              { path: '/budgets', label: 'Budgets' },
              { path: '/budgets/create', label: 'Create Budget' },
            ],
          },
        ],
      },
      {
        id: 'admin',
        label: 'Admin',
        icon,
        groups: [{ label: null, items: [{ path: '/settings', label: 'Settings' }] }],
      },
    ],
    activeSectionId: mockActiveSectionId,
    role: 'Admin',
  })),
}));

function renderSidebar(initialPath = '/budgets') {
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
    mockActiveSectionId = 'planning';
  });

  it('displays the app brand name', () => {
    renderSidebar();
    expect(screen.getByText('app.name')).toBeInTheDocument();
  });

  it('renders every section heading', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /Planning/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Admin/ })).toBeInTheDocument();
  });

  it('opens only the section owning the current route', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /Planning/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: /Admin/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Budgets', { selector: '.fp-nav-item__label' })).toBeInTheDocument();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('renders the sub-group heading above its items', () => {
    renderSidebar();
    expect(screen.getByText('Budgets', { selector: '.fp-nav-group__label' })).toBeInTheDocument();
  });

  it('expands a section on click and collapses the previously open one', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: /Admin/ }));

    expect(screen.getByText('Settings')).toBeInTheDocument();
    // Accordion: opening Admin closes Planning rather than stacking both.
    expect(screen.queryByText('Create Budget')).toBeNull();
  });

  it('collapses an open section when its own heading is clicked again', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: /Planning/ }));
    expect(screen.queryByText('Create Budget')).toBeNull();
  });

  it('marks the active route with aria-current="page"', () => {
    renderSidebar('/budgets');
    const active = screen.getByText('Budgets', { selector: '.fp-nav-item__label' }).closest('a');
    expect(active).not.toBeNull();
    expect(active!.getAttribute('aria-current')).toBe('page');

    const sibling = screen.getByText('Create Budget').closest('a');
    expect(sibling!.getAttribute('aria-current')).toBeNull();
  });

  it('opens the command palette from Quick Search', () => {
    renderSidebar();
    fireEvent.click(screen.getByLabelText('sidebar.quickSearch'));
    expect(mockToggleCommandPalette).toHaveBeenCalledTimes(1);
  });

  it('renders theme toggle and help entries', () => {
    renderSidebar();
    expect(screen.getByLabelText('sidebar.lightMode')).toBeInTheDocument();
    expect(screen.getByText('nav.help')).toBeInTheDocument();
  });

  it('hides labels and section contents when collapsed', () => {
    mockSidebarCollapsed = true;
    renderSidebar();
    expect(screen.queryByText('app.name')).toBeNull();
    expect(screen.queryByText('Create Budget')).toBeNull();
  });

  it('expands the rail when a section is picked while collapsed', () => {
    mockSidebarCollapsed = true;
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: /Admin/ }));
    // Nowhere to render items in a 64px rail, so it must widen instead.
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('closes the mobile sidebar on navigation', () => {
    mockMobileSidebarOpen = true;
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

    renderSidebar();
    fireEvent.click(screen.getByText('Create Budget'));
    expect(mockCloseMobileSidebar).toHaveBeenCalled();

    Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
  });

  it('does not close the mobile sidebar on a desktop viewport', () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });

    renderSidebar();
    fireEvent.click(screen.getByText('Create Budget'));
    expect(mockCloseMobileSidebar).not.toHaveBeenCalled();

    Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
  });
});

describe('Sidebar collapsed rail names (W-A11Y-002 M1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSidebarCollapsed = true;
    mockMobileSidebarOpen = false;
    mockTheme = 'dark';
    mockActiveSectionId = 'planning';
  });

  it('exposes an accessible name for every control left in the collapsed rail', () => {
    renderSidebar();

    // Section triggers keep their names although their visible labels are gone.
    expect(screen.getByRole('button', { name: 'Planning' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument();
    // The footer Help entry renders icon-only while railed — it must stay named.
    expect(screen.getByRole('link', { name: 'nav.help' })).toBeInTheDocument();
    // Sub-items intentionally do not render inside the 64px rail, so exactly
    // one link survives; whatever links exist must all be named.
    expect(screen.getAllByRole('link')).toHaveLength(1);
    // Utility controls were already aria-labelled; pin them so a refactor
    // cannot silently strip the names.
    expect(screen.getByRole('button', { name: 'sidebar.quickSearch' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sidebar.lightMode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'accessibility.expand' })).toBeInTheDocument();
  });

  it('carries each rail name exactly once, with title only as a supplement', () => {
    renderSidebar();

    // Exact-string name matching is the double-announcement guard: a stacked
    // duplicate carrier would compute "Planning Planning" or
    // "nav.help nav.help" and fail these lookups.
    const planning = screen.getByRole('button', { name: 'Planning' });
    expect(planning).not.toHaveAttribute('aria-label');
    expect(planning).toHaveTextContent('Planning');
    expect(planning).toHaveAttribute('title', 'Planning');

    const help = screen.getByRole('link', { name: 'nav.help' });
    expect(help).not.toHaveAttribute('aria-label');
    expect(help).toHaveTextContent('nav.help');
    expect(help).toHaveAttribute('title', 'nav.help');
  });

  it('keeps expanded-rail naming unchanged', () => {
    mockSidebarCollapsed = false;
    renderSidebar();

    // Help link shows its real text node again — no sr-only fallback needed.
    const help = screen.getByRole('link', { name: 'nav.help' });
    expect(help.querySelector('.sr-only')).toBeNull();
    expect(help).toHaveAttribute('title', 'nav.help');

    // Section triggers render their visible label carrier as before.
    const planning = screen.getByRole('button', { name: 'Planning' });
    expect(planning.querySelector('.fp-nav-section__label')).not.toBeNull();
    expect(planning).toHaveAttribute('title', 'Planning');

    // Expanded sub-navigation is untouched.
    expect(screen.getByRole('link', { name: 'Create Budget' })).toBeInTheDocument();
  });
});
