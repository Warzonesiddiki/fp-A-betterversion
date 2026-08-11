import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePillarNavigation, filterNavItemsByRole } from './usePillarNavigation';

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ user: { role: mockRole } })
  ),
  ROLE_PERMISSIONS: {
    Admin: ['budget:read', 'report:read', 'gl:read'],
    Viewer: ['report:read'],
  },
}));

let mockRole = 'Viewer';

describe('usePillarNavigation', () => {
  beforeEach(() => {
    mockRole = 'Viewer';
  });

  it('filters pillar items by the active role', () => {
    const items = [
      { path: '/a', label: 'A', icon: undefined, permission: 'budget:read' },
      { path: '/b', label: 'B', icon: undefined },
      { path: '/c', label: 'C', icon: undefined, permission: 'report:read' },
    ];
    expect(filterNavItemsByRole(items, 'Viewer').map((i) => i.path)).toEqual(['/b', '/c']);
    expect(filterNavItemsByRole(items, 'Admin').map((i) => i.path)).toEqual(['/a', '/b', '/c']);
  });

  it('returns pillars with items filtered by role', () => {
    const { result } = renderHook(() => usePillarNavigation());
    const workspace = result.current.pillars.find((p) => p.id === 'workspace');
    // Viewer lacks budget:read, so Budgets/BVA/Forecasts are hidden; Dashboard
    // has no permission key in the fixture matrix only if granted — here
    // dashboard:read is not granted, so only permissionless items remain.
    expect(workspace).toBeDefined();
    expect(workspace!.items.length).toBe(0);
    const reporting = result.current.pillars.find((p) => p.id === 'reporting');
    expect(reporting!.items.map((i) => i.path)).toEqual(['/reports']);
  });

  it('exposes legacy items unmodified', () => {
    const { result } = renderHook(() => usePillarNavigation());
    expect(result.current.legacyItems.length).toBeGreaterThan(0);
  });
});
