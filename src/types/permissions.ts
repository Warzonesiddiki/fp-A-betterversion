/**
 * Granular Row & Column Permission Types — Data-Level RBAC
 *
 * Extends the existing rbacEnforcer (which controls ACTION-level permissions
 * like budget:create, budget:delete) with DATA-level permissions that filter
 * which rows and columns a user can see.
 *
 * Example: A departmental reviewer can see their department's budget rows
 * but NOT executive compensation rows. An analyst can see revenue columns
 * but NOT HR salary columns.
 */

// ─── Permission Scope ──────────────────────────────────────────────────────

/**
 * A data-level permission grant.
 * Defines which data a user can access within a specific context.
 */
export interface DataPermission {
  /** Unique permission ID */
  readonly id: string;
  /** User or role this permission applies to */
  readonly principal: PermissionPrincipal;
  /** The resource this permission covers */
  readonly resource: PermissionResource;
  /** What actions are allowed on this data */
  readonly actions: readonly DataAction[];
  /** Row-level filters */
  readonly rowFilters: readonly RowFilter[];
  /** Column-level filters */
  readonly columnFilters: readonly ColumnFilter[];
  /** Whether this permission is currently active */
  readonly isActive: boolean;
  /** When this permission expires (null = never) */
  readonly expiresAt: string | null;
  /** Who granted this permission */
  readonly grantedBy: string;
  /** When it was granted */
  readonly grantedAt: string;
}

export type PermissionPrincipal =
  | { readonly type: 'user'; readonly userId: string }
  | { readonly type: 'role'; readonly roleName: string }
  | { readonly type: 'group'; readonly groupId: string };

export type PermissionResource =
  | { readonly type: 'budget'; readonly budgetId: string | '*' }
  | { readonly type: 'forecast'; readonly forecastId: string | '*' }
  | { readonly type: 'scenario'; readonly scenarioId: string | '*' }
  | { readonly type: 'report'; readonly reportId: string | '*' }
  | { readonly type: 'global' };

export type DataAction = 'read' | 'write' | 'export' | 'approve';

// ─── Row Filter ────────────────────────────────────────────────────────────

/**
 * A filter that restricts which ROWS (records) a user can see.
 * Applied as a predicate on the data grid.
 */
export interface RowFilter {
  /** Unique filter ID */
  readonly id: string;
  /** The field to filter on (e.g., 'department', 'entity', 'accountCode') */
  readonly field: string;
  /** Filter operator */
  readonly operator: RowFilterOperator;
  /** The filter value(s) */
  readonly values: readonly (string | number)[];
  /** Whether to hide the row entirely (true) or just mask the values (false) */
  readonly hardHide: boolean;
}

export type RowFilterOperator =
  | 'equals'
  | 'not-equals'
  | 'in'
  | 'not-in'
  | 'startsWith'
  | 'between';

// ─── Column Filter ─────────────────────────────────────────────────────────

/**
 * A filter that restricts which COLUMNS (fields) a user can see.
 * Applied as a column visibility/masking rule on the data grid.
 */
export interface ColumnFilter {
  /** Unique filter ID */
  readonly id: string;
  /** The column/field to restrict */
  readonly field: string;
  /** Whether the column is visible */
  readonly visible: boolean;
  /** Whether to mask values (show '****' instead of actual data) */
  readonly masked: boolean;
  /** Whether the column is read-only (even if visible) */
  readonly readOnly: boolean;
}

// ─── Filtered Data View ────────────────────────────────────────────────────

/**
 * The result of applying row and column filters to a dataset.
 * Used by the data grid to render the filtered view.
 */
export interface FilteredDataView<T = Record<string, unknown>> {
  /** The filtered rows */
  readonly rows: readonly T[];
  /** Visible column names (in display order) */
  readonly visibleColumns: readonly string[];
  /** Masked column names (values replaced with '****') */
  readonly maskedColumns: readonly string[];
  /** Read-only column names */
  readonly readOnlyColumns: readonly string[];
  /** Total rows before filtering */
  readonly totalRows: number;
  /** Total rows after filtering */
  readonly filteredRows: number;
  /** Whether any filters were applied */
  readonly isFiltered: boolean;
}

// ─── Permission Store Shape ────────────────────────────────────────────────

export interface DataPermissionState {
  /** All active data permissions */
  readonly permissions: readonly DataPermission[];
  /** The current user's effective permissions (computed) */
  readonly effectivePermissions: readonly DataPermission[];
  /** Whether permissions have been loaded */
  readonly isLoaded: boolean;
}
