import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ROLE_PERMISSIONS, useAuthStore } from '@/store/authStore';
import {
  NAV_SECTIONS,
  findActiveSectionId,
  type NavItem,
  type NavSection,
} from '@/types/navigation';

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

/**
 * The sidebar view of the navigation manifest (UI-03).
 *
 * Hidden alias entries are dropped, items the role may not see are filtered
 * out, and any group or section left empty by that filtering is removed so the
 * rail never renders a heading with nothing under it.
 */
export function useAppNavigation(): {
  sections: NavSection[];
  activeSectionId: string | undefined;
  role: string;
} {
  const role = useAuthStore((s) => s.user?.role ?? 'Viewer');
  const { pathname } = useLocation();

  const sections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        groups: section.groups
          .map((group) => ({
            ...group,
            items: filterNavItemsByRole(
              group.items.filter((item) => !item.hidden),
              role
            ) as NavItem[],
          }))
          .filter((group) => group.items.length > 0),
      })).filter((section) => section.groups.length > 0),
    [role]
  );

  const activeSectionId = useMemo(() => findActiveSectionId(pathname), [pathname]);

  return { sections, activeSectionId, role };
}
