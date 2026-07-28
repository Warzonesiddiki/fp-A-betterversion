/**
 * RBAC Enforcer — Production-grade permission check wrapper for Zustand stores
 *
 * P0A-18 RBAC + Permissions Propagation Map (Hera T-4.30 SHIPPED 2026-06-18)
 *
 * Provides a clean, type-safe API for wrapping store actions with permission checks.
 * Integrates with the existing authStore helpers (hasPermission, hasAnyPermission, etc.)
 *
 * @example Wrap a single action:
 * ```ts
 * import { enforce } from '@/utils/rbacEnforcer';
 *
 * createBudget: enforce('budget:create', (budget) => {
 *   // ...existing logic
 * })
 * ```
 *
 * @example Wrap multiple actions:
 * ```ts
 * import { enforceMany } from '@/utils/rbacEnforcer';
 *
 * return enforceMany(set, get, {
 *   createBudget: 'budget:create',
 *   updateBudget: 'budget:update',
 *   deleteBudget: 'budget:delete',
 *   approveBudget: 'budget:approve',
 * }, {
 *   createBudget: (budget) => { /* ... *\/ },
 *   updateBudget: (id, updates) => { /* ... *\/ },
 *   deleteBudget: (id) => { /* ... *\/ },
 *   approveBudget: (id) => { /* ... *\/ },
 * })
 * ```
 */

import type { StateCreator } from 'zustand';
import { hasPermission, useAuthStore } from '../store/authStore';
import type { User } from '../types';
import { createLogger } from '@/utils/logger';

const rbacEnforcerLogger = createLogger('RBAC');

// ============================================================================
// Types
// ============================================================================

/**
 * Custom error thrown when a user lacks the required permission for an action.
 * Captures user context + permission for audit logging.
 */
export class PermissionError extends Error {
  readonly permission: string;
  readonly userId: string | null;
  readonly timestamp: string;
  readonly action: string;

