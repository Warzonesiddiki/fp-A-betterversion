/**
 * Sidebar navigation view-model (UI-03).
 *
 * The manifest itself is verified in src/types/navigation.contract.test.ts;
 * this covers the role filtering applied on top of it, and in particular that
 * filtering never leaves a heading rendered above zero items.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAppNavigation, filterNavItemsByRole } from './useAppNavigation';

let mockRole = 'Viewer';

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ user: { role: mockRole } })
  ),
  ROLE_PERMISSIONS: {
    Admin: ['budget:read', 'report:read', 'gl:read', 'settings:read', 'user:read'],
    Viewer: ['report:read'],
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/dashboard']}>{children}</MemoryRouter>;
}

describe('filterNavItemsByRole', () => {
  it('keeps permissionless items and drops ungranted ones', () => {
    const items = [
      { path: '/a', permission: 'budget:read' },
      { path: '/b' },
      { path: '/c', permission: 'report:read' },
    ];
    expect(filterNavItemsByRole(items, 'Viewer').map((i) => i.path)).toEqual(['/b', '/c']);
    expect(filterNavItemsByRole(items, 'Admin').map((i) => i.path)).toEqual(['/a', '/b', '/c']);
  });

  it('treats an unknown role as holding no permissions', () => {
    const items = [{ path: '/a', permission: 'budget:read' }, { path: '/b' }];
    expect(filterNavItemsByRole(items, 'Nonexistent').map((i) => i.path)).toEqual(['/b']);
  });
});

describe('useAppNavigation', () => {
  beforeEach(() => {
    mockRole = 'Admin';
  });

  it('never returns an empty section or an empty group', () => {
    mockRole = 'Viewer';
    const { result } = renderHook(() => useAppNavigation(), { wrapper });

    for (const section of result.current.sections) {
      expect(section.groups.length, section.label).toBeGreaterThan(0);
      for (const group of section.groups) {
        expect(group.items.length, `${section.label} / ${group.label}`).toBeGreaterThan(0);
      }
    }
  });

  it('hides alias entries from the rail', () => {
    const { result } = renderHook(() => useAppNavigation(), { wrapper });
    const paths = result.current.sections
      .flatMap((s) => s.groups.flatMap((g) => g.items))
      .map((i) => i.path);

    // "/" is an alias of "/dashboard"; both are routes, one belongs in the rail.
    expect(paths).not.toContain('/');
    expect(paths).toContain('/dashboard');
  });

  it('shows a restricted role strictly fewer destinations', () => {
    const { result: admin } = renderHook(() => useAppNavigation(), { wrapper });
    const adminCount = admin.current.sections.flatMap((s) =>
      s.groups.flatMap((g) => g.items)
    ).length;

    mockRole = 'Viewer';
    const { result: viewer } = renderHook(() => useAppNavigation(), { wrapper });
    const viewerCount = viewer.current.sections.flatMap((s) =>
      s.groups.flatMap((g) => g.items)
    ).length;

    expect(viewerCount).toBeLessThan(adminCount);
    expect(viewerCount).toBeGreaterThan(0);
  });

  it('reports the section owning the current route', () => {
    const { result } = renderHook(() => useAppNavigation(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={['/data/gl-journals']}>{children}</MemoryRouter>
      ),
    });
    expect(result.current.activeSectionId).toBe('accounting');
  });
});
