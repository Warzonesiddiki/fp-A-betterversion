import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    organization: {
      name: 'Test Org',
      fiscalYear: 2026,
      fiscalYearStart: '2026-01-01',
      calendarType: 'Standard',
      baseCurrency: 'USD',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      decimalPlaces: 2,
    },
    users: [],
    roles: [],
    preferences: { activeSector: 'technology' },
    isLoading: false,
    updateOrganization: vi.fn(),
    updatePreferences: vi.fn(),
    addUser: vi.fn(),
    updateUser: vi.fn(),
    removeUser: vi.fn(),
  })),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: {
      id: 'u1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'd1',
      departmentName: 'Finance',
      entityId: 'e1',
      status: 'Active',
      lastLoginAt: '2026-01-01T00:00:00Z',
      mfaEnabled: false,
      permissions: [],
    },
    accessToken: 'mock-token',
    refreshToken: null,
    isAuthenticated: true,
    isLoading: false,
    mfaRequired: false,
    activeEntityId: 'e1',
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock('@/utils/backupRestore', () => ({
  BackupRestore: {
    exportBackup: vi.fn(),
    importBackup: vi.fn(),
  },
}));

vi.mock('@radix-ui/react-tabs', () => {
  const Root = ({
    children,
    ...props
  }: Record<string, unknown> & { children: React.ReactNode }) => (
    <div data-testid="tabs-root" {...props}>
      {children}
    </div>
  );
  const List = ({
    children,
    ...props
  }: Record<string, unknown> & { children: React.ReactNode }) => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  );
  const Trigger = ({
    children,
    value,
    ...props
  }: Record<string, unknown> & { children: React.ReactNode; value: string }) => (
    <button data-testid={`tab-trigger-${value}`} {...props}>
      {children}
    </button>
  );
  const Content = ({
    children,
    value,
    ...props
  }: Record<string, unknown> & { children: React.ReactNode; value: string }) => (
    <div data-testid={`tab-content-${value}`} {...props}>
      {children}
    </div>
  );
  return { Root, List, Trigger, Content };
});

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Building2: makeIcon(),
    UserCog: makeIcon(),
    Database: makeIcon(),
    Settings2: makeIcon(),
    Download: makeIcon(),
    Upload: makeIcon(),
    Trash2: makeIcon(),
    ShieldCheck: makeIcon(),
    Plug: makeIcon(),
  };
});

import SettingsPage from '@/pages/settings/SettingsPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SettingsPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing for admin user', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays the settings heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument();
  });
});