  constructor(permission: string, action: string, userId: string | null = null) {
    super(
      `[RBAC] Permission denied: '${permission}' required for action '${action}'${
        userId ? ` (user: ${userId})` : ' (no user)'
      }`
    );
    this.name = 'PermissionError';
    this.permission = permission;
    this.action = action;
    this.userId = userId;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Options for permission enforcement behavior.
 */
export interface EnforceOptions {
  /**
   * If true, throw PermissionError when permission is missing.
   * If false, silently no-op (returns undefined) and logs to console.warn.
   * Default: true
   */
  throwOnDeny?: boolean;

  /**
   * Optional audit logger. Called on every permission check (allow + deny).
   * Use this for SOC2 CC6.8 + ISO 27001:2022 A.8.15 audit trail compliance.
   */
  onCheck?: (event: {
    action: string;
    permission: string | string[];
    granted: boolean;
    user: User | null;
    timestamp: string;
  }) => void;
}

// ============================================================================
// Core: getCurrentUser
// ============================================================================

/**
 * Safely retrieve the current authenticated user.
 * Returns null if authStore is not yet initialized or user is logged out.
 */
export function getCurrentUser(): User | null {
  try {
    return useAuthStore.getState().user;
  } catch {
    return null;
  }
}

// ============================================================================
// Core: enforce (single action)
// ============================================================================

/**
 * Wrap a single store action with permission enforcement.
 *
 * @param permission - The permission string (e.g., 'budget:create') OR array (any-of)
 * @param action - The action name (used for error context + audit log)
 * @param fn - The actual store action implementation
 * @param options - Behavior options (throwOnDeny, onCheck audit logger)
 * @returns Wrapped function that checks permission before invoking fn
 *
 * @throws {PermissionError} If user lacks the permission (when throwOnDeny=true)
 */
export function enforce<TArgs extends unknown[], TReturn>(
  permission: string | string[],
  action: string,
  fn: (...args: TArgs) => TReturn,
  options: EnforceOptions = {}
): (...args: TArgs) => TReturn {
  const { throwOnDeny = true, onCheck } = options;

  return (...args: TArgs): TReturn => {
    const user = getCurrentUser();
    const perms = Array.isArray(permission) ? permission : [permission];
    const hasAny = perms.some((p) => {
      return hasPermission(user, p);
    });
    const granted = hasAny;

    // Audit log callback
    onCheck?.({
      action,
      permission,
      granted,
      user,
      timestamp: new Date().toISOString(),
    });

    if (!granted) {
      const permStr = Array.isArray(permission) ? permission.join('|') : permission;
      if (throwOnDeny) {
        throw new PermissionError(permStr, action, user?.id ?? null);
      } else {
        rbacEnforcerLogger.warn('Permission denied (silent)', {
          permission: permStr,
          action,
          userId: user?.id ?? null,
        });
        return undefined as TReturn;
      }
    }

    return fn(...args);
  };
}

// ============================================================================
// Core: enforceMany (multiple actions)
// ============================================================================

/**
 * Wrap multiple store actions with permission enforcement in a single call.
 * Useful for store initialization where many actions need guards.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param permissionMap - Map of action name → required permission(s)
 * @param handlers - Map of action name → original handler function
 * @param options - Behavior options applied to all actions
 * @returns Object with wrapped handlers, ready to be merged into store state
 *
 * @example
 * ```ts
 * export const useBudgetStore = create<BudgetState>()(
 *   subscribeWithSelector(
 *     persist(
 *       immer((set, get) => {
 *         const state = {
 *           budgets: [],
 *           // ... read-only setters don't need enforcement
 *           setBudgets: (budgets) => set((s) => { s.budgets = budgets; }),
 *
 *           // Write actions get wrapped:
 *           ...enforceMany(set, get, {
 *             createBudget: 'budget:create',
 *             updateBudget: 'budget:update',
 *             deleteBudget: 'budget:delete',
 *             approveBudget: 'budget:approve',
 *           }, {
 *             createBudget: (budget) => { /* ... *\/ },
 *             updateBudget: (id, updates) => { /* ... *\/ },
 *             deleteBudget: (id) => { /* ... *\/ },
 *             approveBudget: (id) => { /* ... *\/ },
 *           }, { throwOnDeny: true }),
 *         };
 *         return state;
 *       }),
 *       { name: 'budget-store', storage: masterStorage }
 *     )
 *   )
 * );
 * ```
 */
export function enforceMany<TState extends Record<string, unknown>, TKeys extends keyof TState>(
  _set: (recipe: (state: TState) => void, shouldReplace?: false) => void,
  _get: () => TState,
  permissionMap: Partial<Record<TKeys, string | string[]>>,
  handlers: Pick<TState, TKeys>,
  options: EnforceOptions = {}
): Pick<TState, TKeys> {
  const wrapped = {} as Pick<TState, TKeys>;

  for (const keyStr of Object.keys(handlers)) {
    const key = keyStr as TKeys;
    const permission = permissionMap[key];
    const handler = handlers[key];

    if (!permission || typeof handler !== 'function') {
      // No permission required OR not a function — passthrough
      wrapped[key] = handler;
      continue;
    }

    wrapped[key] = enforce(permission, String(key), handler as never, options) as TState[TKeys];
  }

  return wrapped;
}

// ============================================================================
// Core: withAudit (decorator pattern alternative)
// ============================================================================

/**
 * Create an audit logger that records permission checks to a callback.
 * Use this to wire RBAC events to your audit store / SOC2 CC6.8 compliance trail.
 *
 * @param auditLogger - Function that receives audit events (typically writes to auditStore)
 * @returns EnforceOptions with onCheck wired up
 *
 * @example
 * ```ts
 * import { withAudit } from '@/utils/rbacEnforcer';
 * import { useAuditStore } from '@/store/auditStore';
 *
 * const auditOptions = withAudit((event) => {
 *   useAuditStore.getState().logEvent({
 *     type: 'rbac_check',
 *     action: event.action,
 *     permission: event.permission,
 *     granted: event.granted,
 *     userId: event.user?.id ?? null,
 *     timestamp: event.timestamp,
 *   });
 * });
 *
 * createBudget: enforce('budget:create', 'createBudget', handler, auditOptions)
 * ```
 */
export function withAudit(auditLogger: NonNullable<EnforceOptions['onCheck']>): EnforceOptions {
  return { onCheck: auditLogger };
}

// ============================================================================
// Convenience: Permission constants
// ============================================================================

/**
 * Canonical permission strings used across the application.
 * Mirrors the Permission type in src/store/authStore.ts.
 * Importing from this file ensures typo-safe usage.
 */
export const Permissions = {
  // Budget
  BUDGET_READ: 'budget:read',
  BUDGET_CREATE: 'budget:create',
  BUDGET_UPDATE: 'budget:update',
  BUDGET_DELETE: 'budget:delete',
  BUDGET_APPROVE: 'budget:approve',

  // Forecast
  FORECAST_READ: 'forecast:read',
  FORECAST_CREATE: 'forecast:create',
  FORECAST_UPDATE: 'forecast:update',
  FORECAST_DELETE: 'forecast:delete',
  FORECAST_RUN: 'forecast:run',

  // Scenario
  SCENARIO_READ: 'scenario:read',
  SCENARIO_CREATE: 'scenario:create',
  SCENARIO_UPDATE: 'scenario:update',
  SCENARIO_DELETE: 'scenario:delete',
  SCENARIO_LOCK: 'scenario:lock',

  // Report
  REPORT_READ: 'report:read',
  REPORT_CREATE: 'report:create',
  REPORT_UPDATE: 'report:update',
  REPORT_DELETE: 'report:delete',
  REPORT_EXPORT: 'report:export',
  REPORT_SCHEDULE: 'report:schedule',

  // GL
  GL_READ: 'gl:read',
  GL_UPLOAD: 'gl:upload',
  GL_MAP: 'gl:map',
  GL_RECONCILE: 'gl:reconcile',

  // Entity
  ENTITY_READ: 'entity:read',
  ENTITY_CREATE: 'entity:create',
  ENTITY_UPDATE: 'entity:update',
  ENTITY_DELETE: 'entity:delete',

  // User
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ASSIGN_ROLE: 'user:assign-role',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // Audit
  AUDIT_READ: 'audit:read',
  AUDIT_EXPORT: 'audit:export',
  AUDIT_CREATE: 'audit:create',
  AUDIT_UPDATE: 'audit:update',
  AUDIT_DELETE: 'audit:delete',

  // Encryption
  ENCRYPTION_READ: 'encryption:read',
  ENCRYPTION_ROTATE_KEYS: 'encryption:rotate-keys',

  // Export
  EXPORT_DATA: 'export:data',
  EXPORT_AUDIT_LOG: 'export:audit-log',

  // Import
  IMPORT_READ: 'import:read',
  IMPORT_CREATE: 'import:create',
  IMPORT_UPDATE: 'import:update',
  IMPORT_DELETE: 'import:delete',

  // OLAP Cube
  CUBE_READ: 'cube:read',
  CUBE_WRITE: 'cube:write',
  CUBE_DELETE: 'cube:delete',
  CUBE_ADMIN: 'cube:admin',
  CUBE_SNAPSHOT: 'cube:snapshot',
  CUBE_UNDO: 'cube:undo',

  // Dashboard
  DASHBOARD_READ: 'dashboard:read',
  DASHBOARD_CREATE: 'dashboard:create',
  DASHBOARD_UPDATE: 'dashboard:update',
  DASHBOARD_DELETE: 'dashboard:delete',

  // Auth
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_REFRESH: 'auth:refresh',
  AUTH_MFA_SETUP: 'auth:mfa-setup',
  // Workflow
  WORKFLOW_READ: 'workflow:read',
  WORKFLOW_CREATE: 'workflow:create',
  WORKFLOW_UPDATE: 'workflow:update',
  WORKFLOW_DELETE: 'workflow:delete',
  WORKFLOW_APPROVE: 'workflow:approve',

  // Collaboration
  COLLAB_READ: 'collab:read',
  COLLAB_UPDATE: 'collab:update',
  COLLAB_DELETE: 'collab:delete',

  // Notification
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_CREATE: 'notification:create',
  NOTIFICATION_UPDATE: 'notification:update',
  NOTIFICATION_DELETE: 'notification:delete',

  // Driver (financial)
  DRIVER_READ: 'driver:read',
  DRIVER_CREATE: 'driver:create',
  DRIVER_UPDATE: 'driver:update',
  DRIVER_DELETE: 'driver:delete',

  // CAPEX (capital expenditure)
  CAPEX_READ: 'capex:read',
  CAPEX_CREATE: 'capex:create',
  CAPEX_UPDATE: 'capex:update',
  CAPEX_DELETE: 'capex:delete',
  CAPEX_APPROVE: 'capex:approve',

  // Variance
  VARIANCE_READ: 'variance:read',
  VARIANCE_CREATE: 'variance:create',
  VARIANCE_UPDATE: 'variance:update',
  VARIANCE_DELETE: 'variance:delete',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_CREATE: 'analytics:create',
  ANALYTICS_UPDATE: 'analytics:update',
  ANALYTICS_DELETE: 'analytics:delete',

  // Inventory (retail/sector stores)
  INVENTORY_READ: 'inventory:read',
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',

  // UI
  UI_READ: 'ui:read',
  UI_UPDATE: 'ui:update',
} as const;

export type PermissionString = (typeof Permissions)[keyof typeof Permissions];

// ============================================================================
// Type-safe state creator wrapper
// ============================================================================

/**
 * Type-safe wrapper for Zustand StateCreator that automatically applies
 * permission enforcement to all write actions in the permission map.
 *
 * @param permissionMap - Map of action name → required permission(s)
 * @param options - Behavior options applied to all actions
 * @returns Higher-order function that wraps a StateCreator with RBAC enforcement
 *
 * @example
 * ```ts
 * export const useBudgetStore = create<BudgetState>()(
 *   subscribeWithSelector(
 *     persist(
 *       withRBAC<BudgetState>({
 *         createBudget: Permissions.BUDGET_CREATE,
 *         updateBudget: Permissions.BUDGET_UPDATE,
 *         deleteBudget: Permissions.BUDGET_DELETE,
 *         approveBudget: Permissions.BUDGET_APPROVE,
 *       })(immer((set, get) => ({
 *         budgets: [],
 *         // ... state + handlers
 *       }))),
 *       { name: 'budget-store', storage: masterStorage }
 *     )
 *   )
 * );
 * ```
 */
export function withRBAC<TState extends Record<string, unknown>>(
  permissionMap: Partial<Record<keyof TState, string | string[]>>,
  options: EnforceOptions = {}
) {
  return (
    creator: StateCreator<
      TState,
      [
        ['zustand/subscribeWithSelector', never],
        ['zustand/persist', unknown],
        ['zustand/immer', never],
      ],
      [],
      TState
    >
  ): StateCreator<
    TState,
    [
      ['zustand/subscribeWithSelector', never],
      ['zustand/persist', unknown],
      ['zustand/immer', never],
    ],
    [],
    TState
  > => {
    return (set, get, api) => {
      const originalState = creator(set, get, api);

      // Wrap write actions with permission checks
      const wrappedState = { ...originalState };
      for (const keyStr of Object.keys(permissionMap)) {
        const key = keyStr as keyof TState;
        const permission = permissionMap[key];
        const original = originalState[key];

        if (permission && typeof original === 'function') {
          wrappedState[key] = enforce(
            permission,
            String(key),
            original.bind(wrappedState),
            options
          ) as TState[keyof TState];
        }
      }

      return wrappedState;
    };
  };
}

// ============================================================================
// Default export: convenience re-exports
// ============================================================================

export default {
  enforce,
  enforceMany,
  withAudit,
  withRBAC,
  getCurrentUser,
  Permissions,
  PermissionError,
};
