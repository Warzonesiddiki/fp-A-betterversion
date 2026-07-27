/**
 * Data Permission Filter — Row/Column Level RBAC
 *
 * Filters datasets based on data-level permissions, restricting which
 * rows and columns a user can see. Works alongside the action-level
 * rbacEnforcer to provide complete data isolation.
 *
 * @module dataPermissionFilter
 */

import type {
  DataPermission,
  RowFilter,
  ColumnFilter,
  FilteredDataView,
  RowFilterOperator,
} from '@/types/permissions';

// ─── Row Filtering ─────────────────────────────────────────────────────────

/**
 * Apply row filters to a dataset.
 * Returns only the rows that pass ALL active filters.
 */
export function applyRowFilters<T extends Record<string, unknown>>(
  rows: readonly T[],
  filters: readonly RowFilter[]
): T[] {
  if (filters.length === 0) return [...rows];

  return rows.filter((row) => filters.every((filter) => matchesFilter(row, filter)));
}

/**
 * Check if a single row matches a row filter.
 */
function matchesFilter<T extends Record<string, unknown>>(row: T, filter: RowFilter): boolean {
  const value = row[filter.field];

  switch (filter.operator) {
    case 'equals':
      return value === filter.values[0];
    case 'not-equals':
      return value !== filter.values[0];
    case 'in':
      return filter.values.includes(value as string | number);
    case 'not-in':
      return !filter.values.includes(value as string | number);
    case 'startsWith':
      return typeof value === 'string' && filter.values.some((v) => value.startsWith(String(v)));
    case 'between': {
      const num = Number(value);
      const min = Number(filter.values[0] ?? -Infinity);
      const max = Number(filter.values[1] ?? Infinity);
      return num >= min && num <= max;
    }
    default:
      return true;
  }
}

// ─── Column Filtering ──────────────────────────────────────────────────────

/**
 * Apply column filters to determine visible, masked, and read-only columns.
 */
export function applyColumnFilters(
  allColumns: readonly string[],
  filters: readonly ColumnFilter[]
): {
  visibleColumns: string[];
  maskedColumns: string[];
  readOnlyColumns: string[];
} {
  if (filters.length === 0) {
    return {
      visibleColumns: [...allColumns],
      maskedColumns: [],
      readOnlyColumns: [],
    };
  }

  const filterMap = new Map(filters.map((f) => [f.field, f]));
  const visibleColumns: string[] = [];
  const maskedColumns: string[] = [];
  const readOnlyColumns: string[] = [];

  for (const col of allColumns) {
    const filter = filterMap.get(col);
    if (!filter || filter.visible) {
      visibleColumns.push(col);
      if (filter?.masked) maskedColumns.push(col);
      if (filter?.readOnly) readOnlyColumns.push(col);
    }
  }

  return { visibleColumns, maskedColumns, readOnlyColumns };
}

/**
 * Mask values in specified columns.
 */
export function maskRowValues<T extends Record<string, unknown>>(
  row: T,
  maskedColumns: readonly string[]
): T {
  if (maskedColumns.length === 0) return row;

  const masked = { ...row };
  for (const col of maskedColumns) {
    if (col in masked) {
      (masked as Record<string, unknown>)[col] = '****';
    }
  }
  return masked;
}

// ─── Full Filtered View ────────────────────────────────────────────────────

/**
 * Apply all data permissions to produce a complete filtered view.
 */
export function applyDataPermissions<T extends Record<string, unknown>>(
  rows: readonly T[],
  allColumns: readonly string[],
  permissions: readonly DataPermission[]
): FilteredDataView<T> {
  // Collect all row filters from active permissions
  const rowFilters: RowFilter[] = [];
  const columnFilters: ColumnFilter[] = [];

  for (const perm of permissions) {
    if (perm.isActive) {
      rowFilters.push(...perm.rowFilters);
      columnFilters.push(...perm.columnFilters);
    }
  }

  // Apply row filters
  const filteredRows = applyRowFilters(rows, rowFilters);

  // Apply column filters
  const { visibleColumns, maskedColumns, readOnlyColumns } = applyColumnFilters(
    allColumns,
    columnFilters
  );

  // Mask values in masked columns
  const processedRows = filteredRows.map((row) => maskRowValues(row, maskedColumns));

  return {
    rows: processedRows,
    visibleColumns,
    maskedColumns,
    readOnlyColumns,
    totalRows: rows.length,
    filteredRows: processedRows.length,
    isFiltered: rowFilters.length > 0 || columnFilters.length > 0,
  };
}

// ─── Permission Evaluation ─────────────────────────────────────────────────

/**
 * Get effective permissions for a user from a set of permission grants.
 */
export function getEffectivePermissions(
  permissions: readonly DataPermission[],
  userId: string,
  roles: readonly string[]
): DataPermission[] {
  const now = new Date().toISOString();

  return permissions.filter((perm) => {
    if (!perm.isActive) return false;
    if (perm.expiresAt && perm.expiresAt < now) return false;

    const principal = perm.principal;
    switch (principal.type) {
      case 'user':
        return principal.userId === userId;
      case 'role':
        return roles.includes(principal.roleName);
      case 'group':
        // Group membership check would go here
        return false;
      default:
        return false;
    }
  });
}

/**
 * Check if a user has a specific data action on a resource.
 */
export function hasDataPermission(
  permissions: readonly DataPermission[],
  userId: string,
  roles: readonly string[],
  action: string,
  resourceType: string,
  resourceId: string
): boolean {
  const effective = getEffectivePermissions(permissions, userId, roles);

  return effective.some((perm) => {
    // Check resource match
    const resource = perm.resource;
    if (resource.type !== resourceType && resource.type !== 'global') return false;
    if (
      resource.type !== 'global' &&
      'budgetId' in resource &&
      resource.budgetId !== '*' &&
      resource.budgetId !== resourceId
    )
      return false;

    // Check action
    return perm.actions.includes(action as 'read' | 'write' | 'export' | 'approve');
  });
}
