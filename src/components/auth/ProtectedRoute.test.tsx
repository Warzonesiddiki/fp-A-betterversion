/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, hasMinimumRole, hasAllowedRole } from './ProtectedRoute';
import type { Role, User } from '@/types';

// Mock authStore
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
  hasPermission: vi.fn((user: unknown, _permission: string) => {
    if (!user) return false;
    const u = user as { role: string };
    return u.role === 'Admin';
  }),
  isRole: vi.fn((user: unknown, ...roles: string[]) => {
    if (!user) return false;
    const u = user as { role: string };
    return roles.includes(u.role);
  }),
}));

import { useAuthStore } from '@/store/authStore';
const mockUseAuthStore = vi.mocked(useAuthStore);

function makeUser(role: Role): User {
  return {
    id: 'u1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    role,
    departmentId: 'd1',
    departmentName: 'Finance',
    entityId: 'e1',
    status: 'Active',
    lastLoginAt: '2026-01-01T00:00:00Z',
    mfaEnabled: false,
    permissions: [],
  };
}

function renderWithRouter(ui: React.ReactNode, initialEntries: string[] = ['/protected']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/protected" element={ui} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// Pure function tests

describe('hasMinimumRole', () => {
  it('returns true when candidate equals required role', () => {
    expect(hasMinimumRole('Analyst', 'Analyst')).toBe(true);
  });

  it('returns true when candidate is more privileged than required', () => {
    expect(hasMinimumRole('Admin', 'Viewer')).toBe(true);
  });

  it('returns true for Admin > FP&A_Manager', () => {
    expect(hasMinimumRole('Admin', 'FP&A_Manager')).toBe(true);
  });

  it('returns true for FP&A_Manager > Analyst', () => {
    expect(hasMinimumRole('FP&A_Manager', 'Analyst')).toBe(true);
  });

  it('returns true for Analyst > Department_Head', () => {
    expect(hasMinimumRole('Analyst', 'Department_Head')).toBe(true);
  });

  it('returns true for Department_Head > Viewer', () => {
    expect(hasMinimumRole('Department_Head', 'Viewer')).toBe(true);
  });

  it('returns false when candidate is less privileged', () => {
    expect(hasMinimumRole('Viewer', 'Admin')).toBe(false);
  });

  it('returns false for Viewer vs Analyst', () => {
    expect(hasMinimumRole('Viewer', 'Analyst')).toBe(false);
  });

  it('returns false for unknown candidate role', () => {
    expect(hasMinimumRole('Unknown' as Role, 'Viewer')).toBe(false);
  });
});

describe('hasAllowedRole', () => {
  it('returns false when user is null', () => {
    expect(hasAllowedRole(null)).toBe(false);
  });

  it('returns false when allowedRoles is empty', () => {
    expect(hasAllowedRole(makeUser('Viewer'))).toBe(false);
  });

  it('returns true when user role is in the list', () => {
    expect(hasAllowedRole(makeUser('Admin'), 'Admin', 'Analyst')).toBe(true);
  });

  it('returns false when user role is not in the list', () => {
    expect(hasAllowedRole(makeUser('Viewer'), 'Admin', 'Analyst')).toBe(false);
  });

  it('works with a single-role list', () => {
    expect(hasAllowedRole(makeUser('Admin'), 'Admin')).toBe(true);
    expect(hasAllowedRole(makeUser('Analyst'), 'Admin')).toBe(false);
  });
});

// Component tests

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
    } as ReturnType<typeof useAuthStore>);

    renderWithRouter(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when authenticated with no role restrictions', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Viewer'),
    } as ReturnType<typeof useAuthStore>);

    renderWithRouter(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('renders children when user role is in roles list', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Admin'),
    } as ReturnType<typeof useAuthStore>);

    renderWithRouter(
      <ProtectedRoute roles={['Admin', 'FP&A_Manager']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('shows access denied when user role is not in roles list', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Viewer'),
    } as ReturnType<typeof useAuthStore>);

    renderWithRouter(
      <ProtectedRoute roles={['Admin']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('allows Analyst on Analyst-only route', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Analyst'),
    } as ReturnType<typeof useAuthStore>);

    renderWithRouter(
      <ProtectedRoute roles={['Admin', 'FP&A_Manager', 'Analyst']}>
        <div>Budget Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Budget Page')).toBeInTheDocument();
  });

  it('blocks Viewer from Analyst-only route', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Viewer'),
    } as ReturnType<typeof useAuthStore>);

    renderWithRouter(
      <ProtectedRoute roles={['Admin', 'FP&A_Manager', 'Analyst']}>
        <div>Budget Page</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Budget Page')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it.each<[Role, Role[], boolean]>([
    ['Admin', ['Admin'], true],
    ['Admin', ['Admin', 'FP&A_Manager', 'Analyst', 'Department_Head', 'Viewer'], true],
    ['FP&A_Manager', ['Admin'], false],
    ['FP&A_Manager', ['Admin', 'FP&A_Manager'], true],
    ['Analyst', ['Admin', 'FP&A_Manager'], false],
    ['Analyst', ['Admin', 'FP&A_Manager', 'Analyst'], true],
    ['Department_Head', ['Admin', 'FP&A_Manager', 'Analyst'], false],
    ['Department_Head', ['Admin', 'FP&A_Manager', 'Analyst', 'Department_Head'], true],
    ['Viewer', ['Admin', 'FP&A_Manager', 'Analyst', 'Department_Head', 'Viewer'], true],
    ['Viewer', ['Admin'], false],
  ])('role "%s" with roles %s → %s', (role, roles, shouldRender) => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: makeUser(role),
    } as ReturnType<typeof useAuthStore>);

    renderWithRouter(
      <ProtectedRoute roles={roles}>
        <div>Protected</div>
      </ProtectedRoute>
    );

    if (shouldRender) {
      expect(screen.getByText('Protected')).toBeInTheDocument();
    } else {
      expect(screen.queryByText('Protected')).not.toBeInTheDocument();
    }
  });
});
