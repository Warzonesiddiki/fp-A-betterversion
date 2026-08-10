import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ROLE_PERMISSIONS } from '@/store/authStore';
import { PILLARS, LEGACY_NAV_ITEMS, type Pillar, type PillarNavItem } from '@/types/navigation';

/**
 * Role-aware navigation filtering (F-03, PRD E1.1 AC1).
 *
 * Items with a `permission` key are shown only when the active role holds that
 * permission. Items without a key are visible to all roles. This is a
 * presentation filter; data authorization remains server-side (F-04).
 */
export function filterNavItemsByRole<T extends { permission?: string }>(
  items: readonly T[],
  role: string
): T[] {
  const granted = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] ?? [];
  return items.filter((item) => !item.permission || granted.includes(item.permission));
}

export function usePillarNavigation(): {
  pillars: Pillar[];
  legacyItems: readonly PillarNavItem[];
  role: string;
} {
  const role = useAuthStore((s) => s.user?.role ?? 'Viewer');

  const pillars = useMemo(
    () =>
      PILLARS.map((pillar) => ({
        ...pillar,
        items: filterNavItemsByRole(pillar.items, role),
      })),
    [role]
  );

  const legacyItems = useMemo(() => [...LEGACY_NAV_ITEMS], []);

  return { pillars, legacyItems, role };
}
