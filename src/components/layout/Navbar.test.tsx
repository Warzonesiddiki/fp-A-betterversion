/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/store/authStore', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({
      user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      activeEntityId: 'ent-1',
      switchEntity: vi.fn(),
      logout: vi.fn(),
    })),
    { getState: vi.fn(() => ({ logout: vi.fn() })) }
  ),
}));

vi.mock('@/store/notificationStore', () => ({
  useNotificationStore: vi.fn(() => ({
    notifications: [{ id: '1', title: 'Test', message: 'Test notification', isRead: false }],
    unreadCount: 1,
  })),
}));

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    openMobileSidebar: vi.fn(),
  })),
}));

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderNavbar();
  });

  it('displays the active entity name', () => {
    renderNavbar();
    expect(screen.getByText('US Parent')).toBeInTheDocument();
  });

  it('renders search button', () => {
    renderNavbar();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  it('renders create new button', () => {
    renderNavbar();
    expect(screen.getByLabelText('Create new')).toBeInTheDocument();
  });

  it('renders notifications button with unread count', () => {
    renderNavbar();
    const btn = screen.getByLabelText(/Notifications/);
    expect(btn).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders user menu button', () => {
    renderNavbar();
    expect(screen.getByLabelText('User menu')).toBeInTheDocument();
  });

  it('displays user initials in avatar', () => {
    renderNavbar();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('opens entity menu on click', () => {
    renderNavbar();
    const entityBtn = screen.getByLabelText('Select entity');
    fireEvent.click(entityBtn);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('UK Subsidiary')).toBeInTheDocument();
    expect(screen.getByText('DE Subsidiary')).toBeInTheDocument();
  });

  it('closes entity menu on Escape key', () => {
    renderNavbar();
    const entityBtn = screen.getByLabelText('Select entity');
    fireEvent.click(entityBtn);
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens create menu on click', () => {
    renderNavbar();
    const createBtn = screen.getByLabelText('Create new');
    fireEvent.click(createBtn);
    expect(screen.getByText('New Budget')).toBeInTheDocument();
    expect(screen.getByText('New Forecast')).toBeInTheDocument();
    expect(screen.getByText('Upload GL Data')).toBeInTheDocument();
  });

  it('opens notifications menu on click', () => {
    renderNavbar();
    const notifBtn = screen.getByLabelText(/Notifications/);
    fireEvent.click(notifBtn);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('opens user menu on click', () => {
    renderNavbar();
    const userBtn = screen.getByLabelText('User menu');
    fireEvent.click(userBtn);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('navigates to help on search click', () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText('Search'));
    expect(mockNavigate).toHaveBeenCalledWith('/help');
  });

  it('shows zero badge when no unread notifications', async () => {
    const { useNotificationStore } = await import('@/store/notificationStore');
    (useNotificationStore as ReturnType<typeof vi.fn>).mockReturnValue({
      notifications: [],
      unreadCount: 0,
    });
    renderNavbar();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders hamburger menu button on mobile', () => {
    renderNavbar();
    expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
  });
});
